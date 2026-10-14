import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { dbService, hashPassword, verifyPassword, ROOT_ADMIN_EMAIL, ROOT_ADMIN_EMAILS, isRootAdminEmail, UserRecord } from './db';
import { mailerService } from './mailer';

export const apiRouter = Router();

// Middleware to extract authenticated user
export function getAuthenticatedUser(req: Request): UserRecord | null {
  const token = req.cookies?.arp_session || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const session = dbService.getSession(token);
  if (!session) return null;
  const user = dbService.getUserById(session.userId);
  if (!user || user.status !== 'APPROVED') return null;
  return user;
}

function requireAuth(req: Request, res: Response, next: Function) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Session non authentifiée ou compte non approuvé.' });
  }
  (req as any).user = user;
  next();
}

function requireAdmin(req: Request, res: Response, next: Function) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authentification requise.' });
  }
  const isSuper = isRootAdminEmail(user.email) || user.role === 'SUPERADMIN' || user.role === 'ADMIN';
  if (!isSuper) {
    return res.status(403).json({ success: false, error: 'Accès réservé aux administrateurs.' });
  }
  (req as any).user = user;
  next();
}

function sanitizeUser(user: UserRecord) {
  const { passwordHash, resetToken, resetTokenExpires, ...safe } = user;
  return safe;
}

// ----------------- AUTH ROUTES -----------------

