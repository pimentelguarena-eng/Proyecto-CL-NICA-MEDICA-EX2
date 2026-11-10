import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  hashPassword,
  assertSingleAdminInvariant,
  type UserRecord,
  type StaffRegistrationRequest,
  type SessionToken,
  type PasswordResetToken,
} from './authService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_STORAGE_PATH = path.resolve(__dirname, '../database/local_db.json');
import {
  INITIAL_SPECIALTIES,
  INITIAL_SERVICES,
  INITIAL_DOCTORS,
  INITIAL_SCHEDULES,
  INITIAL_PATIENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_ABSENCES,
} from './data/initialData.ts';
import type {
  Specialty,
  ClinicalService,
  Doctor,
  DoctorSchedule,
  DoctorAbsence,
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
  absences: DoctorAbsence[] = [];
  patients: Patient[] = [];
  appointments: Appointment[] = [];
  auditLogs: AuditLogEntry[] = [];

  constructor() {
    this.loadFromDiskOrSeed();
  }

  public saveToDisk(): void {
    try {
      const data = {
        users: this.users,
        staffRequests: this.staffRequests,
        specialties: this.specialties,
        services: this.services,
        doctors: this.doctors,
        schedules: this.schedules,
        absences: this.absences,
        patients: this.patients,
        appointments: this.appointments,
        auditLogs: this.auditLogs,
      };
      const dir = path.dirname(DB_STORAGE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_STORAGE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB STORAGE] Error al guardar datos en disco:', err);
    }
  }

  public loadFromDiskOrSeed(): void {
    if (fs.existsSync(DB_STORAGE_PATH)) {
      try {
        const raw = fs.readFileSync(DB_STORAGE_PATH, 'utf-8');
        const data = JSON.parse(raw);
        this.users = data.users || [];
        this.staffRequests = data.staffRequests || [];
        this.specialties = data.specialties || [...INITIAL_SPECIALTIES];
        this.services = data.services || [...INITIAL_SERVICES];
        this.doctors = data.doctors || [...INITIAL_DOCTORS];
        this.schedules = data.schedules || [...INITIAL_SCHEDULES];
        this.absences = data.absences || [...INITIAL_ABSENCES];
        this.patients = data.patients || [...INITIAL_PATIENTS];
        this.appointments = data.appointments || [...INITIAL_APPOINTMENTS];
        this.auditLogs = data.auditLogs || [];

        // Synchronize all doctors from INITIAL_DOCTORS so every specialty has an active user login
        let hasNewDoctors = false;
        const docPass = hashPassword('Medico123!');
        for (const doc of this.doctors) {
          const exists = this.users.some(
            u => u.doctorId === doc.id || u.email.toLowerCase() === doc.email.toLowerCase()
          );
          if (!exists) {
            this.users.push({
              id: `usr-${doc.id}`,
              email: doc.email.toLowerCase(),
              passwordHash: docPass.hash,
              salt: docPass.salt,
              fullName: doc.fullName,
              role: 'Médico',
              status: 'ACTIVE',
              doctorId: doc.id,
              licenseNumber: doc.licenseNumber,
              specialtyId: doc.specialtyIds[0],
              phone: doc.phone,
              ci: doc.licenseNumber.replace(/\D/g, '') || '3489100',
              createdAt: '2026-01-05T08:00:00Z',
              updatedAt: '2026-01-05T08:00:00Z',
              failedLoginAttempts: 0,
            });
            hasNewDoctors = true;
          }
        }
        if (!this.users.some(u => u.email === 'dr.perez@clinicamedical.com')) {
          this.users.push({
            id: 'usr-doc',
            email: 'dr.perez@clinicamedical.com',
            passwordHash: docPass.hash,
            salt: docPass.salt,
            fullName: 'Dr. Juan Pérez Sandoval',
            role: 'Médico',
            status: 'ACTIVE',
            doctorId: 'doc-003',
            licenseNumber: 'MP-7721-BOL',
            specialtyId: 'esp-medgen',
            phone: '71192843',
            ci: '7721100',
            createdAt: '2026-01-05T08:00:00Z',
            updatedAt: '2026-01-05T08:00:00Z',
            failedLoginAttempts: 0,
          });
          hasNewDoctors = true;
        }
        if (!this.users.some(u => u.email === 'juan.perez@clinicamedical.com')) {
          this.users.push({
            id: 'usr-doc-003-alias',
            email: 'juan.perez@clinicamedical.com',
            passwordHash: docPass.hash,
            salt: docPass.salt,
            fullName: 'Dr. Juan Pérez Sandoval',
            role: 'Médico',
            status: 'ACTIVE',
            doctorId: 'doc-003',
            licenseNumber: 'MP-7721-BOL',
            specialtyId: 'esp-medgen',
            phone: '71192843',
            ci: '7721100',
            createdAt: '2026-01-05T08:00:00Z',
            updatedAt: '2026-01-05T08:00:00Z',
            failedLoginAttempts: 0,
          });
          hasNewDoctors = true;
        }
        
        // Synchronize all patients from INITIAL_PATIENTS so all 20 have active user logins
        let hasNewPatients = false;
        const defaultPacPass = hashPassword('Paciente123!', 'paciente_salt_2026');
        for (const pac of this.patients) {
          if (!pac.email) continue;
          const exists = this.users.some(
            u => u.patientId === pac.id || u.email.toLowerCase() === pac.email!.toLowerCase()
          );
          if (!exists) {
            this.users.push({
              id: `usr-${pac.id}`,
              email: pac.email.toLowerCase(),
              passwordHash: defaultPacPass.hash,
              salt: defaultPacPass.salt,
              fullName: `${pac.firstName} ${pac.lastName}`,
              role: 'Paciente',
              status: 'ACTIVE',
              ci: pac.ci,
              patientId: pac.id,
              patientCi: pac.ci,
              phone: pac.phone,
              createdAt: '2026-01-20T08:00:00Z',
              updatedAt: '2026-01-20T08:00:00Z',
              failedLoginAttempts: 0,
            });
            hasNewPatients = true;
          }
        }
        if (hasNewPatients) {
          this.saveToDisk();
        }

        if (hasNewDoctors) {
          this.saveToDisk();
        }

        console.log(`[DB STORAGE] Base de datos cargada desde ${DB_STORAGE_PATH} (${this.users.length} usuarios, ${this.patients.length} pacientes, ${this.appointments.length} citas).`);
        return;
      } catch (err) {
        console.warn('[DB STORAGE] Error al leer local_db.json desde disco, regenerando semillas:', err);
      }
    }
    this.seed();
    this.saveToDisk();
  }

  private seed() {
    this.specialties = [...INITIAL_SPECIALTIES];
    this.services = [...INITIAL_SERVICES];
    this.doctors = [...INITIAL_DOCTORS];
    this.schedules = [...INITIAL_SCHEDULES];
    this.absences = [...INITIAL_ABSENCES];
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

    // 2. Doctor Users for ALL 22 Specialties (19 Initial Medical Specialists)
    const docPass = hashPassword('Medico123!');
    for (const doc of this.doctors) {
      this.users.push({
        id: `usr-${doc.id}`,
        email: doc.email.toLowerCase(),
        passwordHash: docPass.hash,
        salt: docPass.salt,
        fullName: doc.fullName,
        role: 'Médico',
        status: 'ACTIVE',
        doctorId: doc.id,
        licenseNumber: doc.licenseNumber,
        specialtyId: doc.specialtyIds[0],
        phone: doc.phone,
        ci: doc.licenseNumber.replace(/\D/g, '') || '3489100',
        createdAt: '2026-01-05T08:00:00Z',
        updatedAt: '2026-01-05T08:00:00Z',
        failedLoginAttempts: 0,
      });
    }

    // Support dr.perez@clinicamedical.com as well
    if (!this.users.some(u => u.email === 'dr.perez@clinicamedical.com')) {
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
        phone: '71192843',
        ci: '7721100',
        createdAt: '2026-01-05T08:00:00Z',
        updatedAt: '2026-01-05T08:00:00Z',
        failedLoginAttempts: 0,
      });
    }
    if (!this.users.some(u => u.email === 'juan.perez@clinicamedical.com')) {
      this.users.push({
        id: 'usr-doc-003-alias',
        email: 'juan.perez@clinicamedical.com',
        passwordHash: docPass.hash,
        salt: docPass.salt,
        fullName: 'Dr. Juan Pérez Sandoval',
        role: 'Médico',
        status: 'ACTIVE',
        doctorId: 'doc-003',
        licenseNumber: 'MP-7721-BOL',
        specialtyId: 'esp-medgen',
        phone: '71192843',
        ci: '7721100',
        createdAt: '2026-01-05T08:00:00Z',
        updatedAt: '2026-01-05T08:00:00Z',
        failedLoginAttempts: 0,
      });
    }

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

    // 5. Patient user Carlos Pimentel (Linked to pimentelcarlos147@gmail.com for real SMTP testing)
    const pimentelPass = hashPassword('Paciente123!');
    this.users.push({
      id: 'usr-pimentel',
      email: 'pimentelcarlos147@gmail.com',
      passwordHash: pimentelPass.hash,
      salt: pimentelPass.salt,
      fullName: 'Carlos Pimentel',
      role: 'Paciente',
      status: 'ACTIVE',
      ci: '6190432',
      patientId: 'pac-002',
      patientCi: '6190432',
      phone: '70281930',
      createdAt: '2026-01-20T08:00:00Z',
      updatedAt: '2026-01-20T08:00:00Z',
      failedLoginAttempts: 0,
    });

    // 6. Andrés Pimentel Guaquira (Linked to pimentelguarena@gmail.com)
    this.users.push({
      id: 'usr-andres-pimentel',
      email: 'pimentelguarena@gmail.com',
      passwordHash: pimentelPass.hash,
      salt: pimentelPass.salt,
      fullName: 'Andrés Pimentel',
      role: 'Paciente',
      status: 'ACTIVE',
      ci: '6190433',
      patientId: 'pac-002',
      patientCi: '6190433',
      phone: '70281930',
      createdAt: '2026-01-20T08:00:00Z',
      updatedAt: '2026-01-20T08:00:00Z',
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
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const log: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userName: entry.userName,
      userRole: entry.userRole,
      moduleAffected: entry.moduleAffected,
      eventType: entry.eventType,
      actionDescription: entry.actionDescription,
      ipAddress: entry.ipAddress || '127.0.0.1',
      timestamp: formattedDate,
    };
    this.auditLogs.unshift(log);
    this.saveToDisk();
    return log;
  }
}

// Global Singleton Database Instance
export const clinicDb = new ClinicDatabase();
