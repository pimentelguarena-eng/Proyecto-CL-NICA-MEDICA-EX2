import { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Stethoscope, 
  Search, 
  Phone, 
  Mail, 
  CreditCard,
  Printer,
  ChevronRight,
  ShieldCheck,
  QrCode,
  Building,
  Check,
  Lock,
  LogIn,
  UserPlus
} from 'lucide-react';
import type { Specialty, Doctor, DoctorSchedule, Patient, Appointment, UserSession } from '../types/clinic.ts';
import type { AuthModalMode } from './AuthModal.tsx';
import { 
  getAvailableSlotsForDoctorAndDate, 
  validateAppointmentSlot, 
  generateAppointmentCode, 
  isDuplicateCI,
  getSpanishDayOfWeek
} from '../utils/appointmentLogic.ts';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSpecialtyId?: string;
  preselectedDoctorId?: string;
  preselectedDate?: string;
  preselectedSlot?: { startTime: string; endTime: string; slotLabel: string } | null;
  currentSession: UserSession | null;
  onRequireAuth: (
    pendingContext: {
      specialtyId: string;
      specialtyName: string;
      doctorId: string;
      doctorName: string;
      date: string;
      timeSlot: string;
    },
    mode?: AuthModalMode
  ) => void;
  specialties: Specialty[];
  doctors: Doctor[];
  schedules: DoctorSchedule[];
  patients: Patient[];
  appointments: Appointment[];
  onSaveAppointment: (appointment: Appointment, newPatient?: Patient) => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  preselectedSpecialtyId,
  preselectedDoctorId,
  preselectedDate,
  preselectedSlot,
  currentSession,
  onRequireAuth,
  specialties,
  doctors,
  schedules,
  patients,
  appointments,
  onSaveAppointment,
}: BookingModalProps) {
  // Form State
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string; slotLabel: string } | null>(null);
  const [reason, setReason] = useState<string>('Consulta de valoración');

  // CU15 Payment State
  const [paymentMethod, setPaymentMethod] = useState<'QR_SIMPLE' | 'TARJETA' | 'TRANSFERENCIA' | 'VENTANILLA'>('QR_SIMPLE');
  const [cardHolder, setCardHolder] = useState<string>('');
  const [cardNumberLast4, setCardNumberLast4] = useState<string>('4242');

  // Patient Info State
  const [ciInput, setCiInput] = useState<string>('');
  const [existingPatient, setExistingPatient] = useState<Patient | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('1995-01-01');
  const [gender, setGender] = useState<'Masculino' | 'Femenino' | 'Otro'>('Femenino');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [bloodType, setBloodType] = useState<string>('O Positivo (O+)');
  const [allergies, setAllergies] = useState<string>('Ninguna');

  // Status & Error handling
  const [validationError, setValidationError] = useState<string | null>(null);
  const [bookedAppointment, setBookedAppointment] = useState<Appointment | null>(null);

  // Initialize or reset when opened
  useEffect(() => {
    if (isOpen) {
      setValidationError(null);
      setBookedAppointment(null);

      // Preselect specialty if provided
      if (preselectedSpecialtyId) {
        setSelectedSpecialtyId(preselectedSpecialtyId);
      } else if (!selectedSpecialtyId && specialties.length > 0) {
        setSelectedSpecialtyId(specialties[0].id);
      }

      if (preselectedDoctorId) {
        setSelectedDoctorId(preselectedDoctorId);
      }

      if (preselectedDate) {
        setSelectedDate(preselectedDate);
      } else {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 1);
        const yyyy = nextDate.getFullYear();
        const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
        const dd = String(nextDate.getDate()).padStart(2, '0');
        setSelectedDate(`${yyyy}-${mm}-${dd}`);
      }

      if (preselectedSlot) {
        setSelectedSlot(preselectedSlot);
      }
    }
  }, [isOpen, preselectedSpecialtyId, preselectedDoctorId, preselectedDate, preselectedSlot, specialties]);

  // When specialty changes, auto-select first available doctor in that specialty
  useEffect(() => {
    if (selectedSpecialtyId) {
      const docsInSpecialty = doctors.filter(d => d.specialtyIds.includes(selectedSpecialtyId) && d.isActive);
      if (docsInSpecialty.length > 0) {
        if (!selectedDoctorId || !docsInSpecialty.some(d => d.id === selectedDoctorId)) {
          setSelectedDoctorId(docsInSpecialty[0].id);
        }
      } else {
        setSelectedDoctorId('');
      }
    }
  }, [selectedSpecialtyId, doctors, selectedDoctorId]);

  // When doctor or date changes, reset slot unless already preselected
  useEffect(() => {
    if (!preselectedSlot) {
      setSelectedSlot(null);
    }
    setValidationError(null);
  }, [selectedDoctorId, selectedDate, preselectedSlot]);

  // Auto-fill authenticated patient data
  useEffect(() => {
    if (currentSession && currentSession.role === 'Paciente') {
      const found = patients.find(p => p.ci === currentSession.patientCi || p.id === currentSession.patientId);
      if (found) {
        setExistingPatient(found);
        setCiInput(found.ci);
        setFirstName(found.firstName);
        setLastName(found.lastName);
        setPhone(found.phone);
        setEmail(found.email || '');
        setBirthDate(found.birthDate);
        setGender(found.gender);
      } else {
        setCiInput(currentSession.patientCi || '');
        const parts = currentSession.fullName.split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      }
    }
  }, [currentSession, patients]);

  // Search existing patient by CI
  const handleCiLookup = (ci: string) => {
    setCiInput(ci);
    const found = patients.find(p => p.ci.trim().toLowerCase() === ci.trim().toLowerCase());
    if (found) {
      setExistingPatient(found);
      setFirstName(found.firstName);
      setLastName(found.lastName);
      setPhone(found.phone);
      setEmail(found.email || '');
      setBirthDate(found.birthDate);
      setGender(found.gender);
      setBloodType(found.bloodType || 'O Positivo (O+)');
      setAllergies(found.allergies || 'Ninguna');
    } else {
      setExistingPatient(null);
    }
  };

  if (!isOpen) return null;

  const currentSpecialty = specialties.find(s => s.id === selectedSpecialtyId);
  const eligibleDoctors = doctors.filter(d => d.specialtyIds.includes(selectedSpecialtyId) && d.isActive);
  const currentDoctor = doctors.find(d => d.id === selectedDoctorId);

  // Calculate available slots
  const availableSlots = currentDoctor && selectedDate
    ? getAvailableSlotsForDoctorAndDate(currentDoctor, selectedDate, schedules, appointments)
    : [];

  const dayOfWeek = selectedDate ? getSpanishDayOfWeek(selectedDate) : 'Lunes';

  const handleConfirmBooking = () => {
    setValidationError(null);

    if (!selectedSpecialtyId) {
      setValidationError('Por favor seleccione una especialidad médica.');
      return;
    }
    if (!currentDoctor) {
      setValidationError('Por favor seleccione un médico especialista disponible.');
      return;
    }
    if (!selectedDate) {
      setValidationError('Por favor seleccione la fecha de la consulta.');
      return;
    }
    if (!selectedSlot) {
      setValidationError('Por favor seleccione un horario disponible.');
      return;
    }
    if (!currentSession) {
      onRequireAuth({
        specialtyId: selectedSpecialtyId,
        specialtyName: currentSpecialty?.name || '',
        doctorId: currentDoctor.id,
        doctorName: currentDoctor.fullName,
        date: selectedDate,
        timeSlot: selectedSlot.slotLabel,
      }, 'LOGIN');

      return;
    }

    if (currentSession.role !== 'Paciente') {
      setValidationError('Solo los usuarios con rol PACIENTE pueden confirmar citas mediante el autoservicio en línea.');
      return;
    }


    // Server-side / Logic verification of availability before saving (RN13)
    const verification = validateAppointmentSlot({
      doctorId: currentDoctor.id,
      doctor: currentDoctor,
      date: selectedDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      schedules,
      existingAppointments: appointments,
    });

    if (!verification.isValid) {
      setValidationError(verification.errorMessage || 'El horario seleccionado ya no está disponible.');
      return;
    }

    const patientIdToUse = currentSession.patientId || existingPatient?.id || 'pac-001';
    let newPatientData: Patient | undefined;

    // If patient is not yet in clinic's patients list, create it from session
    if (!patients.some(p => p.id === patientIdToUse || (currentSession.patientCi && p.ci === currentSession.patientCi))) {
      const parts = currentSession.fullName.split(' ');
      newPatientData = {
        id: patientIdToUse,
        code: `PAC-${(patients.length + 1).toString().padStart(3, '0')}`,
        ci: currentSession.patientCi || ciInput || '5489123',
        firstName: parts[0] || currentSession.fullName,
        lastName: parts.slice(1).join(' ') || 'Paciente',
        birthDate: birthDate || '1995-01-01',
        gender: 'Femenino',
        phone: phone || '77341829',
        email: currentSession.email,
        isActive: true,
        bloodType: 'O Positivo (O+)',
        allergies: 'Ninguna',
      };
    }


    const appointmentCode = generateAppointmentCode(appointments);
    const consultationFee = currentSpecialty?.consultationFee || 180;
    const txId = `TRX-${Math.floor(100000 + Math.random() * 900000)}`;

    const newAppointment: Appointment = {
      id: `appt-${Date.now()}`,
      code: appointmentCode,
      patientId: patientIdToUse!,
      doctorId: currentDoctor.id,
      specialtyId: selectedSpecialtyId,
      date: selectedDate,
      timeSlot: selectedSlot.slotLabel,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      reason: reason.trim() || 'Consulta médica general',
      status: 'Programada',
      paymentMethod,
      paymentTransactionId: txId,
      paymentAmount: consultationFee,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveAppointment(newAppointment, newPatientData);
    setBookedAppointment(newAppointment);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-800 to-teal-700 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-teal-200" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">
                {bookedAppointment ? '¡Cita Confirmada con Éxito!' : 'Agendar Cita Médica'}
              </h3>
              <p className="text-xs text-teal-200">
                Clínica Medical • Citas Ambulatorias en Bloques de 15 minutos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-teal-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
          {bookedAppointment ? (
            /* Success Ticket Presentation with CU15 Payment Proof */
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-base font-bold text-emerald-950">
                    Tu cita médica ha sido confirmada y registrada en el sistema
                  </h4>
                  <p className="text-xs text-emerald-800 mt-1">
                    Presenta este comprobante o tu documento de identidad (CI) 10 minutos antes de la hora acordada en recepción.
                  </p>
                </div>
              </div>

              {/* Official Ticket Card (matching format from page 9 of PDF + CU15) */}
              <div className="border-2 border-dashed border-teal-300 rounded-3xl p-6 bg-slate-50/70 relative space-y-4">
                <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-teal-700">Comprobante Oficial</span>
                    <h5 className="text-lg font-black text-slate-900">CLÍNICA MEDICAL</h5>
                    <p className="text-xs text-slate-500">Atención ambulatoria de especialidades</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-100 text-teal-800">
                      {bookedAppointment.status}
                    </span>
                    <div className="text-xl font-mono font-black text-teal-700 mt-1">
                      {bookedAppointment.code}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-1 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold">Paciente:</span>
                    <strong className="text-slate-900 text-sm">
                      {firstName} {lastName}
                    </strong>
                    <span className="text-slate-500 block">CI: {ciInput}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Especialidad:</span>
                    <strong className="text-teal-800 text-sm">{currentSpecialty?.name}</strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Médico Asignado:</span>
                    <strong className="text-slate-900">{currentDoctor?.fullName}</strong>
                    <span className="text-slate-500 block">
                      {currentDoctor?.roomNumber || 'Consultorio de Especialidades'} • Reg: {currentDoctor?.licenseNumber}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Fecha y Horario:</span>
                    <strong className="text-slate-900">
                      {bookedAppointment.date} ({dayOfWeek})
                    </strong>
                    <span className="text-teal-700 font-bold block text-sm">
                      {bookedAppointment.timeSlot}
                    </span>
                  </div>
                </div>

                {/* CU15 Payment Proof Details */}
                <div className="p-3.5 bg-white rounded-2xl border border-teal-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-800">
                          Monto Consulta: {bookedAppointment.paymentAmount || currentSpecialty?.consultationFee || 180}.00 Bs
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {bookedAppointment.paymentMethod === 'VENTANILLA' ? 'Pago en Caja' : 'Pago Digital Confirmado'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Método: <strong>{bookedAppointment.paymentMethod}</strong> • Ref: <span className="font-mono text-teal-700 font-bold">{bookedAppointment.paymentTransactionId}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Transacción Segura</span>
                    <span className="text-xs font-bold text-teal-800">Pasarela Aprobada</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <span>Motivo: {bookedAppointment.reason}</span>
                  <span className="font-semibold text-slate-400">Atención Ambulatoria • Sin Internación</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Imprimir Comprobante</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBookedAppointment(null);
                    setSelectedSlot(null);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-teal-100 text-teal-800 hover:bg-teal-200 font-bold text-xs cursor-pointer"
                >
                  Agendar Otra Cita
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer shadow-md shadow-teal-600/20"
                >
                  Listo, Cerrar
                </button>
              </div>
            </div>
          ) : (
            /* Booking Form */
            <div className="space-y-6">
              
              {validationError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">No fue posible registrar la cita:</strong>
                    <p className="mt-0.5">{validationError}</p>
                  </div>
                </div>
              )}

              {/* Step 1: Specialty & Doctor Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    1. Especialidad Médica *
                  </label>
                  <select
                    value={selectedSpecialtyId}
                    onChange={(e) => setSelectedSpecialtyId(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  >
                    {specialties.map(spec => (
                      <option key={spec.id} value={spec.id}>
                        {spec.name} ({spec.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    2. Médico Especialista *
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  >
                    {eligibleDoctors.length > 0 ? (
                      eligibleDoctors.map(doc => (
                        <option key={doc.id} value={doc.id}>
                          {doc.fullName} ({doc.roomNumber || 'Consultorio'})
                        </option>
                      ))
                    ) : (
                      <option value="">No hay médicos activos para esta especialidad</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Step 2: Date & Available Time Slot */}
              <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100/80 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-teal-950 uppercase tracking-wider mb-1.5">
                      3. Fecha de la Cita *
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-teal-200 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500/20"
                    />
                    <span className="text-[11px] text-teal-700 font-medium block mt-1">
                      Día: <strong>{dayOfWeek}</strong>
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-950 uppercase tracking-wider mb-1.5">
                      Horarios de Disponibilidad (Bloques 15 min) *
                    </label>
                    <p className="text-[11px] text-slate-500">
                      {availableSlots.length > 0
                        ? `Seleccione uno de los ${availableSlots.filter(s => s.isAvailable).length} horarios disponibles`
                        : 'El médico no tiene horario disponible para este día'}
                    </p>
                  </div>
                </div>

                {/* Slots buttons */}
                <div>
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {availableSlots.map((slot, idx) => {
                        const isSelected = selectedSlot?.slotLabel === slot.slotLabel;
                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={!slot.isAvailable}
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-2.5 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                              isSelected
                                ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-500/30'
                                : slot.isAvailable
                                ? 'bg-white border border-teal-200 text-teal-900 hover:border-teal-500 hover:bg-teal-50'
                                : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed line-through opacity-60'
                            }`}
                            title={slot.isAvailable ? 'Horario disponible' : slot.conflictReason || 'Horario ocupado'}
                          >
                            <span>{slot.slotLabel}</span>
                            <span className="text-[10px] font-normal">
                              {slot.isAvailable ? 'Disponible' : 'Ocupado'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                      Este médico no atiende los días {dayOfWeek}. Por favor elija otra fecha según los turnos de atención.
                    </div>
                  )}
                </div>
              </div>

              {/* Step 4: Patient Information & Authentication Enforcement */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-teal-600" />
                    4. Identificación del Paciente
                  </h4>
                  {currentSession && currentSession.role === 'Paciente' ? (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Cuenta Paciente Verificada
                    </span>
                  ) : !currentSession ? (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      Inicio de Sesión Requerido
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                      Rol: {currentSession.role}
                    </span>
                  )}
                </div>

                {!currentSession ? (
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5 shadow-xs">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-sm font-bold text-amber-950">
                          Identificación de Paciente Obligatoria para Confirmar
                        </h5>
                        <p className="text-xs text-amber-900/80 leading-relaxed">
                          La consulta médica se asocia a la historia clínica del paciente autenticado. Puede consultar horarios libremente, pero para confirmar el turno debe acceder con su cuenta de paciente. Su selección actual (médico, fecha y horario) se conservará al iniciar sesión.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onRequireAuth({
                            specialtyId: selectedSpecialtyId,
                            specialtyName: currentSpecialty?.name || '',
                            doctorId: selectedDoctorId,
                            doctorName: currentDoctor?.fullName || '',
                            date: selectedDate,
                            timeSlot: selectedSlot?.slotLabel || '',
                          }, 'LOGIN');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Iniciar Sesión como Paciente</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onRequireAuth({
                            specialtyId: selectedSpecialtyId,
                            specialtyName: currentSpecialty?.name || '',
                            doctorId: selectedDoctorId,
                            doctorName: currentDoctor?.fullName || '',
                            date: selectedDate,
                            timeSlot: selectedSlot?.slotLabel || '',
                          }, 'REGISTER_PATIENT');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4 text-teal-600" />
                        <span>Crear Cuenta de Paciente</span>
                      </button>
                    </div>
                  </div>
                ) : currentSession.role !== 'Paciente' ? (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-rose-900 space-y-1">
                      <p className="font-bold">
                        Esta sección de reserva pública está reservada exclusivamente para cuentas de Pacientes.
                      </p>
                      <p>
                        Ha iniciado sesión con el rol <strong>{currentSession.role}</strong> ({currentSession.fullName}). Para gestionar citas institucionales, acceda al panel de su rol desde la barra superior.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Paciente Autenticado</span>
                        <span className="font-bold text-slate-900 text-sm block truncate">{currentSession.fullName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Documento de Identidad (CI)</span>
                        <span className="font-bold text-slate-900">{currentSession.patientCi || ciInput || 'Registrado'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Correo Electrónico</span>
                        <span className="font-medium text-slate-700 truncate block">{currentSession.email}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Motivo Breve de la Consulta (Opcional)
                      </label>
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Ej. Dolor articular, revisión médica preventiva, seguimiento..."
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 5: CU15 Payment Method Selection */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-teal-600" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      5. Pasarela de Pago de la Consulta
                    </h4>
                  </div>
                  <span className="text-xs font-black text-teal-700 bg-teal-100/80 px-2.5 py-0.5 rounded-full">
                    Arancel: {currentSpecialty?.consultationFee || 180}.00 Bs
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('QR_SIMPLE')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      paymentMethod === 'QR_SIMPLE'
                        ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <QrCode className="w-4 h-4 text-teal-600" />
                      <span className="text-xs font-bold text-slate-800">QR Simple</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      BCP, BNB, Mercantil, Fácil
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('TARJETA')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      paymentMethod === 'TARJETA'
                        ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <CreditCard className="w-4 h-4 text-teal-600" />
                      <span className="text-xs font-bold text-slate-800">Tarjeta Déb./Créd.</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Visa, Mastercard, En línea
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('TRANSFERENCIA')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      paymentMethod === 'TRANSFERENCIA'
                        ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Building className="w-4 h-4 text-teal-600" />
                      <span className="text-xs font-bold text-slate-800">Transferencia</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Cta. Cte. Banco Unión
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('VENTANILLA')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      paymentMethod === 'VENTANILLA'
                        ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Check className="w-4 h-4 text-teal-600" />
                      <span className="text-xs font-bold text-slate-800">En Ventanilla</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Pagar al llegar a caja
                    </p>
                  </button>
                </div>

                {/* Simulated payment detail */}
                {paymentMethod === 'QR_SIMPLE' && (
                  <div className="p-3 bg-white rounded-xl border border-teal-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-900 rounded-lg p-1.5 flex items-center justify-center text-white shrink-0">
                        <QrCode className="w-9 h-9" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">QR Simple Digital Interbancario</span>
                        <span className="text-[11px] text-slate-500">Monto: {currentSpecialty?.consultationFee || 180}.00 Bs • Cuenta Oficial Clínica Medical</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Listo para escanear
                    </span>
                  </div>
                )}

                {paymentMethod === 'TARJETA' && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="Titular de la tarjeta"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="p-2 rounded-lg border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Últimos 4 dígitos (Ej. 4242)"
                      value={cardNumberLast4}
                      onChange={(e) => setCardNumberLast4(e.target.value)}
                      maxLength={4}
                      className="p-2 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Validación instantánea según disponibilidad médica.
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  {!currentSession ? (
                    <button
                      type="button"
                      onClick={handleConfirmBooking}
                      className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-teal-700/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Iniciar Sesión para Reservar</span>
                    </button>
                  ) : currentSession.role !== 'Paciente' ? (
                    <button
                      type="button"
                      disabled
                      className="px-6 py-2.5 rounded-xl bg-slate-200 text-slate-400 font-bold text-xs uppercase tracking-wider cursor-not-allowed"
                    >
                      Reserva Exclusiva de Pacientes
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConfirmBooking}
                      className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-teal-600/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar Reserva</span>
                    </button>
                  )}

                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