// POST /api/auth/register
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, username, password, jobTitle, organization } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Veuillez renseigner votre nom, adresse e-mail et mot de passe.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Le mot de passe doit comporter au moins 6 caractères.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = (username || cleanEmail.split('@')[0] || name.toLowerCase().replace(/[^a-z0-9]/g, '')).toLowerCase().trim();
    const validJobTitle = (jobTitle && ['Ingénieur', 'Expert', 'Étudiant'].includes(jobTitle)) ? jobTitle : (jobTitle || 'Ingénieur');

    const existing = dbService.getUserByEmailOrUsername(cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Un compte avec cette adresse e-mail existe déjà.' });
    }

    const passwordHash = await hashPassword(password);
    const isRootAdmin = isRootAdminEmail(cleanEmail);

    const newUser: UserRecord = {
      id: `user-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      name: name.trim(),
      email: cleanEmail,
      username: cleanUsername,
      jobTitle: validJobTitle,
      role: isRootAdmin ? 'SUPERADMIN' : 'ENGINEER',
      status: isRootAdmin ? 'APPROVED' : 'PENDING',
      passwordHash,
      organization: organization?.trim() || 'Bureau d’Études',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dbService.addUser(newUser);

    dbService.addActivityLog({
      id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      timestamp: new Date().toISOString(),
      type: 'REGISTER',
      userEmail: newUser.email,
      userName: newUser.name,
      details: isRootAdmin
        ? 'Création directe administrateur'
        : `Demande d’accès (${validJobTitle}) soumise à validation administrateur`
    });

    // Host URL for links
    const appUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

    // Notify all administrators
    if (!isRootAdmin) {
      mailerService.notifyAdminNewRegistration(newUser, appUrl).catch(err => {
        console.error('Failed to notify admin by email:', err);
      });
    }

    if (isRootAdmin) {
      const token = dbService.createSession(newUser.id);
      res.cookie('arp_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax'
      });
      return res.json({
        success: true,
        message: 'Compte administrateur principal activé directement.',
        user: sanitizeUser(newUser),
        token
      });
    }

    return res.json({
      success: true,
      status: 'PENDING',
      message: 'Votre demande d’accès a été enregistrée avec succès. Elle a été transmise à l’administrateur pour approbation. Vous recevrez une notification par e-mail dès sa validation.'
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, error: 'Erreur serveur lors de l’inscription.' });
  }
});

// POST /api/auth/login
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password, requireAdmin } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, error: 'Veuillez saisir votre identifiant/e-mail et votre mot de passe.' });
    }

    const user = dbService.getUserByEmailOrUsername(identifier);
    if (!user) {
      dbService.addActivityLog({
        id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        timestamp: new Date().toISOString(),
        type: 'LOGIN_FAILED',
        userEmail: identifier,
        details: requireAdmin ? 'Tentative de connexion administrateur : identifiant inconnu' : 'Tentative de connexion : identifiant inconnu'
      });
      return res.status(401).json({ success: false, error: 'Identifiants incorrects ou utilisateur inexistant.' });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      dbService.addActivityLog({
        id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        timestamp: new Date().toISOString(),
        type: 'LOGIN_FAILED',
        userEmail: user.email,
        userName: user.name,
        details: requireAdmin ? 'Tentative de connexion administrateur : mot de passe erroné' : 'Échec de connexion : mot de passe erroné'
      });
      return res.status(401).json({ success: false, error: 'Mot de passe incorrect.' });
    }

    // If logging in through dedicated admin portal, verify administrator privileges
    const isUserAdmin = isRootAdminEmail(user.email) || user.role === 'SUPERADMIN' || user.role === 'ADMIN';
    if (requireAdmin && !isUserAdmin) {
      dbService.addActivityLog({
        id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        timestamp: new Date().toISOString(),
        type: 'LOGIN_FAILED',
        userEmail: user.email,
        userName: user.name,
        details: 'Refus d’accès portail administrateur : privilèges insuffisants'
      });
      return res.status(403).json({
        success: false,
        error: 'Accès refusé : Ce compte utilisateur ne dispose pas des droits d’administration.'
      });
    }

    // Check approval status
    if (user.status === 'PENDING') {
      return res.status(403).json({
        success: false,
        status: 'PENDING',
        error: "Votre compte est en attente d'approbation par l'administrateur. Vous ne pouvez pas encore accéder aux calculs ARP."
      });
    }

    if (user.status === 'REJECTED') {
      return res.status(403).json({
        success: false,
        status: 'REJECTED',
        error: `Votre demande d'accès a été refusée par l'administrateur.${user.statusReason ? ` Motif : ${user.statusReason}` : ''}`
      });
    }

    if (user.status === 'DEACTIVATED') {
      return res.status(403).json({
        success: false,
        status: 'DEACTIVATED',
        error: 'Votre compte a été désactivé par l’administrateur.'
      });
    }

    // Approved: create session
    dbService.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
    const token = dbService.createSession(user.id);

    dbService.addActivityLog({
      id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      timestamp: new Date().toISOString(),
      type: 'LOGIN',
      userEmail: user.email,
      userName: user.name,
      details: requireAdmin
        ? 'Connexion réussie via le portail administrateur'
        : `Connexion réussie (Rôle: ${user.role})`
    });

    res.cookie('arp_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    return res.json({
      success: true,
      user: sanitizeUser(user),
      token,
      isAdminLogin: !!requireAdmin
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Erreur interne lors de la connexion.' });
  }
});

// GET /api/auth/me
apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.json({ success: false, user: null });
  }
  return res.json({ success: true, user: sanitizeUser(user) });
});

// POST /api/auth/logout
apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const token = req.cookies?.arp_session || req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    dbService.deleteSession(token);
  }
  res.clearCookie('arp_session');
  return res.json({ success: true, message: 'Déconnexion effectuée.' });
});

// POST /api/auth/forgot-password
apiRouter.post('/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Veuillez saisir votre adresse e-mail.' });
    }

    const clean = email.toLowerCase().trim();
    let user = dbService.getUsers().find(u => u.email.toLowerCase() === clean);

    // If it is an authorized root administrator email and not yet in database, provision it immediately
    if (!user && isRootAdminEmail(clean)) {
      const defaultHash = await hashPassword('Admin@ARP2022!');
      user = {
        id: `user-admin-${clean.replace(/[^a-zA-Z0-9]/g, '')}`,
        name: clean.includes('youcef') ? 'Administrateur Youcef' : 'Administrateur Principal',
        email: clean,
        username: clean.split('@')[0],
        role: 'SUPERADMIN',
        status: 'APPROVED',
        passwordHash: defaultHash,
        organization: 'Bureau d’Études ARP - Administration Centrale',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      dbService.addUser(user);
    }

    let resetToken: string | undefined;
    let resetLink: string | undefined;

    if (user) {
      resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = Date.now() + 60 * 60 * 1000; // 1 hour

      dbService.updateUser(user.id, { resetToken, resetTokenExpires });

      const appUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
      resetLink = `${appUrl}?view=reset-password&token=${resetToken}`;

      await mailerService.sendPasswordResetLink(user, resetLink);
      dbService.addActivityLog({
        id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        timestamp: new Date().toISOString(),
        type: 'PASSWORD_RESET_REQUEST',
        userEmail: user.email,
        userName: user.name,
        details: 'Lien de réinitialisation généré (valide 1h)'
      });
    }

    const smtpConfigured = mailerService.isConfigured();

    return res.json({
      success: true,
      userFound: !!user,
      isSmtpConfigured: smtpConfigured,
      directResetUrl: resetLink,
      resetToken: resetToken,
      resetCode: resetToken ? resetToken.slice(0, 6).toUpperCase() : undefined,
      message: smtpConfigured
        ? 'Si cette adresse e-mail est associée à un compte, un lien de réinitialisation sécurisé (valide 1h) vous a été envoyé par e-mail.'
        : 'Demande validée. Aucun serveur SMTP externe (Gmail) n’étant relié pour l’envoi automatique dans cet environnement, vous pouvez changer votre mot de passe immédiatement ci-dessous.'
    });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ success: false, error: 'Erreur lors de l’envoi de la réinitialisation.' });
  }
});

// Common handler for reset password
async function handleResetPassword(req: Request, res: Response) {
  try {
    const { token, email, newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ success: false, error: 'Nouveau mot de passe requis.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Le nouveau mot de passe doit comporter au moins 6 caractères.' });
    }

    let user: UserRecord | undefined;

    if (token) {
      user = dbService.getUserByResetToken(token);
    }

    // Direct recovery for authorized administrator by email
    if (!user && email && isRootAdminEmail(email)) {
      user = dbService.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (!user) {
        const defaultHash = await hashPassword(newPassword);
        user = {
          id: `user-admin-${email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')}`,
          name: email.includes('youcef') ? 'Administrateur Youcef' : 'Administrateur Principal',
          email: email.toLowerCase().trim(),
          username: email.split('@')[0],
          role: 'SUPERADMIN',
          status: 'APPROVED',
          passwordHash: defaultHash,
          organization: 'Bureau d’Études ARP - Administration Centrale',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        dbService.addUser(user);
      }
    }

    if (!user) {
      return res.status(400).json({ success: false, error: 'Ce lien ou code de réinitialisation est invalide ou a expiré.' });
    }

    const passwordHash = await hashPassword(newPassword);
    dbService.updateUser(user.id, {
      passwordHash,
      resetToken: undefined,
      resetTokenExpires: undefined,
      lastLoginAt: new Date().toISOString()
    });

    // Auto-create session so user is immediately connected
    const sessionToken = dbService.createSession(user.id);

    dbService.addActivityLog({
      id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      timestamp: new Date().toISOString(),
      type: 'PASSWORD_RESET',
      userEmail: user.email,
      userName: user.name,
      details: 'Mot de passe modifié avec succès et session activée'
    });

    res.cookie('arp_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    return res.json({
      success: true,
      message: 'Votre mot de passe a été modifié avec succès. Vous êtes désormais connecté.',
      user: sanitizeUser(user),
      token: sessionToken
    });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour du mot de passe.' });
  }
}

