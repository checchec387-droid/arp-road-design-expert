export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'ENGINEER';
export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DEACTIVATED';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username: string;
  jobTitle?: 'Ingénieur' | 'Expert' | 'Étudiant' | string;
  role: UserRole;
  status: UserStatus;
  organization?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface EmailLogItem {
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

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  type: 'LOGIN' | 'LOGIN_FAILED' | 'LOGOUT' | 'REGISTER' | 'STATUS_CHANGE' | 'ROLE_CHANGE' | 'PASSWORD_RESET_REQUEST' | 'PASSWORD_RESET';
  userEmail: string;
  userName?: string;
  details: string;
  ip?: string;
}

