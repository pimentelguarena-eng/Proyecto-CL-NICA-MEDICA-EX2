/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import type { 
  Specialty, 
  ClinicalService, 
  Doctor, 
  DoctorSchedule, 
  Patient, 
  Appointment, 
  UserSession,
  AuditLogEntry
} from './types/clinic.ts';
import { 
  INITIAL_SPECIALTIES, 
  INITIAL_SERVICES, 
  INITIAL_DOCTORS, 
  INITIAL_SCHEDULES, 
  INITIAL_PATIENTS, 
  INITIAL_APPOINTMENTS
} from './data/initialData.ts';
import { INITIAL_AUDIT_LOGS } from './data/useCasesData.ts';
import Navbar from './components/Navbar.tsx';
import Hero from './components/Hero.tsx';
import SpecialtiesSection from './components/SpecialtiesSection.tsx';
import ServicesSection from './components/ServicesSection.tsx';
import BookingModal from './components/BookingModal.tsx';
import PatientPortal from './components/PatientPortal.tsx';
import AdminPanel from './components/AdminPanel/AdminPanel.tsx';
import ExamValidationModal from './components/AdminPanel/ExamValidationModal.tsx';
import AuthModal, { type AuthModalMode } from './components/AuthModal.tsx';
import Footer from './components/Footer.tsx';
import { canTransitionStatus, validateAppointmentSlot } from './utils/appointmentLogic.ts';
import { apiClient, type StaffRequestItem } from './utils/apiClient.ts';

interface PendingBookingSlot {
  specialtyId: string;
  specialtyName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  timeSlot: string;
}

