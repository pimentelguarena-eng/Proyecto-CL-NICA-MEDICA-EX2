import crypto from 'node:crypto';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  fullName: string;
  role: 'Administrador' | 'Recepcionista' | 'Médico' | 'Paciente';
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED' | 'SUSPENDED';
  ci?: string;
  phone?: string;
  doctorId?: string;
  patientId?: string;
  patientCi?: string;
  licenseNumber?: string;
  specialtyId?: string;
  createdAt: string;
  updatedAt: string;
  failedLoginAttempts: number;
  lockoutUntil?: number; // epoch ms
}

export interface StaffRegistrationRequest {
  id: string;
  type: 'MEDICO' | 'RECEPCIONISTA';
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ci: string;
  specialtyId?: string;
  licenseNumber?: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  passwordHash: string;
  salt: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface SessionToken {
  token: string;
  userId: string;
  email: string;
  role: UserRecord['role'];
  fullName: string;
  doctorId?: string;
  patientCi?: string;
  patientId?: string;
  createdAt: number;
  expiresAt: number;
}

export interface PasswordResetToken {
  token: string;
  userId: string;
  email: string;
  expiresAt: number;
  used: boolean;
}

/**
 * PBKDF2 Password Hashing with unique salt
 */
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const effectiveSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, effectiveSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: effectiveSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const result = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(result.hash, 'hex'), Buffer.from(hash, 'hex'));
}

/**
 * Validates clinic password policy:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export function validatePasswordPolicy(password: string): { isValid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { isValid: false, message: 'La contraseña debe tener al menos 8 caracteres.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'La contraseña debe incluir al menos una letra mayúscula.' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'La contraseña debe incluir al menos una letra minúscula.' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'La contraseña debe incluir al menos un número.' };
  }
  return { isValid: true };
}

/**
 * Generate secure random token
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Enforces the Single Active Administrator rule:
 * - There can be strictly ONE active user with role 'Administrador'.
 * - Throws an error if another user is attempted to be created or elevated as Administrator.
 */
export function assertSingleAdminInvariant(
  users: UserRecord[],
  targetRole: UserRecord['role'],
  targetUserId?: string
): void {
  if (targetRole === 'Administrador') {
    const existingActiveAdmin = users.find(u => u.role === 'Administrador' && u.status === 'ACTIVE');
    if (existingActiveAdmin && existingActiveAdmin.id !== targetUserId) {
      throw new Error(
        'Violación de seguridad y restricción de unicidad: La Clínica Medical permite estrictamente un único Administrador activo. Operación rechazada.'
      );
    }
  }
}