// POST /api/auth/reset-password
apiRouter.post('/api/auth/reset-password', handleResetPassword);

// POST /auth/reset-password
apiRouter.post('/auth/reset-password', handleResetPassword);

// ----------------- ADMIN ROUTES (Protected) -----------------

// GET /api/admin/users
apiRouter.get('/admin/users', requireAdmin, (req: Request, res: Response) => {
  const users = dbService.getUsers().map(sanitizeUser);
  return res.json({ success: true, users, rootAdminEmail: ROOT_ADMIN_EMAIL });
});

// PUT /api/admin/users/:id/status
apiRouter.put('/admin/users/:id/status', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['APPROVED', 'REJECTED', 'DEACTIVATED', 'PENDING'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Statut invalide.' });
    }

    const user = dbService.getUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur introuvable.' });
    }

    const updated = dbService.updateUser(id, {
      status,
      statusReason: reason
    });

    dbService.addActivityLog({
      id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      timestamp: new Date().toISOString(),
      type: 'STATUS_CHANGE',
      userEmail: user.email,
      userName: user.name,
      details: `Statut modifié en "${status}"${reason ? ` (Motif : ${reason})` : ''}`
    });

    const appUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

    // Dispatch notification emails to user
    if (status === 'APPROVED') {
      mailerService.notifyUserApproved(user, appUrl).catch(e => console.error(e));
    } else if (status === 'REJECTED') {
      mailerService.notifyUserRejected(user, reason).catch(e => console.error(e));
    }

    return res.json({ success: true, user: updated ? sanitizeUser(updated) : null });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Erreur lors de la mise à jour.' });
  }
});

