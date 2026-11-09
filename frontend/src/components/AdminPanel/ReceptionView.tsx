import { useState } from 'react';
import { 
  Search, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  UserX, 
  Ban, 
  RotateCcw, 
  FileText, 
  UserPlus, 
  AlertCircle,
  Eye,
  Filter,
  Users,
  ChevronDown
} from 'lucide-react';
import type { Appointment, Patient, Doctor, Specialty, DoctorSchedule, DoctorAbsence } from '../../types/clinic.ts';
import { 
  canTransitionStatus, 
  isDuplicateCI, 
  getAvailableSlotsForDoctorAndDate,
  validateAppointmentSlot,
  getSpanishDayOfWeek,
  getDoctorAbsenceForDate
} from '../../utils/appointmentLogic.ts';
import PatientHistoryModal from './PatientHistoryModal.tsx';

interface ReceptionViewProps {
  appointments: Appointment[];
  patients: Patient[];
  doctors: Doctor[];
  specialties: Specialty[];
  schedules: DoctorSchedule[];
  absences?: DoctorAbsence[];
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
  onOpenNewBooking: () => void;
}

export default function ReceptionView({
  appointments,
  patients,
  doctors,
  specialties,
  schedules,
  absences = [],
  onUpdateAppointmentStatus,
  onRescheduleAppointment,
  onRegisterPatient,
  onTogglePatientStatus,
  onOpenNewBooking,
}: ReceptionViewProps) {
  // Navigation sub-tab inside Reception
  const [activeSubTab, setActiveSubTab] = useState<'appointments' | 'patients'>('appointments');

  // Appointments filter state
  const [filterDate, setFilterDate] = useState<string>(() => {
    // Default to today or upcoming demo date
    return '2026-11-16';
  });
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [filterDoctorId, setFilterDoctorId] = useState<string>('TODOS');

  // Patient search state
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [showNewPatientModal, setShowNewPatientModal] = useState<boolean>(false);
  const [patientFormError, setPatientFormError] = useState<string | null>(null);
  const [selectedHistoryPatient, setSelectedHistoryPatient] = useState<Patient | null>(null);

  // New Patient Form
  const [newPacCi, setNewPacCi] = useState('');
  const [newPacFirstName, setNewPacFirstName] = useState('');
  const [newPacLastName, setNewPacLastName] = useState('');
  const [newPacBirthDate, setNewPacBirthDate] = useState('1990-01-01');
  const [newPacGender, setNewPacGender] = useState<'Masculino' | 'Femenino' | 'Otro'>('Femenino');
  const [newPacPhone, setNewPacPhone] = useState('');
  const [newPacEmail, setNewPacEmail] = useState('');
  const [newPacAddress, setNewPacAddress] = useState('');
  const [newPacBlood, setNewPacBlood] = useState('O Positivo (O+)');
  const [newPacAllergies, setNewPacAllergies] = useState('Ninguna');

  // Cancel Modal
  const [cancelModalAppt, setCancelModalAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Reschedule Modal
  const [rescheduleModalAppt, setRescheduleModalAppt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('2026-11-16');
  const [rescheduleSlot, setRescheduleSlot] = useState<{ startTime: string; endTime: string; slotLabel: string } | null>(null);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  // Filtered Appointments
  const filteredAppointments = appointments.filter((appt) => {
    const matchesDate = !filterDate || appt.date === filterDate;
    const matchesStatus = filterStatus === 'TODOS' || appt.status === filterStatus;
    const matchesDoctor = filterDoctorId === 'TODOS' || appt.doctorId === filterDoctorId;
    return matchesDate && matchesStatus && matchesDoctor;
  });

  // Filtered Patients
  const filteredPatients = patients.filter((pac) => {
    const term = patientSearch.trim().toLowerCase();
    if (!term) return true;
    return (
      pac.ci.toLowerCase().includes(term) ||
      pac.firstName.toLowerCase().includes(term) ||
      pac.lastName.toLowerCase().includes(term) ||
      pac.code.toLowerCase().includes(term)
    );
  });

  const handleSaveNewPatient = () => {
    setPatientFormError(null);
    if (!newPacCi.trim()) {
      setPatientFormError('El número de documento (CI) es obligatorio.');
      return;
    }
    if (!newPacFirstName.trim() || !newPacLastName.trim()) {
      setPatientFormError('Nombres y apellidos son obligatorios.');
      return;
    }
    if (!newPacPhone.trim()) {
      setPatientFormError('Número de teléfono es obligatorio.');
      return;
    }

    // RN01: Unique CI check
    if (isDuplicateCI(newPacCi, patients)) {
      setPatientFormError(`Ya existe un paciente registrado con el CI ${newPacCi}.`);
      return;
    }

    const newCode = `PAC-${(patients.length + 1).toString().padStart(3, '0')}`;
    const newPatient: Patient = {
      id: `pac-${Date.now()}`,
      code: newCode,
      ci: newPacCi.trim(),
      firstName: newPacFirstName.trim(),
      lastName: newPacLastName.trim(),
      birthDate: newPacBirthDate,
      gender: newPacGender,
      phone: newPacPhone.trim(),
      email: newPacEmail.trim() || undefined,
      address: newPacAddress.trim() || undefined,
      bloodType: newPacBlood,
      allergies: newPacAllergies,
      isActive: true,
    };

    const res = onRegisterPatient(newPatient);
    if (res.success) {
      setShowNewPatientModal(false);
      // Reset form
      setNewPacCi('');
      setNewPacFirstName('');
      setNewPacLastName('');
      setNewPacPhone('');
      setNewPacEmail('');
    } else {
      setPatientFormError(res.error || 'Error al guardar el paciente.');
    }
  };

  // Reschedule execution
  const handleExecuteReschedule = () => {
    if (!rescheduleModalAppt || !rescheduleSlot) {
      setRescheduleError('Seleccione un horario disponible.');
      return;
    }

    const result = onRescheduleAppointment(rescheduleModalAppt.id, rescheduleDate, rescheduleSlot);
    if (result.success) {
      setRescheduleModalAppt(null);
      setRescheduleSlot(null);
      setRescheduleError(null);
    } else {
      setRescheduleError(result.error || 'Conflicto de horario.');
    }
  };

  const currentRescheduleDoctor = rescheduleModalAppt
    ? doctors.find(d => d.id === rescheduleModalAppt.doctorId)
    : null;

  const currentRescheduleDoctorAbsence = currentRescheduleDoctor && rescheduleDate
    ? getDoctorAbsenceForDate(currentRescheduleDoctor.id, rescheduleDate, absences)
    : undefined;

  const rescheduleAvailableSlots = currentRescheduleDoctor && rescheduleDate
    ? getAvailableSlotsForDoctorAndDate(
        currentRescheduleDoctor,
        rescheduleDate,
        schedules,
        appointments.filter(a => a.id !== rescheduleModalAppt?.id), // exclude current appt
        absences
      )
    : [];

  return (
    <div className="space-y-6">
      
      {/* Sub-tab navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('appointments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'appointments'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Gestión de Citas y Asistencia</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('patients')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'patients'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Directorio de Pacientes</span>
          </button>
        </div>

        <div>
          {activeSubTab === 'appointments' ? (
            <button
              type="button"
              onClick={onOpenNewBooking}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Programar Cita Médica</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowNewPatientModal(true);
                setPatientFormError(null);
              }}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar Nuevo Paciente</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: Appointments Management */}
      {activeSubTab === 'appointments' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Filtrar por Fecha:
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Estado de la Cita:
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="Programada">Programada</option>
                <option value="Confirmada">Confirmada</option>
                <option value="Atendida">Atendida</option>
                <option value="Cancelada">Cancelada</option>
                <option value="Inasistencia">Inasistencia</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Médico:
              </label>
              <select
                value={filterDoctorId}
                onChange={(e) => setFilterDoctorId(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold"
              >
                <option value="TODOS">Todos los Médicos</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Appointments Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Código / Hora</th>
                  <th className="py-3 px-4">Paciente</th>
                  <th className="py-3 px-4">Especialidad & Médico</th>
                  <th className="py-3 px-4">Motivo</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones de Recepción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map((appt) => {
                    const patient = patients.find(p => p.id === appt.patientId);
                    const doctor = doctors.find(d => d.id === appt.doctorId);
                    const specialty = specialties.find(s => s.id === appt.specialtyId);

                    return (
                      <tr key={appt.id} className="hover:bg-slate-50/60">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-teal-800 block text-xs">
                            {appt.code}
                          </span>
                          <span className="font-bold text-slate-900 block">{appt.date}</span>
                          <span className="text-[11px] text-teal-600 font-semibold">{appt.timeSlot}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <strong className="text-slate-900 block font-bold">
                            {patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente'}
                          </strong>
                          <span className="text-slate-500 block text-[11px]">
                            CI: {patient?.ci} • Tel: {patient?.phone}
                          </span>
                          {patient?.allergies && patient.allergies !== 'Ninguna' && (
                            <span className="inline-block mt-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              Alergias: {patient.allergies}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-teal-900 block">{specialty?.name}</span>
                          <span className="text-slate-600 block">{doctor?.fullName}</span>
                          <span className="text-[11px] text-slate-400">{doctor?.roomNumber}</span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                          <span className="line-clamp-2">{appt.reason || 'Consulta médica'}</span>
                          {appt.cancellationReason && (
                            <span className="text-[11px] text-rose-600 block mt-1 italic">
                              Motivo canc.: {appt.cancellationReason}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              appt.status === 'Programada'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : appt.status === 'Confirmada'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : appt.status === 'Atendida'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : appt.status === 'Cancelada'
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {appt.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right space-y-1">
                          {/* Transitions depending on state */}
                          {appt.status === 'Programada' && (
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => onUpdateAppointmentStatus(appt.id, 'Confirmada')}
                                className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold text-[11px] border border-teal-200"
                                title="Confirmar asistencia telefónica o presencial"
                              >
                                Confirmar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRescheduleModalAppt(appt);
                                  setRescheduleDate(appt.date);
                                  setRescheduleSlot(null);
                                  setRescheduleError(null);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-[11px]"
                                title="Reprogramar fecha y hora"
                              >
                                Reprogramar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCancelModalAppt(appt);
                                  setCancelReason('');
                                }}
                                className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px]"
                                title="Cancelar cita"
                              >
                                Cancelar
                              </button>
                            </div>
                          )}

                          {appt.status === 'Confirmada' && (
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => onUpdateAppointmentStatus(appt.id, 'Atendida', { clinicalNotes: 'Atendido en consultorio regular' })}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-[11px]"
                                title="Registrar que el paciente ingresó y fue atendido"
                              >
                                Atendida
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateAppointmentStatus(appt.id, 'Inasistencia')}
                                className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 font-bold text-[11px]"
                                title="Paciente no se presentó a su horario"
                              >
                                Inasistencia
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCancelModalAppt(appt);
                                  setCancelReason('');
                                }}
                                className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px]"
                              >
                                Cancelar
                              </button>
                            </div>
                          )}

                          {appt.status === 'Atendida' && (
                            <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Consulta completada
                            </span>
                          )}

                          {appt.status === 'Cancelada' && (
                            <span className="text-[11px] text-rose-600 italic">
                              Cita cancelada (Slot liberado)
                            </span>
                          )}

                          {appt.status === 'Inasistencia' && (
                            <span className="text-[11px] text-amber-700">
                              Inasistencia registrada
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No se encontraron citas con los filtros seleccionados ({filterDate}).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Patient Directory (RF02) */}
      {activeSubTab === 'patients' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Registro y Directorio de Pacientes (RF02)
              </h3>
              <p className="text-xs text-slate-500">
                Control de historias, validación de CI único y desactivación segura (RN01, RN11)
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Buscar por CI, nombre o apellido..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">CI (Único)</th>
                  <th className="py-3 px-4">Nombre Completo</th>
                  <th className="py-3 px-4">Nacimiento / Sexo</th>
                  <th className="py-3 px-4">Contacto</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((pac) => {
                  const pacAppointments = appointments.filter(a => a.patientId === pac.id);

                  return (
                    <tr key={pac.id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-800">
                        {pac.code}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {pac.ci}
                      </td>
                      <td className="py-3.5 px-4">
                        <strong className="text-slate-900 block">{pac.firstName} {pac.lastName}</strong>
                        <span className="text-[11px] text-slate-400">
                          {pacAppointments.length} citas registradas
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {pac.birthDate}
                        <span className="block text-[11px] text-slate-500">{pac.gender}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="block font-semibold">{pac.phone}</span>
                        <span className="text-[11px] text-slate-500">{pac.email || 'Sin correo'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            pac.isActive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {pac.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedHistoryPatient(pac)}
                          className="mr-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer inline-flex items-center gap-1 shadow-xs"
                          title="Ver expediente clínico y antecedentes"
                        >
                          <FileText className="w-3.5 h-3.5 text-teal-600" />
                          <span>Expediente</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onTogglePatientStatus(pac.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            pac.isActive
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                          title="RN11: Desactivar registro sin eliminar el historial asociado"
                        >
                          {pac.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Patient Modal (RF02 & RN01) */}
      {showNewPatientModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Registrar Nuevo Paciente</h3>
                <p className="text-xs text-slate-500">Requerimiento RF02 • Regla RN01 (CI Único)</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewPatientModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            {patientFormError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{patientFormError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Documento de Identidad (CI) *
                  </label>
                  <input
                    type="text"
                    value={newPacCi}
                    onChange={(e) => setNewPacCi(e.target.value)}
                    placeholder="Ej. 6543210"
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Sexo Demográfico *
                  </label>
                  <select
                    value={newPacGender}
                    onChange={(e) => setNewPacGender(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    value={newPacFirstName}
                    onChange={(e) => setNewPacFirstName(e.target.value)}
                    placeholder="Nombres"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    value={newPacLastName}
                    onChange={(e) => setNewPacLastName(e.target.value)}
                    placeholder="Apellidos"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Fecha de Nacimiento *
                  </label>
                  <input
                    type="date"
                    value={newPacBirthDate}
                    onChange={(e) => setNewPacBirthDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Teléfono de Contacto *
                  </label>
                  <input
                    type="tel"
                    value={newPacPhone}
                    onChange={(e) => setNewPacPhone(e.target.value)}
                    placeholder="Ej. 77012345"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Correo Electrónico (Opcional)
                </label>
                <input
                  type="email"
                  value={newPacEmail}
                  onChange={(e) => setNewPacEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Domicilio (Opcional)
                </label>
                <input
                  type="text"
                  value={newPacAddress}
                  onChange={(e) => setNewPacAddress(e.target.value)}
                  placeholder="Dirección o barrio"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewPatientModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveNewPatient}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer"
              >
                Guardar Paciente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal (RF09) */}
      {cancelModalAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <Ban className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">Cancelar Cita Médica</h3>
                <span className="text-xs font-mono text-slate-500">{cancelModalAppt.code}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Regla RN09: La cita cancelada dejará de ocupar el horario y permanecerá disponible para consultas históricas.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Motivo de Cancelación *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Indique el motivo..."
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalAppt(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={!cancelReason.trim()}
                onClick={() => {
                  onUpdateAppointmentStatus(cancelModalAppt.id, 'Cancelada', { cancellationReason: cancelReason });
                  setCancelModalAppt(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal (RF08 & RN13) */}
      {rescheduleModalAppt && currentRescheduleDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Reprogramar Cita {rescheduleModalAppt.code}</h3>
                <p className="text-xs text-slate-500">
                  Médico: {currentRescheduleDoctor.fullName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleModalAppt(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            {rescheduleError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {rescheduleError}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Nueva Fecha *
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => {
                    setRescheduleDate(e.target.value);
                    setRescheduleSlot(null);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                />
                <span className="text-[11px] text-teal-700 mt-1 block">
                  Día: <strong>{getSpanishDayOfWeek(rescheduleDate)}</strong>
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Nuevos Horarios Disponibles (Verificados en servidor):
                </label>

                {rescheduleAvailableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    {rescheduleAvailableSlots.map((slot, i) => {
                      const isSelected = rescheduleSlot?.slotLabel === slot.slotLabel;
                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={!slot.isAvailable}
                          onClick={() => setRescheduleSlot(slot)}
                          className={`p-2 rounded-xl text-xs font-bold transition-all text-center ${
                            isSelected
                              ? 'bg-teal-600 text-white'
                              : slot.isAvailable
                              ? 'bg-teal-50 border border-teal-200 text-teal-900 hover:bg-teal-100'
                              : 'bg-slate-100 text-slate-400 line-through cursor-not-allowed opacity-60'
                          }`}
                        >
                          {slot.slotLabel}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 rounded-xl text-amber-800 text-xs">
                    El médico no tiene horarios configurados para este día.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRescheduleModalAppt(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!rescheduleSlot}
                onClick={handleExecuteReschedule}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold disabled:opacity-50"
              >
                Confirmar Reprogramación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Medical History Modal */}
      <PatientHistoryModal
        isOpen={Boolean(selectedHistoryPatient)}
        onClose={() => setSelectedHistoryPatient(null)}
        patient={selectedHistoryPatient}
        appointments={appointments}
        doctors={doctors}
        specialties={specialties}
      />

    </div>
  );
}
