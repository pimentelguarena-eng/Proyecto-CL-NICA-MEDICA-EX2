import { useState } from 'react';
import {
  X,
  User,
  HeartPulse,
  AlertTriangle,
  Pill,
  Activity,
  FileText,
  Calendar,
  Clock,
  Stethoscope,
  Phone,
  Droplets,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Printer,
  ChevronRight,
  ClipboardList,
  Thermometer,
  Weight
} from 'lucide-react';
import type { Patient, Appointment, Doctor, Specialty } from '../../types/clinic.ts';

interface PatientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  appointments: Appointment[];
  doctors: Doctor[];
  specialties: Specialty[];
  currentAppointmentId?: string;
}

export default function PatientHistoryModal({
  isOpen,
  onClose,
  patient,
  appointments,
  doctors,
  specialties,
  currentAppointmentId,
}: PatientHistoryModalProps) {
  const [filterMode, setFilterMode] = useState<'ALL' | 'ATTENDED_ONLY'>('ALL');

  if (!isOpen || !patient) return null;

  // Calculate age
  const calculateAge = (birthDateStr: string) => {
    if (!birthDateStr) return '--';
    const birth = new Date(birthDateStr);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Find all appointments for this patient, sorted chronologically descending (newest first)
  const patientAppointments = appointments
    .filter(a => a.patientId === patient.id)
    .sort((a, b) => new Date(`${b.date}T${b.startTime}`).getTime() - new Date(`${a.date}T${a.startTime}`).getTime());

  // Attended consultations with clinical notes
  const attendedAppointments = patientAppointments.filter(
    a => a.status === 'Atendida' || Boolean(a.clinicalNotes)
  );

  const displayedAppointments = filterMode === 'ATTENDED_ONLY' ? attendedAppointments : patientAppointments;

  // Format date helper: "10 de Octubre de 2026"
  const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculate approximate relative time: "Hace 2 semanas", "Hoy", "Futura"
  const getRelativeTimeDesc = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return 'Hoy';
    if (dateStr > today) return 'Cita Futura / Próxima';
    
    const d1 = new Date(dateStr);
    const d2 = new Date(today);
    const diffDays = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    const weeks = Math.floor(diffDays / 7);
    if (weeks === 1) return 'Hace 1 semana';
    if (weeks < 5) return `Hace ${weeks} semanas`;
    const months = Math.floor(diffDays / 30);
    return `Hace ${months} mes${months > 1 ? 'es' : ''}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-teal-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-teal-300" />
              <h2 className="text-xl font-black tracking-tight">
                Expediente e Historial Clínico Integral (CU21)
              </h2>
            </div>
            <p className="text-xs text-teal-100/80">
              CLÍNICA MEDICAL • Ficha de Antecedentes y Trazabilidad Interdisciplinaria de Consultas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Imprimir copia de expediente médico"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir Ficha</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Cerrar expediente"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-800">
          
          {/* Patient Master Identification Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-teal-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md">
                {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
              </div>
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">
                    {patient.firstName} {patient.lastName}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[11px] font-mono font-bold">
                    {patient.code}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[11px] font-bold">
                    CI: {patient.ci}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {patient.gender} • {calculateAge(patient.birthDate)} años (Nac: {patient.birthDate}) • Tel: {patient.phone} • {patient.email || 'Sin correo'}
                </p>
                {patient.address && (
                  <p className="text-[11px] text-slate-400">
                    Dirección: {patient.address}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Blood Group Badge */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5">
                <Droplets className="w-5 h-5 text-rose-600" />
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-rose-500 block tracking-wider">
                    Grupo Sanguíneo
                  </span>
                  <span className="text-sm font-black text-rose-900">
                    {patient.bloodType || 'No Registrado'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CRITICAL CLINICAL BACKGROUND / ANTECEDENTES (CU22) */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-teal-600" />
              <span>Antecedentes Clínicos y Alertas del Paciente (CU22)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* 1. Alergias (High Criticality Warning) */}
              <div className={`p-4 rounded-2xl border transition-all ${
                patient.allergies && patient.allergies !== 'Ninguna conocida' && patient.allergies !== 'Ninguna'
                  ? 'bg-rose-50/90 border-rose-200 text-rose-900 shadow-xs'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1.5">
                  {patient.allergies && patient.allergies !== 'Ninguna conocida' && patient.allergies !== 'Ninguna' ? (
                    <>
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span className="text-rose-800 uppercase tracking-wider font-extrabold text-[11px]">
                        ¡Alerta de Alergias!
                      </span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-800 uppercase tracking-wider font-extrabold text-[11px]">
                        Alergias
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs font-semibold">
                  {patient.allergies || 'Ninguna conocida'}
                </p>
                {patient.allergies && patient.allergies !== 'Ninguna conocida' && patient.allergies !== 'Ninguna' && (
                  <p className="text-[10px] text-rose-700/90 mt-1 font-medium italic">
                    Verificar compatibilidad antes de prescribir fármacos.
                  </p>
                )}
              </div>

              {/* 2. Patologías Crónicas */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950">
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1.5 text-amber-800 uppercase tracking-wider text-[11px]">
                  <Activity className="w-4 h-4 text-amber-600" />
                  <span>Enfermedades Crónicas</span>
                </div>
                <p className="text-xs font-semibold">
                  {patient.chronicDiseases || 'Ninguna reportada'}
                </p>
              </div>

              {/* 3. Medicación Habitual */}
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-950">
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1.5 text-blue-800 uppercase tracking-wider text-[11px]">
                  <Pill className="w-4 h-4 text-blue-600" />
                  <span>Medicación Habitual</span>
                </div>
                <p className="text-xs font-semibold">
                  {patient.currentMedications || 'Sin medicación continua'}
                </p>
              </div>

              {/* 4. Cirugías / Antecedentes */}
              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800">
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1.5 text-slate-700 uppercase tracking-wider text-[11px]">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>Cirugías y Otros</span>
                </div>
                <p className="text-xs font-medium">
                  {patient.medicalHistory || 'Sin intervenciones previas'}
                </p>
              </div>

            </div>

            {/* Emergency Contact */}
            {patient.emergencyContactName && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-xs text-slate-600">
                <Phone className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  Contacto de Emergencia: <strong>{patient.emergencyContactName}</strong> ({patient.emergencyContactRelationship || 'Familiar'}) • Teléfono: <strong>{patient.emergencyContactPhone || 'N/A'}</strong>
                </span>
              </div>
            )}
          </div>

          {/* HISTORIAL CRONOLÓGICO DE CONSULTAS MÉDICAS PREVIAS */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-700" />
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Historial de Consultas Médicas Previas y Prescripciones
                  </h4>
                  <p className="text-xs text-slate-500">
                    Evolución clínica, diagnósticos previos y tratamientos recetados por otros especialistas
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilterMode('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    filterMode === 'ALL'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todas ({patientAppointments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('ATTENDED_ONLY')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    filterMode === 'ATTENDED_ONLY'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Atendidas con Receta ({attendedAppointments.length})
                </button>
              </div>
            </div>

            {/* List of Previous Consultations */}
            <div className="space-y-4">
              {displayedAppointments.length > 0 ? (
                displayedAppointments.map((appt) => {
                  const doctor = doctors.find(d => d.id === appt.doctorId);
                  const specialty = specialties.find(s => s.id === appt.specialtyId);
                  const isCurrent = appt.id === currentAppointmentId;

                  return (
                    <div
                      key={appt.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'border-teal-400 bg-teal-50/40 ring-2 ring-teal-200/60 shadow-xs'
                          : appt.status === 'Atendida'
                          ? 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                          : 'border-slate-200 bg-slate-50/60 opacity-90'
                      }`}
                    >
                      {/* Top Bar of the Consultation Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded">
                            {appt.code}
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {formatFriendlyDate(appt.date)} ({appt.timeSlot})
                          </span>
                          <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                            {getRelativeTimeDesc(appt.date)}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-600 text-white">
                              Cita en Curso
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
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
                      </div>

                      {/* Specialist and Medical Service Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Médico que Atendió:
                          </span>
                          <span className="font-extrabold text-slate-900 text-sm">
                            {doctor ? doctor.fullName : 'Profesional Médico'}
                          </span>
                          <span className="text-slate-500 block text-[11px]">
                            Registro Profesional: {doctor?.licenseNumber || 'MP-BOL'} • {doctor?.roomNumber || 'Consultorio'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Especialidad Clínica:
                          </span>
                          <span className="font-extrabold text-teal-800 text-sm">
                            {specialty ? specialty.name : 'Especialidad'}
                          </span>
                          {appt.reason && (
                            <span className="text-slate-600 block text-[11px] italic">
                              Motivo: &quot;{appt.reason}&quot;
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Vital Signs (if recorded during that visit) */}
                      {appt.vitalSigns && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 mb-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                            <Activity className="w-3.5 h-3.5 text-teal-600" />
                            Signos Vitales y Triaje en Consulta:
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                            <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                              <span className="text-[10px] text-slate-400 block font-semibold">P. Arterial</span>
                              <span className="font-black text-slate-800">{appt.vitalSigns.bloodPressure || '--'}</span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                              <span className="text-[10px] text-slate-400 block font-semibold">Temperatura</span>
                              <span className="font-black text-slate-800">{appt.vitalSigns.temperatureC ? `${appt.vitalSigns.temperatureC} °C` : '--'}</span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                              <span className="text-[10px] text-slate-400 block font-semibold">Frec. Cardíaca</span>
                              <span className="font-black text-slate-800">{appt.vitalSigns.heartRate ? `${appt.vitalSigns.heartRate} lpm` : '--'}</span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                              <span className="text-[10px] text-slate-400 block font-semibold">Peso</span>
                              <span className="font-black text-slate-800">{appt.vitalSigns.weightKg ? `${appt.vitalSigns.weightKg} kg` : '--'}</span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                              <span className="text-[10px] text-slate-400 block font-semibold">Talla</span>
                              <span className="font-black text-slate-800">{appt.vitalSigns.heightCm ? `${appt.vitalSigns.heightCm} cm` : '--'}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* DIAGNOSIS AND TREATMENT / WHAT THE OTHER DOCTOR PRESCRIBED */}
                      {appt.clinicalNotes ? (
                        <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 space-y-2">
                          <div className="flex items-center gap-1.5 text-teal-900 font-extrabold text-xs">
                            <Pill className="w-4 h-4 text-teal-700" />
                            <span>Diagnóstico y Tratamiento Prescrito por el Médico:</span>
                          </div>
                          <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed font-medium bg-white/80 p-3 rounded-lg border border-teal-100">
                            {appt.clinicalNotes}
                          </div>
                        </div>
                      ) : appt.status === 'Cancelada' ? (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                          <strong>Cita Cancelada:</strong> {appt.cancellationReason || 'Sin motivo especificado'}
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-slate-100 text-xs text-slate-500 italic">
                          Consulta pendiente de atención. Aún no se han registrado notas clínicas ni prescripciones.
                        </div>
                      )}

                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                  <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No se encontraron consultas registradas con los filtros seleccionados.
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500">
            Confidencialidad médica regulada. Registro clínico oficial de CLÍNICA MEDICAL.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar Expediente
          </button>
        </div>

      </div>
    </div>
  );
}