// PUT /api/admin/users/:id/role
apiRouter.put('/admin/users/:id/role', requireAdmin, (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user as UserRecord;
    // Only Root Admin can change roles!
    if (currentUser.email.toLowerCase() !== ROOT_ADMIN_EMAIL && currentUser.role !== 'SUPERADMIN') {
      return res.status(403).json({ success: false, error: 'Seul l’administrateur principal peut modifier les rôles administratifs.' });
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'ENGINEER'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Rôle invalide.' });
    }

    const targetUser = dbService.getUserById(id);
    const updated = dbService.updateUser(id, { role });

    if (targetUser) {
      dbService.addActivityLog({
        id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        timestamp: new Date().toISOString(),
        type: 'ROLE_CHANGE',
        userEmail: targetUser.email,
        userName: targetUser.name,
        details: `Rôle modifié en "${role}" par le super-administrateur`
      });
    }

    return res.json({ success: true, user: updated ? sanitizeUser(updated) : null });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Erreur lors du changement de rôle.' });
  }
});

// DELETE /api/admin/users/:id
apiRouter.delete('/admin/users/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user as UserRecord;
    if (currentUser.email.toLowerCase() !== ROOT_ADMIN_EMAIL && currentUser.role !== 'SUPERADMIN') {
      return res.status(403).json({ success: false, error: 'Seul l’administrateur principal peut supprimer des comptes.' });
    }

    const { id } = req.params;
    const targetUser = dbService.getUserById(id);
    const success = dbService.deleteUser(id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé ou action interdite.' });
    }

    if (targetUser) {
      dbService.addActivityLog({
        id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        timestamp: new Date().toISOString(),
        type: 'STATUS_CHANGE',
        userEmail: targetUser.email,
        userName: targetUser.name,
        details: `Compte supprimé définitivement par le super-administrateur`
      });
    }

    return res.json({ success: true, message: 'Compte utilisateur supprimé.' });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/admin/emails (Outbox log)
apiRouter.get('/admin/emails', requireAdmin, (req: Request, res: Response) => {
  const logs = dbService.getEmailLogs();
  return res.json({ success: true, emails: logs });
});

// GET /api/admin/activity (Connection and audit logs)
apiRouter.get('/admin/activity', requireAdmin, (req: Request, res: Response) => {
  const logs = dbService.getActivityLogs();
  return res.json({ success: true, activity: logs });
});

// GET /api/admin/smtp
apiRouter.get('/admin/smtp', requireAdmin, (req: Request, res: Response) => {
  const summary = mailerService.getActiveConfigSummary();
  return res.json({ success: true, summary });
});

// POST /api/admin/smtp
apiRouter.post('/admin/smtp', requireAdmin, (req: Request, res: Response) => {
  try {
    const { host, port, secure, user, pass, from } = req.body;
    if (!host || !user || !pass) {
      return res.status(400).json({ success: false, error: 'Hôte SMTP, identifiant utilisateur et mot de passe requis.' });
    }

    mailerService.setConfig({
      host: host.trim(),
      port: parseInt(port || '465', 10),
      secure: secure !== undefined ? !!secure : (parseInt(port || '465', 10) === 465),
      user: user.trim(),
      pass: pass.trim(),
      from: from ? from.trim() : `ARP Bureau d’Études <${user.trim()}>`,
      updatedAt: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: 'Configuration SMTP enregistrée avec succès. Le service de messagerie est opérationnel.',
      summary: mailerService.getActiveConfigSummary()
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Erreur lors de la configuration SMTP.' });
  }
});

// POST /api/admin/smtp/test
apiRouter.post('/admin/smtp/test', requireAdmin, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user as UserRecord;
    const { targetEmail } = req.body;
    const to = targetEmail || currentUser.email;

    const result = await mailerService.testConnection(to);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: `Erreur inattendue : ${err.message}` });
  }
});
