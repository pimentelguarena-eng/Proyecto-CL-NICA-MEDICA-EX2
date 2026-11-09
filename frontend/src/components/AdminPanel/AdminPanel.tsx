import { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  Stethoscope, 
  UserCheck, 
  BarChart3, 
  Users, 
  Clock, 
  ShieldCheck, 
  FileCheck2,
  Lock,
  Plus,
  BookOpen
} from 'lucide-react';
import type { 
  UserSession, 
  Appointment, 
  Doctor, 
  Patient, 
  Specialty, 
  DoctorSchedule,
  DoctorAbsence,
  AuditLogEntry
} from '../../types/clinic.ts';
import ReceptionView from './ReceptionView.tsx';
import DoctorAgendaView from './DoctorAgendaView.tsx';
import DoctorManagementView from './DoctorManagementView.tsx';
import ReportsView from './ReportsView.tsx';
import AuditLogView from './AuditLogView.tsx';
import StaffRequestsView from './StaffRequestsView.tsx';
import type { StaffRequestItem } from '../../utils/apiClient.ts';
import { FileBadge } from 'lucide-react';

interface AdminPanelProps {
  currentSession: UserSession | null;
  appointments: Appointment[];
  patients: Patient[];
  doctors: Doctor[];
  specialties: Specialty[];
  schedules: DoctorSchedule[];
  absences?: DoctorAbsence[];
  auditLogs: AuditLogEntry[];
  staffRequests?: StaffRequestItem[];
  onRefreshStaffRequests?: () => void;
  onRefreshLogs?: () => void;
  onUpdateAppointmentStatus: (
    appointmentId: string, 
    newStatus: Appointment['status'], 
    extraData?: { cancellationReason?: string; clinicalNotes?: string }
  ) => void;
  onRescheduleAppointment: (
    appointmentId: string, 
    newDate: string, 
    newSlot: { startTime: string; endTime: string; slotLabel: string }
  ) => { success: boolean; error?: string };
  onRegisterPatient: (patient: Patient) => { success: boolean; error?: string };
  onTogglePatientStatus: (patientId: string) => void;
  onAddDoctor: (doctor: Doctor) => void;
  onUpdateDoctor: (doctor: Doctor) => void;
  onToggleDoctorStatus: (doctorId: string) => void;
  onAddSchedule: (schedule: DoctorSchedule) => { success: boolean; error?: string };
  onDeleteSchedule: (scheduleId: string) => void;
  onOpenNewBooking: (specialtyId?: string) => void;
  onOpenExamTests?: () => void;
  onEmergencyCancelDay?: (
    doctorId: string,
    date: string,
    reason: string
  ) => Promise<{ success: boolean; count: number; message: string }>;
  onAddAbsence?: (absence: {
    doctorId: string;
    startDate: string;
    endDate: string;
    type: DoctorAbsence['type'];
    reason: string;
  }) => Promise<{ success: boolean; message: string; affectedAppointmentsCount?: number }>;
  onDeleteAbsence?: (id: string) => Promise<{ success: boolean; message: string }>;
}

