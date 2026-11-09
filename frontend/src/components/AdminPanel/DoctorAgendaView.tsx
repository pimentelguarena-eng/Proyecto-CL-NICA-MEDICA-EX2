import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  FileCheck2, 
  AlertTriangle, 
  Heart, 
  CheckCircle2, 
  Check, 
  Filter,
  Eye,
  Activity,
  Thermometer,
  FileText,
  ClipboardList,
  Ban,
  AlertCircle,
  Trash2,
  Plus
} from 'lucide-react';
import type { Appointment, Doctor, Patient, Specialty, VitalSigns, DoctorAbsence } from '../../types/clinic.ts';
import { getDoctorAbsenceForDate } from '../../utils/appointmentLogic.ts';
import PatientHistoryModal from './PatientHistoryModal.tsx';

interface DoctorAgendaViewProps {
  currentDoctorId?: string;
  doctors: Doctor[];
  appointments: Appointment[];
  patients: Patient[];
  specialties: Specialty[];
  absences?: DoctorAbsence[];
  onMarkAttended: (appointmentId: string, clinicalNotes: string, vitalSigns?: VitalSigns) => void;
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

export default function DoctorAgendaView({
  currentDoctorId,
  doctors,
  appointments,
  patients,
  specialties,
  absences = [],
  onMarkAttended,
  onEmergencyCancelDay,
  onAddAbsence,
  onDeleteAbsence,
}: DoctorAgendaViewProps) {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    currentDoctorId || doctors[2]?.id || doctors[0]?.id || ''
  );

