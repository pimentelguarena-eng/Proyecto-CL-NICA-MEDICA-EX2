export type AppointmentStatus =
  | 'Pendiente'
  | 'Programada'
  | 'Confirmada'
  | 'Atendida'
  | 'Cancelada'
  | 'Inasistencia';

export type UserRole = 'Administrador' | 'Recepcionista' | 'Médico' | 'Paciente';

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  dayOfWeek: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
  startTime: string; // HH:mm format e.g. "08:00"
  endTime: string;   // HH:mm format e.g. "12:00"
  slotDurationMinutes: number; // default 15 or 30
}

export interface Doctor {
  id: string;
  code: string; // e.g. "MED-001"
  licenseNumber: string; // Registro profesional
  fullName: string;
  specialtyIds: string[];
  phone: string;
  email: string;
  isActive: boolean;
  avatarUrl?: string;
  roomNumber?: string;
}

export interface Patient {
  id: string;
  code: string; // e.g. "PAC-001"
  ci: string; // Documento de identidad (unique - RN01)
  firstName: string;
  lastName: string;
  birthDate: string; // YYYY-MM-DD
  gender: 'Masculino' | 'Femenino' | 'Otro';
  phone: string;
  email?: string;
  address?: string;
  isActive: boolean;
  // Medical Profile (Page 5 & CU22)
  bloodType?: string;
  allergies?: string;
  chronicDiseases?: string;
  currentMedications?: string;
  medicalHistory?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
}

export interface Specialty {
  id: string;
  name: string; // e.g. "CARDIOLOGÍA"
  normalizedName: string;
  category: 'Clínica' | 'Quirúrgica' | 'Diagnóstica' | 'Salud Mental' | 'Rehabilitación';
  description: string;
  specificServices: string[];
  commonConditions: string[];
  iconName: string;
  isActive: boolean;
  typicalDurationMinutes: number;
  consultationFee?: number; // e.g. 150.00 Bs
}

export interface ClinicalService {
  id: string;
  name: string;
  category: string;
  description: string;
  requirements: string[];
  durationMinutes: number;
  isOutpatientOnly: boolean;
  iconName: string;
  fee?: number;
}

export interface VitalSigns {
  bloodPressure?: string; // e.g. "120/80"
  temperatureC?: number;  // e.g. 36.6
  heartRate?: number;     // e.g. 72
  weightKg?: number;      // e.g. 68.5
  heightCm?: number;      // e.g. 170
}

export interface Appointment {
  id: string;
  code: string; // e.g. "CM-0001"
  patientId: string;
  doctorId: string;
  specialtyId: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // "09:00 - 09:15" or "09:00 - 09:30"
  startTime: string; // "09:00"
  endTime: string; // "09:15"
  reason?: string;
  status: AppointmentStatus;
  cancellationReason?: string;
  clinicalNotes?: string;
  vitalSigns?: VitalSigns;
  paymentMethod?: 'QR_SIMPLE' | 'TARJETA' | 'TRANSFERENCIA' | 'VENTANILLA';
  paymentTransactionId?: string;
  paymentAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
  email?: string;
  doctorId?: string; // If role is 'Médico'
  patientCi?: string; // If role is 'Paciente'
  patientId?: string; // If role is 'Paciente'
}


export interface AuditLogEntry {
  id: string;
  userId?: string;
  userName: string;
  userRole: string;
  moduleAffected: string;
  eventType: string;
  actionDescription: string;
  ipAddress: string;
  timestamp: string;
}

export interface UseCaseSpec {
  code: string; // e.g. "CU01"
  name: string;
  module: string; // "Módulo I: Seguridad, Acceso y Auditoría", etc.
  actors: string[];
  actorType: 'Primario' | 'Secundario' | 'Ambos';
  purpose: string;
  description: string;
  precondition: string;
  processFlow: string[];
  postcondition: string;
  exceptions: string[];
  pudsCycle: 'Ciclo 1 (Avance 50%)' | 'Ciclo 2 (Final 100%)';
  priority: '1 - Alta' | '2 - Media' | '3 - Baja';
  criticality: 'Crítica' | 'Alta' | 'Media';
  umlRelation: string; // "Asociación directa", "<<include>> de CU14", etc.
  bceClasses: {
    boundary: string;
    control: string;
    entity: string;
  };
  sequenceFlow: string;
  relatedRouteAction?: 'login' | 'booking' | 'payment' | 'reception' | 'agenda' | 'consultation' | 'profile' | 'reports' | 'audit' | 'doctors' | 'specialties';
}