export default function App() {
  // Global Data State
  const [specialties, setSpecialties] = useState<Specialty[]>(INITIAL_SPECIALTIES);
  const [services] = useState<ClinicalService[]>(INITIAL_SERVICES);
  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>(INITIAL_SCHEDULES);
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [staffRequests, setStaffRequests] = useState<StaffRequestItem[]>([]);

  // Active Session & View State (Default to unauthenticated visitor for public consultation)
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null);
  const [currentView, setCurrentView] = useState<'portal' | 'patient' | 'admin'>('portal');

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('LOGIN');

  // Modal States
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [pendingBookingSlot, setPendingBookingSlot] = useState<PendingBookingSlot | null>(null);
  const [preselectedBookingSpecialtyId, setPreselectedBookingSpecialtyId] = useState<string | undefined>(undefined);
  const [selectedSpecialtyDetail, setSelectedSpecialtyDetail] = useState<Specialty | null>(null);
  const [isExamTestsOpen, setIsExamTestsOpen] = useState(false);

  // Active Patient for Patient Portal
  const [activePatient, setActivePatient] = useState<Patient | null>(null);

  // Helper: Inmutable Audit Logging
  const logAuditEvent = useCallback((event: { moduleAffected: string; eventType: string; actionDescription: string }) => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newLog: AuditLogEntry = {
      id: `log-${Date.now().toString().slice(-4)}`,
      userName: currentSession?.username || currentSession?.email || 'visitante_anonimo',
      userRole: currentSession?.role || 'Visitante',
      moduleAffected: event.moduleAffected,
      eventType: event.eventType,
      actionDescription: event.actionDescription,
      ipAddress: '190.181.42.15',
      timestamp: formattedDate,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [currentSession]);

  // Load Staff Requests (for Admin)
  // Load Staff Requests (for Admin)
  const loadStaffRequests = useCallback(async () => {
    try {
      const res = await apiClient.getStaffRequests();
      if (res && res.requests) {
        setStaffRequests(res.requests);
      }
    } catch {
      // ignore
    }
  }, []);

  // Check initial authentication from saved token
  useEffect(() => {
    const checkAuth = async () => {
      const token = apiClient.getToken();
      if (!token) return;

      try {
        const res = await apiClient.getMe();
        if (res && res.user) {
          const u = res.user;
          const session: UserSession = {
            id: u.id,
            username: u.email.split('@')[0],
            fullName: u.fullName,
            role: u.role,
            doctorId: u.doctorId,
            patientId: u.patientId,
            patientCi: u.patientCi,
            email: u.email,
          };
          setCurrentSession(session);

          if (session.patientCi) {
            const pac = patients.find(p => p.ci === session.patientCi);
            if (pac) setActivePatient(pac);
          }

          if (session.role === 'Administrador') {
            loadStaffRequests();
          }
        }
      } catch {
        apiClient.clearToken();
      }
    };

    checkAuth();
  }, [patients, loadStaffRequests]);

  // Handler: Open Booking Modal
  const handleOpenBooking = (specialtyId?: string) => {
    setPreselectedBookingSpecialtyId(specialtyId);
    setIsBookingOpen(true);
  };

  // Handler: Require Authentication during booking process (Requirement 6)
  const handleRequireAuth = (pendingContext: PendingBookingSlot, mode: AuthModalMode = 'LOGIN') => {
    setPendingBookingSlot(pendingContext);
    setAuthModalMode(mode);
    setIsBookingOpen(false);
    setIsAuthModalOpen(true);
  };


  // Handler: Successful login from AuthModal
  const handleLoginSuccess = (user: import('./utils/apiClient.ts').AuthUser) => {
    const session: UserSession = {
      id: user.id,
      username: user.email.split('@')[0],
      fullName: user.fullName,
      role: user.role,
      doctorId: user.doctorId,
      patientId: user.patientId,
      patientCi: user.patientCi,
      email: user.email,
    };

    setCurrentSession(session);
    setIsAuthModalOpen(false);

    // If patient CI is present, sync activePatient or add to list if not present
    if (session.patientCi) {
      const pac = patients.find(p => p.ci === session.patientCi);
      if (pac) {
        setActivePatient(pac);
      } else {
        const parts = session.fullName.split(' ');
        const newPac: Patient = {
          id: session.patientId || `pac-${Date.now()}`,
          code: `PAC-${(patients.length + 1).toString().padStart(3, '0')}`,
          ci: session.patientCi,
          firstName: parts[0] || session.fullName,
          lastName: parts.slice(1).join(' ') || 'Paciente',
          birthDate: '1995-01-01',
          gender: 'Femenino',
          phone: user.phone || '77341829',
          email: session.email,
          isActive: true,
          bloodType: 'O Positivo (O+)',
          allergies: 'Ninguna',
        };
        setPatients(prev => [...prev, newPac]);
        setActivePatient(newPac);
      }
    }

    logAuditEvent({
      moduleAffected: 'Módulo I: Autenticación y RBAC',
      eventType: 'INICIO_SESION_EXITOSO',
      actionDescription: `Usuario ${session.fullName} (${session.email}) autenticado con rol '${session.role}'.`,
    });

    if (session.role === 'Administrador') {
      loadStaffRequests();
    }

    // Requirement 6: If there was a pending booking and logged-in user is Paciente, preserve selection and reopen booking
    if (pendingBookingSlot && session.role === 'Paciente') {
      setIsBookingOpen(true);
      return;
    }

    // Requirement 8: Role-based redirection
    if (session.role === 'Paciente') {
      setCurrentView('patient');
    } else if (session.role === 'Médico' || session.role === 'Recepcionista' || session.role === 'Administrador') {
      setCurrentView('admin');
    }
  };


  // Handler: Patient Registered
  const handlePatientRegistered = (newPac: Patient) => {
    setPatients(prev => {
      if (prev.some(p => p.ci === newPac.ci)) return prev;
      return [...prev, newPac];
    });
    setActivePatient(newPac);

    logAuditEvent({
      moduleAffected: 'Módulo I: Registro de Pacientes',
      eventType: 'PACIENTE_AUTORREGISTRADO',
      actionDescription: `Registro autónomo de paciente ${newPac.firstName} ${newPac.lastName} (CI: ${newPac.ci}). Estado: ACTIVO. Rol: Paciente asignado por backend.`,
    });
  };

  // Handler: Staff Request Submitted
  const handleStaffRequestSubmitted = (req: StaffRequestItem) => {
    setStaffRequests(prev => [req, ...prev]);
    logAuditEvent({
      moduleAffected: 'Módulo I: Solicitudes de Personal',
      eventType: 'SOLICITUD_PERSONAL_RECIBIDA',
      actionDescription: `Solicitud de ingreso para ${req.type === 'MEDICO' ? 'Médico' : 'Recepcionista'} registrada: ${req.fullName}. Estado: PENDIENTE de revisión administrativa.`,
    });
  };

  // Handler: Logout
  const handleLogout = async () => {
    const prevUser = currentSession?.fullName || 'Usuario';
    await apiClient.logout();
    setCurrentSession(null);
    setActivePatient(null);
    setPendingBookingSlot(null);
    setCurrentView('portal');

    logAuditEvent({
      moduleAffected: 'Módulo I: Autenticación',
      eventType: 'CIERRE_SESION',
      actionDescription: `Sesión cerrada por ${prevUser}. Token invalidado en servidor y cliente.`,
    });
  };

  // Handler: Save newly created appointment
  const handleSaveAppointment = (newAppointment: Appointment, newPatient?: Patient) => {
    setAppointments(prev => [newAppointment, ...prev]);

    if (newPatient) {
      setPatients(prev => [...prev, newPatient]);
      setActivePatient(newPatient);
      logAuditEvent({
        moduleAffected: 'Módulo II: Pacientes',
        eventType: 'PACIENTE_REGISTRADO',
        actionDescription: `Paciente ${newPatient.firstName} ${newPatient.lastName} registrado en cita con CI ${newPatient.ci}.`,
      });
    }

    logAuditEvent({
      moduleAffected: 'Módulo IV: Citas Médicas y Pagos',
      eventType: 'CITA_PROGRAMADA_Y_PAGADA',
      actionDescription: `Cita ${newAppointment.code} confirmada para el ${newAppointment.date} (${newAppointment.timeSlot}). Paciente autenticado: ${currentSession?.fullName || 'Paciente'}. Arancel: ${newAppointment.paymentAmount || 180}.00 Bs (${newAppointment.paymentMethod}).`,
    });

    setPendingBookingSlot(null);
  };

  // Handler: Update appointment status
  const handleUpdateAppointmentStatus = (
    appointmentId: string,
    newStatus: Appointment['status'],
    extraData?: { cancellationReason?: string; clinicalNotes?: string }
  ) => {
    setAppointments(prev =>
      prev.map(appt => {
        if (appt.id !== appointmentId) return appt;

        const check = canTransitionStatus(appt.status, newStatus);
        if (!check.allowed) {
          alert(`Operación no permitida: ${check.reason}`);
          return appt;
        }

        logAuditEvent({
          moduleAffected: newStatus === 'Atendida' ? 'Módulo V: Historial Clínico' : 'Módulo IV: Citas Médicas',
          eventType: `CITA_${newStatus.toUpperCase()}`,
          actionDescription: `Cita ${appt.code} actualizada a '${newStatus}'. ${extraData?.cancellationReason ? 'Motivo: ' + extraData.cancellationReason : ''} ${extraData?.clinicalNotes ? 'Registro clínico inmutable asentado.' : ''}`,
        });

        return {
          ...appt,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          cancellationReason: extraData?.cancellationReason || appt.cancellationReason,
          clinicalNotes: extraData?.clinicalNotes || appt.clinicalNotes,
        };
      })
    );
  };

  // Handler: Reschedule Appointment
  const handleRescheduleAppointment = (
    appointmentId: string,
    newDate: string,
    newSlot: { startTime: string; endTime: string; slotLabel: string }
  ): { success: boolean; error?: string } => {
    const existing = appointments.find(a => a.id === appointmentId);
    if (!existing) return { success: false, error: 'Cita no encontrada.' };

    const doc = doctors.find(d => d.id === existing.doctorId);
    if (!doc) return { success: false, error: 'Médico no encontrado.' };

    const check = validateAppointmentSlot({
      doctorId: doc.id,
      doctor: doc,
      date: newDate,
      startTime: newSlot.startTime,
      endTime: newSlot.endTime,
      schedules,
      existingAppointments: appointments,
      excludeAppointmentId: appointmentId,
    });

    if (!check.isValid) {
      return { success: false, error: check.errorMessage };
    }

    logAuditEvent({
      moduleAffected: 'Módulo IV: Citas Médicas',
      eventType: 'CITA_REPROGRAMADA',
      actionDescription: `Cita ${existing.code} reprogramada con éxito al ${newDate} (${newSlot.slotLabel}) con ${doc.fullName}.`,
    });

    setAppointments(prev =>
      prev.map(a => {
        if (a.id !== appointmentId) return a;
        return {
          ...a,
          date: newDate,
          startTime: newSlot.startTime,
          endTime: newSlot.endTime,
          timeSlot: newSlot.slotLabel,
          status: 'Programada',
          updatedAt: new Date().toISOString(),
        };
      })
    );

    return { success: true };
  };

  // Admin and Staff Handlers
  const handleRegisterPatient = (newPatient: Patient): { success: boolean; error?: string } => {
    setPatients(prev => [...prev, newPatient]);
    return { success: true };
  };

  const handleTogglePatientStatus = (patientId: string) => {
    setPatients(prev =>
      prev.map(p => (p.id === patientId ? { ...p, isActive: !p.isActive } : p))
    );
  };

  const handleAddDoctor = (newDoc: Doctor) => {
    setDoctors(prev => [...prev, newDoc]);
  };

  const handleUpdateDoctor = (updatedDoc: Doctor) => {
    setDoctors(prev => prev.map(d => (d.id === updatedDoc.id ? updatedDoc : d)));
  };

  const handleToggleDoctorStatus = (doctorId: string) => {
    setDoctors(prev =>
      prev.map(d => (d.id === doctorId ? { ...d, isActive: !d.isActive } : d))
    );
  };

  const handleAddSchedule = (newSched: DoctorSchedule): { success: boolean; error?: string } => {
    setSchedules(prev => [...prev, newSched]);
    return { success: true };
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    setSchedules(prev => prev.filter(s => s.id !== scheduleId));
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentSession={currentSession}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode || 'LOGIN');
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onOpenBooking={handleOpenBooking}
        onOpenExamTests={() => setIsExamTestsOpen(true)}
        onNavigate={setCurrentView}
        currentView={currentView}
      />

      {/* Main View Router */}
      <main className="grow">
        {currentView === 'portal' && (
          <>
            {/* Hero Section with Search, Stats & Outpatient Disclaimer */}
            <Hero
              specialties={specialties}
              onOpenBooking={handleOpenBooking}
              onSelectSpecialty={setSelectedSpecialtyDetail}
            />

            {/* Specialties Section with all 22 required specialties */}
            <SpecialtiesSection
              specialties={specialties}
              doctors={doctors}
              onBookSpecialty={handleOpenBooking}
              selectedSpecialtyModal={selectedSpecialtyDetail}
              setSelectedSpecialtyModal={setSelectedSpecialtyDetail}
            />

            {/* Diagnostic & Support Services Section (9 services) */}
            <ServicesSection
              services={services}
              onOpenBooking={() => handleOpenBooking()}
            />
          </>
        )}

        {currentView === 'patient' && (
          <PatientPortal
            currentPatient={activePatient}
            patients={patients}
            onSelectPatient={setActivePatient}
            onUpdatePatient={(upd) => {
              setPatients(prev => prev.map(p => (p.id === upd.id ? upd : p)));
              setActivePatient(upd);
            }}
            appointments={appointments}
            doctors={doctors}
            specialties={specialties}
            onCancelAppointment={(id, reason) =>
              handleUpdateAppointmentStatus(id, 'Cancelada', { cancellationReason: reason })
            }
            onOpenBooking={() => handleOpenBooking()}
          />
        )}

        {currentView === 'admin' && (
          <AdminPanel
            currentSession={currentSession}
            appointments={appointments}
            patients={patients}
            doctors={doctors}
            specialties={specialties}
            schedules={schedules}
            auditLogs={auditLogs}
            staffRequests={staffRequests}
            onRefreshStaffRequests={loadStaffRequests}
            onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
            onRescheduleAppointment={handleRescheduleAppointment}
            onRegisterPatient={handleRegisterPatient}
            onTogglePatientStatus={handleTogglePatientStatus}
            onAddDoctor={handleAddDoctor}
            onUpdateDoctor={handleUpdateDoctor}
            onToggleDoctorStatus={handleToggleDoctorStatus}
            onAddSchedule={handleAddSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            onOpenNewBooking={handleOpenBooking}
            onOpenExamTests={() => setIsExamTestsOpen(true)}
          />
        )}
      </main>

      {/* Booking Modal with Slot Preservation and Mandatory Patient Auth */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false);
          setPendingBookingSlot(null);
        }}
        preselectedSpecialtyId={pendingBookingSlot?.specialtyId || preselectedBookingSpecialtyId}
        preselectedDoctorId={pendingBookingSlot?.doctorId}
        preselectedDate={pendingBookingSlot?.date}
        preselectedSlot={pendingBookingSlot ? {
          startTime: pendingBookingSlot.timeSlot.split(' - ')[0] || '',
          endTime: pendingBookingSlot.timeSlot.split(' - ')[1] || '',
          slotLabel: pendingBookingSlot.timeSlot,
        } : null}
        currentSession={currentSession}
        onRequireAuth={handleRequireAuth}
        specialties={specialties}
        doctors={doctors}
        schedules={schedules}
        patients={patients}
        appointments={appointments}
        onSaveAppointment={handleSaveAppointment}
      />

      {/* Authentication and Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        pendingBookingContext={pendingBookingSlot ? {
          specialtyName: pendingBookingSlot.specialtyName,
          doctorName: pendingBookingSlot.doctorName,
          date: pendingBookingSlot.date,
          timeSlot: pendingBookingSlot.timeSlot,
        } : undefined}
        onLoginSuccess={handleLoginSuccess}
        specialties={specialties}
        doctors={doctors}
      />


      {/* Exam 2 Verification Harness Modal */}
      <ExamValidationModal
        isOpen={isExamTestsOpen}
        onClose={() => setIsExamTestsOpen(false)}
        patients={patients}
        doctors={doctors}
        schedules={schedules}
        appointments={appointments}
      />

      {/* Comprehensive Footer */}
      <Footer
        specialties={specialties}
        services={services}
        onOpenBooking={handleOpenBooking}
        onOpenExamTests={() => setIsExamTestsOpen(true)}
      />
    </div>
  );
}
