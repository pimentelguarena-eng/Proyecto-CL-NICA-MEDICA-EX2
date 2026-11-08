import type { Appointment, Doctor, DoctorSchedule, Patient, AppointmentStatus } from '../types/clinic.ts';

/**
 * Returns the day of the week in Spanish matching DoctorSchedule['dayOfWeek']
 * given a date string "YYYY-MM-DD"
 */
export function getSpanishDayOfWeek(dateStr: string): DoctorSchedule['dayOfWeek'] {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayIndex = date.getDay(); // 0 is Sunday, 1 is Monday, ...
  const map: Record<number, DoctorSchedule['dayOfWeek']> = {
    0: 'Domingo',
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
  };
  return map[dayIndex] ?? 'Lunes';
}

/**
 * Converts "HH:mm" to total minutes from 00:00
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Converts total minutes to "HH:mm"
 */
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Checks if a given date string is in the past compared to reference date (today).
 * RN06: No se podrán registrar citas en fechas pasadas.
 */
export function isPastDate(dateStr: string, referenceDateStr?: string): boolean {
  const today = referenceDateStr || new Date().toISOString().split('T')[0];
  return dateStr < today;
}

/**
 * Generates all time slots (e.g. 15-min intervals) between startTime and endTime
 */
export function generateSlotsForSchedule(
  startTime: string,
  endTime: string,
  durationMinutes: number = 15
): { startTime: string; endTime: string; slotLabel: string }[] {
  const slots: { startTime: string; endTime: string; slotLabel: string }[] = [];
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  if (startMin >= endMin || durationMinutes <= 0) {
    return slots;
  }

  let current = startMin;
  while (current + durationMinutes <= endMin) {
    const slotStart = minutesToTime(current);
    const slotEnd = minutesToTime(current + durationMinutes);
    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      slotLabel: `${slotStart} - ${slotEnd}`,
    });
    current += durationMinutes;
  }

  return slots;
}

/**
 * Checks whether an appointment time range overlaps with another.
 * RN07: Un médico no podrá tener citas superpuestas.
 */
export function isTimeOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const sA = timeToMinutes(startA);
  const eA = timeToMinutes(endA);
  const sB = timeToMinutes(startB);
  const eB = timeToMinutes(endB);

  return Math.max(sA, sB) < Math.min(eA, eB);
}

/**
 * Checks doctor schedule validity.
 * RN05: La cita deberá pertenecer al horario de atención del médico.
 */
export function isWithinDoctorSchedule(
  startTime: string,
  endTime: string,
  schedules: DoctorSchedule[],
  dayOfWeek: DoctorSchedule['dayOfWeek']
): boolean {
  const relevantSchedules = schedules.filter(s => s.dayOfWeek === dayOfWeek);
  if (relevantSchedules.length === 0) return false;

  const apptStart = timeToMinutes(startTime);
  const apptEnd = timeToMinutes(endTime);

  return relevantSchedules.some(sched => {
    const schedStart = timeToMinutes(sched.startTime);
    const schedEnd = timeToMinutes(sched.endTime);
    return apptStart >= schedStart && apptEnd <= schedEnd;
  });
}

export interface AvailabilityCheckResult {
  isValid: boolean;
  errorCode?: 'DOCTOR_INACTIVE' | 'PAST_DATE' | 'OUTSIDE_HOURS' | 'SLOT_OCCUPIED' | 'INVALID_TIME';
  errorMessage?: string;
}

/**
 * RN04, RN05, RN06, RN07, RN09 Validation
 * Checks if a proposed appointment is valid for doctor, date, and time slot.
 */