export default function AdminPanel({
  currentSession,
  appointments,
  patients,
  doctors,
  specialties,
  schedules,
  absences = [],
  auditLogs,
  staffRequests = [],
  onRefreshStaffRequests = () => {},
  onRefreshLogs,
  onUpdateAppointmentStatus,
  onRescheduleAppointment,
  onRegisterPatient,
  onTogglePatientStatus,
  onAddDoctor,
  onUpdateDoctor,
  onToggleDoctorStatus,
  onAddSchedule,
  onDeleteSchedule,
  onOpenNewBooking,
  onOpenExamTests: _onOpenExamTests,
  onEmergencyCancelDay,
  onAddAbsence,
  onDeleteAbsence,
}: AdminPanelProps) {
  // Gate: Unauthenticated or Patient role
  if (!currentSession) {
    return (
      <div className="py-20 max-w-lg mx-auto text-center px-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl mx-auto flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black text-slate-900">Acceso Restringido al Personal Clínico</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Debe iniciar sesión como Médico, Recepcionista o Administrador para acceder a los paneles de gestión de la clínica.
          </p>
        </div>
      </div>
    );
  }

  if (currentSession.role === 'Paciente') {
    return (
      <div className="py-20 max-w-lg mx-auto text-center px-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-4">
          <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-2xl mx-auto flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black text-slate-900">Área Exclusiva para Personal Clínico</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Su cuenta tiene rol <strong>Paciente</strong>. Puede consultar sus citas médicas y resultados en el <strong>Portal del Paciente</strong>.
          </p>
        </div>
      </div>
    );
  }

  // Determine default tab based on role
  const getDefaultTab = () => {
    if (currentSession.role === 'Médico') return 'agenda';
    if (currentSession.role === 'Recepcionista') return 'reception';
    return 'reception'; // Admin can see all
  };

  const [activeTab, setActiveTab] = useState<'reception' | 'agenda' | 'doctors' | 'reports' | 'audit' | 'staffRequests'>(getDefaultTab());

  // Check role authorization for tab (RF01, RN12, CU05)
  const canAccessTab = (tab: string) => {
    if (currentSession.role === 'Administrador') return true;
    if (currentSession.role === 'Recepcionista' && (tab === 'reception' || tab === 'reports')) return true;
    if (currentSession.role === 'Médico' && (tab === 'agenda' || tab === 'reports')) return true;
    return false;
  };


  return (
    <div className="py-8 bg-slate-50 min-h-[85vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Top Control Bar with User & Clinic Context */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-700 text-white flex items-center justify-center font-black shadow-md">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">
                  Panel de Gestión Hospitalaria
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  Clínica Medical
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Sesión iniciada como <strong>{currentSession.fullName}</strong> ({currentSession.role})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {currentSession.role === 'Administrador' && (
              <div className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Administrador Único del Sistema</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => onOpenNewBooking()}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Cita</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation (Role-based permissions) */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          {canAccessTab('reception') && (
            <button
              type="button"
              onClick={() => setActiveTab('reception')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'reception'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Recepción y Pacientes</span>
            </button>
          )}

          {canAccessTab('agenda') && (
            <button
              type="button"
              onClick={() => setActiveTab('agenda')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'agenda'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Agenda Médica y Triaje</span>
            </button>
          )}

          {canAccessTab('doctors') && (
            <button
              type="button"
              onClick={() => setActiveTab('doctors')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'doctors'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Médicos y Horarios</span>
            </button>
          )}

          {canAccessTab('reports') && (
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'reports'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Reportes de Gestión</span>
            </button>
          )}

          {canAccessTab('audit') && (
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'audit'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Bitácora de Auditoría</span>
            </button>
          )}

          {canAccessTab('staffRequests') && (
            <button
              type="button"
              onClick={() => setActiveTab('staffRequests')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'staffRequests'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileBadge className="w-4 h-4" />
              <span>Solicitudes de Personal</span>
              {staffRequests.filter(r => r.status === 'PENDING').length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-900 font-black">
                  {staffRequests.filter(r => r.status === 'PENDING').length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'reception' && canAccessTab('reception') && (
            <ReceptionView
              appointments={appointments}
              patients={patients}
              doctors={doctors}
              specialties={specialties}
              schedules={schedules}
              absences={absences}
              onUpdateAppointmentStatus={onUpdateAppointmentStatus}
              onRescheduleAppointment={onRescheduleAppointment}
              onRegisterPatient={onRegisterPatient}
              onTogglePatientStatus={onTogglePatientStatus}
              onOpenNewBooking={onOpenNewBooking}
            />
          )}

          {activeTab === 'agenda' && canAccessTab('agenda') && (
            <DoctorAgendaView
              currentDoctorId={currentSession.doctorId}
              doctors={doctors}
              appointments={appointments}
              patients={patients}
              specialties={specialties}
              absences={absences}
              onMarkAttended={(apptId, notes, vitals) => 
                onUpdateAppointmentStatus(apptId, 'Atendida', { clinicalNotes: notes })
              }
              onEmergencyCancelDay={onEmergencyCancelDay}
              onAddAbsence={onAddAbsence}
              onDeleteAbsence={onDeleteAbsence}
            />
          )}

          {activeTab === 'doctors' && canAccessTab('doctors') && (
            <DoctorManagementView
              doctors={doctors}
              specialties={specialties}
              schedules={schedules}
              onAddDoctor={onAddDoctor}
              onUpdateDoctor={onUpdateDoctor}
              onToggleDoctorStatus={onToggleDoctorStatus}
              onAddSchedule={onAddSchedule}
              onDeleteSchedule={onDeleteSchedule}
            />
          )}

          {activeTab === 'reports' && canAccessTab('reports') && (
            <ReportsView
              appointments={appointments}
              patients={patients}
              doctors={doctors}
              specialties={specialties}
            />
          )}

          {activeTab === 'audit' && canAccessTab('audit') && (
            <AuditLogView logs={auditLogs} onRefresh={onRefreshLogs} />
          )}

          {activeTab === 'staffRequests' && canAccessTab('staffRequests') && (
            <StaffRequestsView
              requests={staffRequests}
              specialties={specialties}
              onRequestsUpdated={onRefreshStaffRequests}
            />
          )}
        </div>

      </div>
    </div>
  );
}
