import crypto from 'node:crypto';
import {
  hashPassword,
  assertSingleAdminInvariant,
  type UserRecord,
  type StaffRegistrationRequest,
  type SessionToken,
  type PasswordResetToken,
} from './authService.ts';
import {
  INITIAL_SPECIALTIES,
  INITIAL_SERVICES,
  INITIAL_DOCTORS,
  INITIAL_SCHEDULES,
  INITIAL_PATIENTS,
  INITIAL_APPOINTMENTS,
} from './data/initialData.ts';
import type {
  Specialty,
  ClinicalService,
  Doctor,
  DoctorSchedule,
  Patient,
  Appointment,
  AuditLogEntry,
} from './types/clinic.ts';

// In-memory Database Store with strict validation
export class ClinicDatabase {
  users: UserRecord[] = [];
  staffRequests: StaffRegistrationRequest[] = [];
  sessions: Map<string, SessionToken> = new Map();
  passwordResetTokens: Map<string, PasswordResetToken> = new Map();

  specialties: Specialty[] = [];
  services: ClinicalService[] = [];
  doctors: Doctor[] = [];
  schedules: DoctorSchedule[] = [];
  patients: Patient[] = [];
  appointments: Appointment[] = [];
  auditLogs: AuditLogEntry[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    this.specialties = [...INITIAL_SPECIALTIES];
    this.services = [...INITIAL_SERVICES];
    this.doctors = [...INITIAL_DOCTORS];
    this.schedules = [...INITIAL_SCHEDULES];
    this.patients = [...INITIAL_PATIENTS];
    this.appointments = [...INITIAL_APPOINTMENTS];

    // Seed Initial Secure Users (Passwords are hashed with salt using PBKDF2)
    // 1. Single Administrator (Strictly unique)
    const adminPass = hashPassword('Admin123!');
    this.users.push({
      id: 'usr-admin',
      email: 'admin@clinicamedical.com',
      passwordHash: adminPass.hash,
      salt: adminPass.salt,
      fullName: 'Ing. Administrador de Sistemas',
      role: 'Administrador',
      status: 'ACTIVE',
      phone: '77218900',
      ci: '4928170',
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-01T08:00:00Z',
      failedLoginAttempts: 0,
    });

    // 2. Doctor user (Dr. Juan Pérez)
    const docPass = hashPassword('Medico123!');
    this.users.push({
      id: 'usr-doc',
      email: 'dr.perez@clinicamedical.com',
      passwordHash: docPass.hash,
      salt: docPass.salt,
      fullName: 'Dr. Juan Pérez Sandoval',
      role: 'Médico',
      status: 'ACTIVE',
      doctorId: 'doc-003',
      licenseNumber: 'MP-7821-BOL',
      specialtyId: 'esp-medgen',
      phone: '70011223',
      ci: '3489102',
      createdAt: '2026-01-05T08:00:00Z',
      updatedAt: '2026-01-05T08:00:00Z',
      failedLoginAttempts: 0,
    });

    // 3. Receptionist user (Lic. Laura Méndez)
    const recepPass = hashPassword('Recep123!');
    this.users.push({
      id: 'usr-recep',
      email: 'recepcion@clinicamedical.com',
      passwordHash: recepPass.hash,
      salt: recepPass.salt,
      fullName: 'Lic. Laura Méndez',
      role: 'Recepcionista',
      status: 'ACTIVE',
      phone: '77219001',
      ci: '4829103',
      createdAt: '2026-01-10T08:00:00Z',
      updatedAt: '2026-01-10T08:00:00Z',
      failedLoginAttempts: 0,
    });

    // 4. Patient user (María López Quispe)
    const pacPass = hashPassword('Paciente123!');
    this.users.push({
      id: 'usr-pac',
      email: 'maria.lopez@gmail.com',
      passwordHash: pacPass.hash,
      salt: pacPass.salt,
      fullName: 'María López Quispe',
      role: 'Paciente',
      status: 'ACTIVE',
      ci: '5489123',
      patientId: 'pac-001',
      patientCi: '5489123',
      phone: '77123456',
      createdAt: '2026-01-15T08:00:00Z',
      updatedAt: '2026-01-15T08:00:00Z',
      failedLoginAttempts: 0,
    });

    // Seed sample Staff Registration Requests for testing the approval workflow
    const sampleDocPass = hashPassword('Doctor2026!');
    this.staffRequests.push({
      id: 'req-001',
      type: 'MEDICO',
      fullName: 'Dra. Camila Morales Prado',
      firstName: 'Camila',
      lastName: 'Morales Prado',
      email: 'cmorales@medicos.bo',
      phone: '71928374',
      ci: '6829104',
      specialtyId: 'esp-cardio',
      licenseNumber: 'MP-9942-LPZ',
      notes: 'Cardióloga especialista en ecocardiografía ambulatoria con 8 años de trayectoria hospitalaria.',
      status: 'PENDING',
      passwordHash: sampleDocPass.hash,
      salt: sampleDocPass.salt,
      createdAt: '2026-10-25T14:30:00Z',
    });

    const sampleRecepPass = hashPassword('Recep2026!');
    this.staffRequests.push({
      id: 'req-002',
      type: 'RECEPCIONISTA',
      fullName: 'Carlos Fuentes Romero',
      firstName: 'Carlos',
      lastName: 'Fuentes Romero',
      email: 'cfuentes.adm@gmail.com',
      phone: '76543210',
      ci: '4928172',
      notes: 'Técnico superior en administración médica con 3 años de experiencia en admisión y triaje inicial.',
      status: 'PENDING',
      passwordHash: sampleRecepPass.hash,
      salt: sampleRecepPass.salt,
      createdAt: '2026-10-26T09:15:00Z',
    });

    // Initial audit log entry
    this.auditLogs.push({
      id: 'log-seed-1',
      userName: 'Sistema Automático',
      userRole: 'Administrador',
      moduleAffected: 'Seguridad y Autenticación',
      eventType: 'SISTEMA_INICIALIZADO',
      actionDescription: 'Módulo de autenticación RBAC inicializado con Administrador único y políticas de seguridad.',
      ipAddress: '127.0.0.1',
      timestamp: new Date().toISOString(),
    });
  }

  // Record an immutable audit log
  logAudit(entry: {
    userName: string;
    userRole: string;
    moduleAffected: string;
    eventType: string;
    actionDescription: string;
    ipAddress?: string;
  }) {
    const log: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userName: entry.userName,
      userRole: entry.userRole,
      moduleAffected: entry.moduleAffected,
      eventType: entry.eventType,
      actionDescription: entry.actionDescription,
      ipAddress: entry.ipAddress || '127.0.0.1',
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    return log;
  }
}

// Global Singleton Database Instance
export const clinicDb = new ClinicDatabase();