export function validateAppointmentSlot(params: {
  doctorId: string;
  doctor: Doctor;
  date: string;
  startTime: string;
  endTime: string;
  schedules: DoctorSchedule[];
  existingAppointments: Appointment[];
  excludeAppointmentId?: string; // used when rescheduling
  todayStr?: string;
}): AvailabilityCheckResult {
  const { doctor, date, startTime, endTime, schedules, existingAppointments, excludeAppointmentId, todayStr } = params;

  // RN04: Doctor must be active
  if (!doctor.isActive) {
    return {
      isValid: false,
      errorCode: 'DOCTOR_INACTIVE',
      errorMessage: `El médico ${doctor.fullName} se encuentra inactivo y no puede recibir nuevas citas.`,
    };
  }

  // RN06: Not in the past
  if (isPastDate(date, todayStr)) {
    return {
      isValid: false,
      errorCode: 'PAST_DATE',
      errorMessage: 'No se pueden registrar citas en fechas pasadas.',
    };
  }

  // Time validity check
  if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    return {
      isValid: false,
      errorCode: 'INVALID_TIME',
      errorMessage: 'La hora de inicio debe ser anterior a la hora de finalización.',
    };
  }

  // RN05: Must belong to doctor's schedule on this day of week
  const dayOfWeek = getSpanishDayOfWeek(date);
  const doctorSchedulesForDoctor = schedules.filter(s => s.doctorId === doctor.id);
  const withinHours = isWithinDoctorSchedule(startTime, endTime, doctorSchedulesForDoctor, dayOfWeek);

  if (!withinHours) {
    return {
      isValid: false,
      errorCode: 'OUTSIDE_HOURS',
      errorMessage: `El médico no tiene horario de atención configurado para el día ${dayOfWeek} en el rango ${startTime} - ${endTime}.`,
    };
  }

  // RN07 & RN09: Overlapping check against non-cancelled appointments
  const conflictingAppointment = existingAppointments.find(appt => {
    if (appt.id === excludeAppointmentId) return false;
    if (appt.doctorId !== doctor.id) return false;
    if (appt.date !== date) return false;
    // RN09: Citas canceladas no ocupan disponibilidad
    if (appt.status === 'Cancelada') return false;

    return isTimeOverlapping(startTime, endTime, appt.startTime, appt.endTime);
  });

  if (conflictingAppointment) {
    return {
      isValid: false,
      errorCode: 'SLOT_OCCUPIED',
      errorMessage: `El médico ya tiene una cita ${conflictingAppointment.status.toLowerCase()} en el horario ${conflictingAppointment.timeSlot}.`,
    };
  }

  return { isValid: true };
}

/**
 * Returns all available slots for a doctor on a specific date
 */
export function getAvailableSlotsForDoctorAndDate(
  doctor: Doctor,
  date: string,
  schedules: DoctorSchedule[],
  existingAppointments: Appointment[],
  todayStr?: string
): { startTime: string; endTime: string; slotLabel: string; isAvailable: boolean; conflictReason?: string }[] {
  if (!doctor.isActive || isPastDate(date, todayStr)) {
    return [];
  }

  const dayOfWeek = getSpanishDayOfWeek(date);
  const doctorSchedules = schedules.filter(s => s.doctorId === doctor.id && s.dayOfWeek === dayOfWeek);

  const allPossibleSlots: { startTime: string; endTime: string; slotLabel: string }[] = [];
  for (const sched of doctorSchedules) {
    const slots = generateSlotsForSchedule(sched.startTime, sched.endTime, sched.slotDurationMinutes || 15);
    allPossibleSlots.push(...slots);
  }

  // Check each slot against existing appointments
  return allPossibleSlots.map(slot => {
    const check = validateAppointmentSlot({
      doctorId: doctor.id,
      doctor,
      date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      schedules,
      existingAppointments,
      todayStr,
    });

    return {
      startTime: slot.startTime,
      endTime: slot.endTime,
      slotLabel: slot.slotLabel,
      isAvailable: check.isValid,
      conflictReason: check.errorMessage,
    };
  });
}

/**
 * RN01: Unique CI check
 */
export function isDuplicateCI(ci: string, patients: Patient[], excludePatientId?: string): boolean {
  const normalized = ci.trim().toLowerCase();
  return patients.some(
    p => p.id !== excludePatientId && p.ci.trim().toLowerCase() === normalized
  );
}

/**
 * Generates sequential formatted code e.g. "CM-0001"
 */
export function generateAppointmentCode(existingAppointments: Appointment[]): string {
  const count = existingAppointments.length + 1;
  return `CM-${count.toString().padStart(4, '0')}`;
}

/**
 * State Transition Validator (RF10)
 */
export function canTransitionStatus(
  currentStatus: AppointmentStatus,
  targetStatus: AppointmentStatus
): { allowed: boolean; reason?: string } {
  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  // RN10: Citas atendidas conservan registro y no se pueden cancelar ni reprogramar
  if (currentStatus === 'Atendida') {
    return {
      allowed: false,
      reason: 'Una cita ya atendida no puede cambiar de estado ni cancelarse.',
    };
  }

  // Cancelada cannot directly become Atendida
  if (currentStatus === 'Cancelada') {
    return {
      allowed: false,
      reason: 'Una cita cancelada no puede reactivarse directamente sin una nueva programación.',
    };
  }

  // Inasistencia cannot be directly marked attended
  if (currentStatus === 'Inasistencia' && targetStatus === 'Atendida') {
    return {
      allowed: false,
      reason: 'No se puede marcar como atendida una cita registrada con inasistencia.',
    };
  }

  return { allowed: true };
}