  useEffect(() => {
    if (currentDoctorId) {
      setSelectedDoctorId(currentDoctorId);
    }
  }, [currentDoctorId]);
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-16');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');

  // Medical History Modal State (CU21)
  const [historyModalPatient, setHistoryModalPatient] = useState<Patient | null>(null);
  const [historyModalApptId, setHistoryModalApptId] = useState<string | undefined>(undefined);

  // Attend Modal State (CU20: Expediente Clínico)
  const [attendModalAppt, setAttendModalAppt] = useState<Appointment | null>(null);
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [bloodPressure, setBloodPressure] = useState('120/80');
  const [temperatureC, setTemperatureC] = useState('36.6');
  const [heartRate, setHeartRate] = useState('72');
  const [weightKg, setWeightKg] = useState('68');
  const [heightCm, setHeightCm] = useState('170');

  // Emergency Cancellation Modal State
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState('');
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [emergencyNotice, setEmergencyNotice] = useState<string | null>(null);

  // Doctor Absences and Vacations Modal State (CU12b)
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [absenceStartDate, setAbsenceStartDate] = useState('2026-11-20');
  const [absenceEndDate, setAbsenceEndDate] = useState('2026-11-27');
  const [absenceType, setAbsenceType] = useState<DoctorAbsence['type']>('VACACIONES');
  const [absenceReason, setAbsenceReason] = useState('Período vacacional anual');
  const [absenceLoading, setAbsenceLoading] = useState(false);
  const [absenceFeedback, setAbsenceFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const activeDoctor = doctors.find(d => d.id === selectedDoctorId);
  const doctorAbsences = absences.filter(a => a.doctorId === selectedDoctorId);
  const currentDayAbsence = selectedDate ? getDoctorAbsenceForDate(selectedDoctorId, selectedDate, absences) : undefined;

  // Filter appointments for this doctor & date
  const doctorAppointments = appointments.filter(a => {
    const matchesDoctor = a.doctorId === selectedDoctorId;
    const matchesDate = !selectedDate || a.date === selectedDate;
    const matchesStatus = statusFilter === 'TODOS' || a.status === statusFilter;
    return matchesDoctor && matchesDate && matchesStatus;
  });

  const handleConfirmAttend = () => {
    if (!attendModalAppt) return;
    const combinedNotes = `Diagnóstico: ${clinicalDiagnosis.trim() || 'Consulta médica general'}. Indicaciones: ${treatmentPlan.trim() || 'Control habitual'}.`;
    const vitals: VitalSigns = {
      bloodPressure: bloodPressure || undefined,
      temperatureC: temperatureC ? parseFloat(temperatureC) : undefined,
      heartRate: heartRate ? parseInt(heartRate, 10) : undefined,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      heightCm: heightCm ? parseInt(heightCm, 10) : undefined,
    };
    onMarkAttended(attendModalAppt.id, combinedNotes, vitals);
    setAttendModalAppt(null);
    setClinicalDiagnosis('');
    setTreatmentPlan('');
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
      
      {/* Header and Doctor Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-600" />
            <h2 className="text-xl font-black text-slate-900">
              Agenda de Atención Médica (RF11)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualización de pacientes asignados, control de citas y registro de atención clínica
          </p>
        </div>

        {/* Doctor and Date Pickers */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Médico Especialista:
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="p-2 text-xs font-bold rounded-xl border border-slate-200 bg-white"
            >
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  {d.fullName} ({d.roomNumber || 'Consultorio'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Fecha de Agenda:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Estado:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 text-xs font-bold rounded-xl border border-slate-200 bg-white"
            >
              <option value="TODOS">Todos</option>
              <option value="Programada">Programadas</option>
              <option value="Confirmada">Confirmadas</option>
              <option value="Atendida">Atendidas</option>
              <option value="Cancelada">Canceladas</option>
              <option value="Inasistencia">Inasistencias</option>
            </select>
          </div>
        </div>
      </div>

      {/* Doctor Summary Banner */}
      {activeDoctor && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div>
            <span className="font-extrabold text-teal-950 text-sm">{activeDoctor.fullName}</span>
            <span className="text-teal-700 block">
              Registro Médico: <strong>{activeDoctor.licenseNumber}</strong> • {activeDoctor.roomNumber || 'Consultorio Asignado'}
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 text-teal-900 font-semibold text-xs bg-white/80 px-3 py-1.5 rounded-xl border border-teal-200/60">
              <span>Citas en agenda: <strong>{doctorAppointments.length}</strong></span>
              <span>•</span>
              <span>Atendidas: <strong>{doctorAppointments.filter(a => a.status === 'Atendida').length}</strong></span>
            </div>

            {/* Absence & Vacation Management Trigger (CU12b) */}
            <button
              type="button"
              onClick={() => {
                setAbsenceStartDate(selectedDate || '2026-11-20');
                setAbsenceEndDate(selectedDate || '2026-11-27');
                setAbsenceType('VACACIONES');
                setAbsenceReason('Período vacacional anual programado');
                setAbsenceFeedback(null);
                setShowAbsenceModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Gestionar Ausencias / Vacaciones</span>
              {doctorAbsences.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-700 text-white text-[10px] font-black">
                  {doctorAbsences.length}
                </span>
              )}
            </button>

            {/* Emergency Cancellation Trigger */}
            <button
              type="button"
              onClick={() => {
                setEmergencyReason(
                  `Emergencia médica del especialista (${activeDoctor.fullName}). No se brindará atención en la fecha ${selectedDate}. Su ficha médica y pago se conservan 100% válidos para reprogramación sin costo en el portal.`
                );
                setShowEmergencyModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Declarar Emergencia del Día</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Absence Alert for Selected Date (CU12b) */}
      {currentDayAbsence && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs flex items-start gap-3 shadow-xs animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-extrabold text-amber-900 text-sm">
              Período de {currentDayAbsence.type === 'VACACIONES' ? 'Vacaciones' : currentDayAbsence.type} Activo en Esta Fecha
            </div>
            <p className="text-amber-900 leading-relaxed">
              El médico especialista se encuentra ausente desde el <strong>{currentDayAbsence.startDate}</strong> hasta el <strong>{currentDayAbsence.endDate}</strong> por <strong>{currentDayAbsence.type}</strong> (<em>"{currentDayAbsence.reason}"</em>).
            </p>
            <p className="text-[11px] text-amber-800 font-bold">
              ℹ️ Los pacientes que ingresen a la plataforma verán este estado y no podrán sacar ficha médica para este día.
            </p>
          </div>
        </div>
      )}

      {/* Emergency Notification Alert */}
      {emergencyNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="font-medium">{emergencyNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setEmergencyNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-sm cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Appointments List for Doctor */}
      <div className="space-y-3">
        {doctorAppointments.length > 0 ? (
          doctorAppointments.map((appt) => {
            const patient = patients.find(p => p.id === appt.patientId);
            const specialty = specialties.find(s => s.id === appt.specialtyId);

            return (
              <div
                key={appt.id}
                className="p-5 rounded-2xl border border-slate-200 hover:border-teal-300 transition-all bg-white flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 text-center shrink-0">
                    <span className="text-sm font-black text-teal-700 block">{appt.startTime}</span>
                    <span className="text-[11px] text-slate-400 block">{appt.endTime}</span>
                    <span className="text-[10px] font-mono text-slate-500 font-bold mt-1 block">
                      {appt.code}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">
                        {patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente'}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          appt.status === 'Atendida'
                            ? 'bg-emerald-100 text-emerald-800'
                            : appt.status === 'Confirmada'
                            ? 'bg-amber-100 text-amber-800'
                            : appt.status === 'Programada'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>CI: <strong>{patient?.ci}</strong></span>
                      <span>Edad: {patient ? new Date().getFullYear() - new Date(patient.birthDate).getFullYear() : '--'} años</span>
                      <span>Sangre: <strong>{patient?.bloodType || 'N/A'}</strong></span>
                      <span>Especialidad: {specialty?.name}</span>
                    </div>

                    {/* Allergies / Chronic diseases warning for the physician */}
                    {patient && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        {patient.allergies && patient.allergies !== 'Ninguna' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Alergias: {patient.allergies}
                          </span>
                        )}
                        {patient.chronicDiseases && patient.chronicDiseases !== 'Ninguna reportada' && (
                          <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            Antecedentes: {patient.chronicDiseases}
                          </span>
                        )}
                      </div>
                    )}

                    {appt.reason && (
                      <p className="text-xs text-slate-600 italic pt-1">
                        Motivo: &quot;{appt.reason}&quot;
                      </p>
                    )}

                    {appt.clinicalNotes && (
                      <div className="text-xs text-emerald-900 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 mt-2">
                        <strong>Nota Clínica Registrada:</strong> {appt.clinicalNotes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Doctor action button */}
                <div className="shrink-0 flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryModalPatient(patient || null);
                      setHistoryModalApptId(appt.id);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Ver expediente clínico, antecedentes y recetas de otros médicos"
                  >
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>Historial Clínico</span>
                  </button>

                  {appt.status !== 'Atendida' && appt.status !== 'Cancelada' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAttendModalAppt(appt);
                        setClinicalDiagnosis('');
                        setTreatmentPlan('');
                      }}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Atender Consulta</span>
                    </button>
                  )}
                  {appt.status === 'Atendida' && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" />
                      Consulta Finalizada
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs">
            No hay citas asignadas para este médico en la fecha {selectedDate}.
          </div>
        )}
      </div>

      {/* Attend Consultation Modal (RF10 & Médico) */}
      {attendModalAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-lg">
                  Registrar Atención Médica ({attendModalAppt.code})
                </h3>
                <p className="text-xs text-slate-500">
                  Completar consulta y asentar notas en el historial del paciente
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAttendModalAppt(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Quick Patient Context & History Shortcut */}
              {(() => {
                const currentPatient = patients.find(p => p.id === attendModalAppt.patientId);
                return (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-slate-900 text-xs">
                          {currentPatient ? `${currentPatient.firstName} ${currentPatient.lastName}` : 'Paciente'}
                        </span>
                        <span className="text-slate-500 text-[11px] block">
                          CI: {currentPatient?.ci} • Sangre: <strong>{currentPatient?.bloodType || 'N/A'}</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setHistoryModalPatient(currentPatient || null);
                          setHistoryModalApptId(attendModalAppt.id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                        title="Ver qué le recetaron otros doctores y antecedentes"
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                        <span>Ver Historial y Recetas</span>
                      </button>
                    </div>

                    {currentPatient?.allergies && currentPatient.allergies !== 'Ninguna conocida' && currentPatient.allergies !== 'Ninguna' && (
                      <div className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>ALERTA DE ALERGIAS: {currentPatient.allergies}</span>
                      </div>
                    )}

                    {currentPatient?.currentMedications && (
                      <div className="text-[11px] text-blue-900 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Medicación actual: {currentPatient.currentMedications}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* CU20: Signos Vitales y Triaje */}
              <div className="p-3 bg-teal-50/60 rounded-2xl border border-teal-100 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-teal-900 text-[11px] uppercase tracking-wider">
                  <Activity className="w-4 h-4 text-teal-700" />
                  <span>Signos Vitales y Triaje Clínico</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">P. Arterial</label>
                    <input
                      type="text"
                      value={bloodPressure}
                      onChange={(e) => setBloodPressure(e.target.value)}
                      placeholder="120/80"
                      className="w-full p-1.5 rounded-lg border border-teal-200 bg-white font-mono text-center text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Temp (°C)</label>
                    <input
                      type="text"
                      value={temperatureC}
                      onChange={(e) => setTemperatureC(e.target.value)}
                      placeholder="36.5"
                      className="w-full p-1.5 rounded-lg border border-teal-200 bg-white font-mono text-center text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Pulso (lpm)</label>
                    <input
                      type="text"
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      placeholder="72"
                      className="w-full p-1.5 rounded-lg border border-teal-200 bg-white font-mono text-center text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Peso (kg)</label>
                    <input
                      type="text"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="70"
                      className="w-full p-1.5 rounded-lg border border-teal-200 bg-white font-mono text-center text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Talla (cm)</label>
                    <input
                      type="text"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      placeholder="170"
                      className="w-full p-1.5 rounded-lg border border-teal-200 bg-white font-mono text-center text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Diagnóstico Clínico / Conclusión *
                </label>
                <input
                  type="text"
                  value={clinicalDiagnosis}
                  onChange={(e) => setClinicalDiagnosis(e.target.value)}
                  placeholder="Ej. Rinofaringitis aguda, HTA compensada..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Tratamiento Ambulatorio e Indicaciones
                </label>
                <textarea
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  placeholder="Prescripciones, estudios complementarios ambulatorios o fecha de próximo control..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAttendModalAppt(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAttend}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
              >
                Guardar y Marcar Atendida
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Cancellation Modal */}
      {showEmergencyModal && activeDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-rose-100 space-y-4 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-rose-100 text-rose-700">
                  <AlertTriangle className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Declarar Emergencia Médica del Día
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeDoctor.fullName} • Fecha: <strong>{selectedDate}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Impacto en la Agenda de Consultas:</span>
              </div>
              <p>
                Se suspenderán <strong>{doctorAppointments.filter(a => a.status === 'Programada' || a.status === 'Confirmada').length} citas médicas activas</strong> programadas para el <strong>{selectedDate}</strong>.
              </p>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                ✓ Se notificará a los pacientes automáticamente por correo electrónico.<br />
                ✓ Las fichas médicas pagadas se conservarán 100% válidas para que los pacientes elijan otro día de atención en el portal sin costo adicional.
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-slate-700 uppercase tracking-wider">
                Motivo de la Emergencia / Contingencia *
              </label>
              <textarea
                rows={3}
                required
                value={emergencyReason}
                onChange={(e) => setEmergencyReason(e.target.value)}
                placeholder="Describa el motivo de la emergencia..."
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-xs text-slate-800"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={emergencyLoading}
                onClick={() => setShowEmergencyModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={emergencyLoading || doctorAppointments.filter(a => a.status === 'Programada' || a.status === 'Confirmada').length === 0 || !emergencyReason.trim()}
                onClick={async () => {
                  if (!onEmergencyCancelDay) return;
                  setEmergencyLoading(true);
                  try {
                    const res = await onEmergencyCancelDay(selectedDoctorId, selectedDate, emergencyReason);
                    setEmergencyNotice(res.message);
                    setShowEmergencyModal(false);
                  } catch (err: any) {
                    alert(err.message || 'Error al procesar la cancelación por emergencia.');
                  } finally {
                    setEmergencyLoading(false);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-rose-600/20"
              >
                {emergencyLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Ban className="w-4 h-4" />
                    <span>Confirmar y Notificar a Pacientes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Absences and Vacations Modal (CU12b) */}
      {showAbsenceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-100 space-y-5 text-slate-800 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-amber-100 text-amber-700">
                  <Calendar className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Gestión de Ausencias y Vacaciones
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeDoctor?.fullName} • Matrícula: {activeDoctor?.licenseNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAbsenceModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {/* Absence Feedback Message */}
            {absenceFeedback && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 ${
                  absenceFeedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border border-rose-200 text-rose-900'
                }`}
              >
                <span>{absenceFeedback.message}</span>
                <button
                  type="button"
                  onClick={() => setAbsenceFeedback(null)}
                  className="font-bold cursor-pointer"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Currently registered absences list */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Períodos Registrados ({doctorAbsences.length})
              </h4>
              {doctorAbsences.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {doctorAbsences.map(abs => (
                    <div
                      key={abs.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                            {abs.type}
                          </span>
                          <span className="font-bold text-slate-800">
                            Del {abs.startDate} al {abs.endDate}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] italic">
                          "{abs.reason}"
                        </p>
                        <span className="text-[10px] text-slate-400 block">
                          Registrado por: {abs.createdBy}
                        </span>
                      </div>

                      {onDeleteAbsence && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm('¿Está seguro de eliminar este período de ausencia?')) {
                              try {
                                const res = await onDeleteAbsence(abs.id);
                                setAbsenceFeedback({ type: 'success', message: res.message });
                              } catch (err: any) {
                                setAbsenceFeedback({ type: 'error', message: err.message || 'Error al eliminar ausencia.' });
                              }
                            }
                          }}
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer shrink-0 transition-all"
                          title="Eliminar período de ausencia"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-500 text-xs text-center">
                  No hay ausencias ni vacaciones programadas actualmente para este médico.
                </div>
              )}
            </div>

            {/* Form to register a new absence */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-amber-600" />
                <span>Programar Nueva Ausencia / Vacación</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    required
                    value={absenceStartDate}
                    onChange={(e) => setAbsenceStartDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Fecha de Fin *
                  </label>
                  <input
                    type="date"
                    required
                    value={absenceEndDate}
                    onChange={(e) => setAbsenceEndDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block font-bold text-slate-700 mb-1">
                  Tipo de Ausencia *
                </label>
                <select
                  value={absenceType}
                  onChange={(e) => setAbsenceType(e.target.value as DoctorAbsence['type'])}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
                >
                  <option value="VACACIONES">Vacaciones programadas</option>
                  <option value="PERMISO">Permiso institucional</option>
                  <option value="CONGRESO">Congreso médico / Académico</option>
                  <option value="LICENCIA">Licencia médica o personal</option>
                  <option value="OTRO">Otro motivo justificado</option>
                </select>
              </div>

              <div className="text-xs">
                <label className="block font-bold text-slate-700 mb-1">
                  Motivo o Justificación *
                </label>
                <textarea
                  rows={2}
                  required
                  value={absenceReason}
                  onChange={(e) => setAbsenceReason(e.target.value)}
                  placeholder="Ej: Período de vacaciones aprobado por jefatura..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-white/90 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                ℹ️ <strong>Efecto en el Sistema:</strong> Durante este período los pacientes verán al médico como <em>"No Disponible por Vacaciones / Ausencia"</em> y no podrán sacar fichas médicas. Si existen citas activas ya agendadas en ese rango, serán suspendidas automáticamente y los pacientes podrán reprogramar gratuitamente desde su portal.
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  disabled={absenceLoading || !absenceStartDate || !absenceEndDate || !absenceReason.trim()}
                  onClick={async () => {
                    if (!onAddAbsence) return;
                    if (absenceStartDate > absenceEndDate) {
                      setAbsenceFeedback({ type: 'error', message: 'La fecha de inicio no puede ser posterior a la fecha de fin.' });
                      return;
                    }
                    setAbsenceLoading(true);
                    setAbsenceFeedback(null);
                    try {
                      const res = await onAddAbsence({
                        doctorId: selectedDoctorId,
                        startDate: absenceStartDate,
                        endDate: absenceEndDate,
                        type: absenceType,
                        reason: absenceReason,
                      });
                      setAbsenceFeedback({
                        type: 'success',
                        message: res.message || 'Ausencia registrada correctamente.',
                      });
                      setAbsenceReason('');
                    } catch (err: any) {
                      setAbsenceFeedback({
                        type: 'error',
                        message: err.message || 'Error al registrar la ausencia.',
                      });
                    } finally {
                      setAbsenceLoading(false);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-amber-600/20 disabled:opacity-50"
                >
                  {absenceLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Guardar Período de Ausencia</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAbsenceModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Medical History & Consultation Timeline Modal (CU21) */}
      <PatientHistoryModal
        isOpen={Boolean(historyModalPatient)}
        onClose={() => {
          setHistoryModalPatient(null);
          setHistoryModalApptId(undefined);
        }}
        patient={historyModalPatient}
        appointments={appointments}
        doctors={doctors}
        specialties={specialties}
        currentAppointmentId={historyModalApptId}
      />

    </div>
  );
}
