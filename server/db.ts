import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  username?: string;
  jobTitle?: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'ENGINEER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DEACTIVATED';
  passwordHash: string; // "salt:hash"
  organization?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  resetToken?: string;
  resetTokenExpires?: number; // epoch ms
  statusReason?: string;
}

export interface EmailLogRecord {
  id: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  sentAt: string;
  status: 'DELIVERED' | 'OUTBOX_SIMULATED' | 'FAILED';
  actionType: 'ADMIN_APPROVAL_REQUEST' | 'ACCOUNT_APPROVED' | 'ACCOUNT_REJECTED' | 'PASSWORD_RESET';
  errorDetails?: string;
}

export interface ActivityLogRecord {
  id: string;
  timestamp: string;
  type: 'LOGIN' | 'LOGIN_FAILED' | 'LOGOUT' | 'REGISTER' | 'STATUS_CHANGE' | 'ROLE_CHANGE' | 'PASSWORD_RESET_REQUEST' | 'PASSWORD_RESET';
  userEmail: string;
  userName?: string;
  details: string;
  ip?: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  expiresAt: number; // epoch ms
  createdAt: string;
}

export interface SmtpConfigRecord {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  updatedAt?: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  sessions: SessionRecord[];
  emailLogs: EmailLogRecord[];
  activityLogs: ActivityLogRecord[];
  smtpConfig?: SmtpConfigRecord;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'app_database.json');

export const ROOT_ADMIN_EMAILS: string[] = Array.from(new Set([
  'youcefyoucefbelallia@gmail.com',
  'checchec387@gmail.com',
  (process.env.ADMIN_EMAIL || '').toLowerCase().trim()
].filter(Boolean)));

export function isRootAdminEmail(email?: string): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return ROOT_ADMIN_EMAILS.includes(clean);
}

export const ROOT_ADMIN_EMAIL = ROOT_ADMIN_EMAILS[0];

// Password hashing with crypto.scrypt
export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

export function verifyPassword(password: string, combinedHash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = combinedHash.split(':');
    if (!salt || !key) return resolve(false);

    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      const keyBuffer = Buffer.from(key, 'hex');
      const match = crypto.timingSafeEqual(derivedKey, keyBuffer);
      resolve(match);
    });
  });
}

// Ensure database directory and file exist
function getInitialDb(): DatabaseSchema {
  return {
    users: [],
    sessions: [],
    emailLogs: [],
    activityLogs: []
  };
}

