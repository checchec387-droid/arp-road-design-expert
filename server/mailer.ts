import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import crypto from 'crypto';
import { dbService, ROOT_ADMIN_EMAIL, ROOT_ADMIN_EMAILS, UserRecord } from './db';

interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  actionType: 'ADMIN_APPROVAL_REQUEST' | 'ACCOUNT_APPROVED' | 'ACCOUNT_REJECTED' | 'PASSWORD_RESET';
}

class MailerService {
  private transporter: Transporter | null = null;
  private isSmtpConfigured = false;

  constructor() {
    this.initTransport();
  }

  public initTransport() {
    // 1. Check database first, then fallback to env vars
    const dbConfig = dbService.getSmtpConfig();
    const host = dbConfig?.host || process.env.SMTP_HOST;
    const port = dbConfig?.port || parseInt(process.env.SMTP_PORT || '587', 10);
    const user = dbConfig?.user || process.env.SMTP_USER;
    const pass = dbConfig?.pass || process.env.SMTP_PASS;
    const secure = dbConfig ? dbConfig.secure : (process.env.SMTP_SECURE === 'true' || port === 465);

    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass }
        });
        this.isSmtpConfigured = true;
        console.log(`[MAILER] SMTP transporter initialized with host: ${host}:${port}`);
      } catch (err) {
        console.error('[MAILER] Failed to initialize SMTP transport:', err);
        this.transporter = null;
        this.isSmtpConfigured = false;
      }
    } else {
      console.log('[MAILER] SMTP credentials not provided. Emails will be logged to the in-app Admin Mailbox/Outbox.');
      this.transporter = null;
      this.isSmtpConfigured = false;
    }
  }

  public isConfigured(): boolean {
    return this.isSmtpConfigured;
  }

  public getActiveConfigSummary(): { isConfigured: boolean; host?: string; port?: number; user?: string; from?: string } {
    const dbConfig = dbService.getSmtpConfig();
    const host = dbConfig?.host || process.env.SMTP_HOST;
    const port = dbConfig?.port || (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined);
    const user = dbConfig?.user || process.env.SMTP_USER;
    const from = dbConfig?.from || process.env.SMTP_FROM || 'ARP Bureau d’Études <no-reply@arp-etudes.fr>';
    return {
      isConfigured: this.isSmtpConfigured,
      host: host || undefined,
      port: port || undefined,
      user: user ? user.replace(/(.{2})(.*)(@.*)/, '$1***$3') : undefined,
      from
    };
  }

  public setConfig(config: import('./db').SmtpConfigRecord) {
    dbService.setSmtpConfig(config);
    this.initTransport();
  }

  public async testConnection(targetEmail: string): Promise<{ success: boolean; message: string }> {
    if (!this.transporter || !this.isSmtpConfigured) {
      return {
        success: false,
        message: 'Serveur SMTP non configuré. Renseignez les paramètres d’hôte, d’identifiant et de mot de passe.'
      };
    }

    try {
      const dbConfig = dbService.getSmtpConfig();
      const from = dbConfig?.from || process.env.SMTP_FROM || 'ARP Bureau d’Études <no-reply@arp-etudes.fr>';

      await this.transporter.sendMail({
        from,
        to: targetEmail,
        subject: '[ARP Test] Vérification de la configuration d’envoi d’e-mails',
        text: 'Bonjour,\n\nCeci est un e-mail de test validant le fonctionnement effectif de votre serveur SMTP pour la plateforme routière ARP.\n\nCordialement,\nService Sécurité ARP',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #0f172a;">Plateforme Routière ARP Cerema</h2>
            <p>Bonjour,</p>
            <p style="color: #15803d; font-weight: bold;">Le test de votre serveur SMTP est un succès total !</p>
            <p>Les e-mails de demande d’accès, validation de compte et réinitialisation de mot de passe seront désormais directement expédiés dans les boîtes de réception.</p>
          </div>
        `
      });

      return {
        success: true,
        message: `E-mail de test expédié avec succès vers ${targetEmail} via le serveur SMTP.`
      };
    } catch (err: any) {
      console.error('[MAILER] Test SMTP error:', err);
      return {
        success: false,
        message: `Erreur d'envoi SMTP : ${err.message || 'Impossible de se connecter au serveur de messagerie.'}`
      };
    }
  }

  async sendMail(opts: SendMailOptions): Promise<{ success: boolean; status: 'DELIVERED' | 'OUTBOX_SIMULATED' | 'FAILED' }> {
    const dbConfig = dbService.getSmtpConfig();
    const from = dbConfig?.from || process.env.SMTP_FROM || 'ARP Bureau d’Études <no-reply@arp-etudes.fr>';
    let deliveryStatus: 'DELIVERED' | 'OUTBOX_SIMULATED' | 'FAILED' = 'OUTBOX_SIMULATED';
    let errorDetails: string | undefined;

    if (this.isSmtpConfigured && this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to: opts.to,
          subject: opts.subject,
          text: opts.text,
          html: opts.html
        });
        deliveryStatus = 'DELIVERED';
        console.log(`[MAILER] Email successfully sent via SMTP to: ${opts.to} (${opts.subject})`);
      } catch (err: any) {
        console.error(`[MAILER] SMTP delivery error to ${opts.to}:`, err);
        deliveryStatus = 'FAILED';
        errorDetails = err.message || String(err);
      }
    } else {
      console.log(`[MAILER] Email captured in Admin Outbox for: ${opts.to} (${opts.subject})`);
      deliveryStatus = 'OUTBOX_SIMULATED';
    }

    // Always log to database
    dbService.addEmailLog({
      id: `mail-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      sentAt: new Date().toISOString(),
      status: deliveryStatus,
      actionType: opts.actionType,
      errorDetails
    });

    return { success: deliveryStatus !== 'FAILED', status: deliveryStatus };
  }

  // 1. Notify Admin when a new user registers
  async notifyAdminNewRegistration(newUser: UserRecord, appUrl: string): Promise<void> {
    const adminUrl = `${appUrl}?module=admin-users`;
    const userJob = newUser.jobTitle || 'Ingénieur';
    const subject = `[ARP] Nouvelle demande d’accès : ${newUser.name} (${userJob})`;
    const text = `Bonjour Administrateur,\n\nUne nouvelle demande d'accès a été soumise sur la plateforme ARP :\n\n- Nom : ${newUser.name}\n- Emploi / Profil : ${userJob}\n- E-mail : ${newUser.email}\n- Organisme : ${newUser.organization || 'Non renseigné'}\n- Date : ${new Date(newUser.createdAt).toLocaleString('fr-FR')}\n\nVeuillez vous connecter à votre espace d'administration pour accepter ou refuser cette demande :\n${adminUrl}\n\nCordialement,\nSystème de Gestion Sécurisé ARP`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 18px; letter-spacing: 0.5px;">APPLICATION ROUTIÈRE ARP — BUREAU D’ÉTUDES</h2>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #94a3b8;">Guide Cerema ARP (Édition Août 2022)</p>
        </div>
        <div style="padding: 24px;">
          <h3 style="color: #0f172a; margin-top: 0;">Nouvelle demande d’accès utilisateur</h3>
          <p>Bonjour Administrateur,</p>
          <p>Un utilisateur vient de s'inscrire et sollicite l'accès aux modules techniques de calculs routiers :</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b; font-weight: bold; width: 140px;">Nom complet :</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: bold;">${newUser.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Emploi / Profil :</td>
              <td style="padding: 8px 0; color: #0284c7; font-weight: bold;">${userJob}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Adresse e-mail :</td>
              <td style="padding: 8px 0; color: #0f172a;">${newUser.email}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Bureau / Organisme :</td>
              <td style="padding: 8px 0; color: #0f172a;">${newUser.organization || 'Non renseigné'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Statut actuel :</td>
              <td style="padding: 8px 0; color: #b45309; font-weight: bold;">En attente de votre approbation</td>
            </tr>
          </table>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${adminUrl}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: bold; display: inline-block;">
              Accéder à l'espace administrateur pour accepter ou refuser
            </a>
          </div>
          <p style="font-size: 12px; color: #64748b;">Conformément à la politique de sécurité, cet utilisateur n'aura accès à aucun calcul ni module tant que vous n'aurez pas approuvé son inscription.</p>
        </div>
      </div>
    `;

    for (const targetAdmin of ROOT_ADMIN_EMAILS) {
      await this.sendMail({
        to: targetAdmin,
        subject,
        text,
        html,
        actionType: 'ADMIN_APPROVAL_REQUEST'
      });
    }
  }

  // 2. Notify User that their account has been approved
  async notifyUserApproved(user: UserRecord, appUrl: string): Promise<void> {
    const loginUrl = `${appUrl}?view=login`;
    const subject = `[ARP] Votre accès a été approuvé par l'administrateur`;
    const text = `Bonjour ${user.name},\n\nVotre demande d'accès à l'application professionnelle de calculs routiers ARP a été validée par l'administrateur.\n\nVous pouvez désormais vous connecter à l'adresse suivante :\n${loginUrl}\n\nIdentifiant : ${user.email} (ou ${user.username})\n\nCordialement,\nBureau d'Études ARP`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 18px;">APPLICATION ROUTIÈRE ARP</h2>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #94a3b8;">Guide Cerema ARP (Édition Août 2022)</p>
        </div>
        <div style="padding: 24px;">
          <h3 style="color: #15803d; margin-top: 0;">Compte validé avec succès !</h3>
          <p>Bonjour <strong>${user.name}</strong>,</p>
          <p>Nous avons le plaisir de vous informer que votre demande d'accès à la plateforme de calculs routiers et dimensionnement géométrique ARP a été <strong>approuvée</strong> par l'administrateur.</p>
          <p>Vous avez désormais accès à l'ensemble des modules d'études : dévers, clothoïdes, surlargeurs, profils géométriques et contrôles réglementaires.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background-color: #15803d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: bold; display: inline-block;">
              Se connecter à l'application ARP
            </a>
          </div>
          <p style="font-size: 12px; color: #64748b;">Si vous rencontrez des difficultés de connexion, vous pouvez contacter l'administrateur à l'adresse : ${ROOT_ADMIN_EMAIL}.</p>
        </div>
      </div>
    `;

    await this.sendMail({
      to: user.email,
      subject,
      text,
      html,
      actionType: 'ACCOUNT_APPROVED'
    });
  }

  // 3. Notify User that their account has been rejected
  async notifyUserRejected(user: UserRecord, reason?: string): Promise<void> {
    const subject = `[ARP] Notification concernant votre demande d'accès`;
    const text = `Bonjour ${user.name},\n\nNous vous informons que votre demande d'accès à l'application routière ARP n'a pas été retenue par l'administrateur.${reason ? `\n\nMotif : ${reason}` : ''}\n\nPour toute question, contactez l'administrateur (${ROOT_ADMIN_EMAIL}).`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 18px;">APPLICATION ROUTIÈRE ARP</h2>
        </div>
        <div style="padding: 24px;">
          <h3 style="color: #b91c1c; margin-top: 0;">Demande d'accès non approuvée</h3>
          <p>Bonjour <strong>${user.name}</strong>,</p>
          <p>Votre demande d'accès à l'application technique ARP n'a pas été validée par l'administrateur.</p>
          ${reason ? `<div style="background: #fef2f2; border-left: 3px solid #b91c1c; padding: 12px; font-size: 13px; color: #991b1b; margin: 15px 0;"><strong>Motif :</strong> ${reason}</div>` : ''}
          <p style="font-size: 12px; color: #64748b;">Pour toute précision ou réclamation, vous pouvez vous adresser à l'administrateur principal : ${ROOT_ADMIN_EMAIL}.</p>
        </div>
      </div>
    `;

    await this.sendMail({
      to: user.email,
      subject,
      text,
      html,
      actionType: 'ACCOUNT_REJECTED'
    });
  }

  // 4. Send Password Reset link
  async sendPasswordResetLink(user: UserRecord, resetLink: string): Promise<void> {
    const subject = `[ARP] Réinitialisation de votre mot de passe`;
    const text = `Bonjour ${user.name},\n\nVous avez demandé la réinitialisation de votre mot de passe pour l'application ARP.\n\nVeuillez cliquer sur le lien sécurisé suivant (valide pendant 1 heure) :\n${resetLink}\n\nSi vous n'êtes pas à l'origine de cette demande, veuillez ignorer ce message.\n\nCordialement,\nSécurité ARP`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 18px;">APPLICATION ROUTIÈRE ARP</h2>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #94a3b8;">Sécurité & Réinitialisation de Mot de Passe</p>
        </div>
        <div style="padding: 24px;">
          <h3 style="color: #0f172a; margin-top: 0;">Réinitialisation de votre mot de passe</h3>
          <p>Bonjour <strong>${user.name}</strong>,</p>
          <p>Une demande de réinitialisation de mot de passe a été initiée pour votre compte (${user.email}).</p>
          <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe sécurisé :</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: bold; display: inline-block;">
              Réinitialiser mon mot de passe
            </a>
          </div>

          <p style="font-size: 12px; color: #64748b;">Ce lien à usage unique expirera dans <strong>60 minutes</strong>. Si vous n'êtes pas l'auteur de cette demande, votre compte reste protégé et aucune modification n'a été effectuée.</p>
          <p style="font-size: 11px; color: #94a3b8; word-break: break-all;">Lien direct : ${resetLink}</p>
        </div>
      </div>
    `;

    await this.sendMail({
      to: user.email,
      subject,
      text,
      html,
      actionType: 'PASSWORD_RESET'
    });
  }
}

export const mailerService = new MailerService();