class DatabaseService {
  private data: DatabaseSchema;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.users) this.data.users = [];
        if (!this.data.sessions) this.data.sessions = [];
        if (!this.data.emailLogs) this.data.emailLogs = [];
        if (!this.data.activityLogs) this.data.activityLogs = [];
      } catch (err) {
        console.error('Error loading db file, reinitializing', err);
        this.data = getInitialDb();
        this.save();
      }
    } else {
      this.data = getInitialDb();
      this.save();
    }

    this.ensureRootAdmin();
  }

  private save() {
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  private async ensureRootAdmin() {
    for (const adminEmail of ROOT_ADMIN_EMAILS) {
      const existing = this.data.users.find(u => u.email.toLowerCase() === adminEmail.toLowerCase());
      if (!existing) {
        console.log(`[AUTH] Bootstrapping administrator account: ${adminEmail}`);
        const defaultHash = await hashPassword('Admin@ARP2022!');
        const adminUser: UserRecord = {
          id: `user-admin-${adminEmail.replace(/[^a-zA-Z0-9]/g, '')}`,
          name: adminEmail.includes('youcef') ? 'Administrateur Youcef' : 'Administrateur Principal',
          email: adminEmail,
          username: adminEmail.split('@')[0],
          role: 'SUPERADMIN',
          status: 'APPROVED',
          passwordHash: defaultHash,
          organization: 'Bureau d’Études ARP - Administration Centrale',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.data.users.push(adminUser);
        this.save();
        console.log(`[AUTH] Administrator account successfully created (${adminEmail}) with role SUPERADMIN and status APPROVED.`);
      } else {
        if (existing.role !== 'SUPERADMIN' || existing.status !== 'APPROVED') {
          existing.role = 'SUPERADMIN';
          existing.status = 'APPROVED';
          this.save();
        }
      }
    }
  }

  // Users
  getUsers(): UserRecord[] {
    return this.data.users;
  }

  getUserById(id: string): UserRecord | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmailOrUsername(identifier: string): UserRecord | undefined {
    if (!identifier) return undefined;
    const clean = identifier.toLowerCase().trim();
    return this.data.users.find(u =>
      u.email.toLowerCase() === clean ||
      (u.username && u.username.toLowerCase() === clean)
    );
  }

  getUserByResetToken(token: string): UserRecord | undefined {
    if (!token) return undefined;
    const clean = token.trim().toLowerCase();
    return this.data.users.find(u => {
      if (!u.resetToken) return false;
      const isExpired = (u.resetTokenExpires || 0) < Date.now();
      if (isExpired) return false;
      const t = u.resetToken.toLowerCase();
      return t === clean || (clean.length >= 6 && t.startsWith(clean));
    });
  }

  addUser(user: UserRecord): void {
    this.data.users.push(user);
    this.save();
  }

  updateUser(id: string, updates: Partial<UserRecord>): UserRecord | undefined {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;

    // Protection of root admins
    const current = this.data.users[idx];
    if (isRootAdminEmail(current.email)) {
      if (updates.role && updates.role !== 'SUPERADMIN') {
        throw new Error('Le rôle d’un compte administrateur principal ne peut pas être modifié.');
      }
      if (updates.status && updates.status !== 'APPROVED') {
        throw new Error('Le compte administrateur principal ne peut pas être désactivé ou révoqué.');
      }
    }

    this.data.users[idx] = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.users[idx];
  }

  deleteUser(id: string): boolean {
    const user = this.getUserById(id);
    if (!user) return false;
    if (isRootAdminEmail(user.email)) {
      throw new Error('Le compte administrateur principal ne peut pas être supprimé.');
    }
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.data.sessions = this.data.sessions.filter(s => s.userId !== id);
    this.save();
    return true;
  }

  // Sessions
  createSession(userId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    this.data.sessions.push({
      token,
      userId,
      expiresAt,
      createdAt: new Date().toISOString()
    });
    this.save();
    return token;
  }

  getSession(token: string): SessionRecord | undefined {
    const session = this.data.sessions.find(s => s.token === token);
    if (!session) return undefined;
    if (session.expiresAt < Date.now()) {
      this.deleteSession(token);
      return undefined;
    }
    return session;
  }

  deleteSession(token: string): void {
    this.data.sessions = this.data.sessions.filter(s => s.token !== token);
    this.save();
  }

  // Email Logs
  addEmailLog(log: EmailLogRecord): void {
    this.data.emailLogs.unshift(log);
    // Keep max 200 logs
    if (this.data.emailLogs.length > 200) {
      this.data.emailLogs = this.data.emailLogs.slice(0, 200);
    }
    this.save();
  }

  getEmailLogs(): EmailLogRecord[] {
    return this.data.emailLogs;
  }

  // Activity Logs
  addActivityLog(log: ActivityLogRecord): void {
    if (!this.data.activityLogs) this.data.activityLogs = [];
    this.data.activityLogs.unshift(log);
    // Keep max 300 logs
    if (this.data.activityLogs.length > 300) {
      this.data.activityLogs = this.data.activityLogs.slice(0, 300);
    }
    this.save();
  }

  getActivityLogs(): ActivityLogRecord[] {
    return this.data.activityLogs || [];
  }

  // SMTP Settings
  getSmtpConfig(): SmtpConfigRecord | undefined {
    return this.data.smtpConfig;
  }

  setSmtpConfig(config: SmtpConfigRecord): void {
    this.data.smtpConfig = config;
    this.save();
  }
}

export const dbService = new DatabaseService();
