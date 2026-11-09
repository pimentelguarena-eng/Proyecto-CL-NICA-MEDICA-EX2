import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSlotsForSchedule,
  isTimeOverlapping,
  isDuplicateCI,
  validateAppointmentSlot,
  canTransitionStatus,
  generateAppointmentCode,
  timeToMinutes,
  getDoctorAbsenceForDate,
  getAvailableSlotsForDoctorAndDate,
} from './appointmentLogic.ts';
import type { Doctor, DoctorSchedule, Appointment, Patient, DoctorAbsence } from '../types/clinic.ts';

test('timeToMinutes converts HH:mm accurately', () => {
  assert.equal(timeToMinutes('00:00'), 0);
  assert.equal(timeToMinutes('08:30'), 510);
  assert.equal(timeToMinutes('12:00'), 720);
});

test('generateSlotsForSchedule creates 15 min intervals', () => {
  const slots = generateSlotsForSchedule('08:00', '09:00', 15);
  assert.equal(slots.length, 4);
  assert.equal(slots[0].startTime, '08:00');
  assert.equal(slots[0].endTime, '08:15');
  assert.equal(slots[3].startTime, '08:45');
  assert.equal(slots[3].endTime, '09:00');
});

test('isTimeOverlapping accurately detects collisions', () => {
  // Overlapping
  assert.equal(isTimeOverlapping('09:00', '09:15', '09:00', '09:15'), true);
  assert.equal(isTimeOverlapping('09:00', '10:00', '09:15', '09:45'), true);
  // Contiguous slots do NOT overlap
  assert.equal(isTimeOverlapping('09:00', '09:15', '09:15', '09:30'), false);
  assert.equal(isTimeOverlapping('10:00', '10:15', '09:00', '09:15'), false);
});

test('isDuplicateCI catches duplicate document numbers', () => {
  const patients: Patient[] = [
    {
      id: 'p1',
      code: 'PAC-001',
      ci: '1234567',
      firstName: 'María',
      lastName: 'López',
      birthDate: '1990-05-12',
      gender: 'Femenino',
      phone: '77123456',
      isActive: true,
    },
  ];

  assert.equal(isDuplicateCI('1234567', patients), true);
  assert.equal(isDuplicateCI(' 1234567 ', patients), true); // trimmed
  assert.equal(isDuplicateCI('9999999', patients), false);
  assert.equal(isDuplicateCI('1234567', patients, 'p1'), false); // excluding self when updating
});

test('validateAppointmentSlot enforces RN04, RN05, RN06, RN07, RN09', () => {
  const doctor: Doctor = {
    id: 'd1',
    code: 'MED-001',
    licenseNumber: 'MP-8921',
    fullName: 'Dr. Juan Pérez',
    specialtyIds: ['esp-cardio'],
    phone: '70011223',
    email: 'jperez@clinicamedical.com',
    isActive: true,
  };

  const schedule: DoctorSchedule = {
    id: 's1',
    doctorId: 'd1',
    dayOfWeek: 'Lunes',
    startTime: '08:00',
    endTime: '12:00',
    slotDurationMinutes: 15,
  };

  const existingAppointments: Appointment[] = [
    {
      id: 'a1',
      code: 'CM-0001',
      patientId: 'p1',
      doctorId: 'd1',
      specialtyId: 'esp-cardio',
      date: '2026-11-16', // Lunes
      startTime: '09:00',
      endTime: '09:15',
      timeSlot: '09:00 - 09:15',
      status: 'Programada',
      createdAt: '2026-10-20T08:00:00Z',
      updatedAt: '2026-10-20T08:00:00Z',
    },
  ];

  // 1. Success on valid slot
  const validCheck = validateAppointmentSlot({
    doctorId: 'd1',
    doctor,
    date: '2026-11-16',
    startTime: '08:00',
    endTime: '08:15',
    schedules: [schedule],
    existingAppointments,
    todayStr: '2026-10-20',
  });
  assert.equal(validCheck.isValid, true);

  // 2. Failure: Slot occupied (RN07)
  const overlapCheck = validateAppointmentSlot({
    doctorId: 'd1',
    doctor,
    date: '2026-11-16',
    startTime: '09:00',
    endTime: '09:15',
    schedules: [schedule],
    existingAppointments,
    todayStr: '2026-10-20',
  });
  assert.equal(overlapCheck.isValid, false);
  assert.equal(overlapCheck.errorCode, 'SLOT_OCCUPIED');

  // 3. RN09: Cancelled appointment frees up slot
  const appointmentsWithCancelled: Appointment[] = [
    { ...existingAppointments[0], status: 'Cancelada' },
  ];
  const cancelledCheck = validateAppointmentSlot({
    doctorId: 'd1',
    doctor,
    date: '2026-11-16',
    startTime: '09:00',
    endTime: '09:15',
    schedules: [schedule],
    existingAppointments: appointmentsWithCancelled,
    todayStr: '2026-10-20',
  });
  assert.equal(cancelledCheck.isValid, true);

  // 4. RN06: Past date rejected
  const pastCheck = validateAppointmentSlot({
    doctorId: 'd1',
    doctor,
    date: '2026-10-10',
    startTime: '08:00',
    endTime: '08:15',
    schedules: [schedule],
    existingAppointments: [],
    todayStr: '2026-10-20',
  });
  assert.equal(pastCheck.isValid, false);
  assert.equal(pastCheck.errorCode, 'PAST_DATE');

  // 5. RN05: Outside doctor schedule hours
  const outsideCheck = validateAppointmentSlot({
    doctorId: 'd1',
    doctor,
    date: '2026-11-16',
    startTime: '13:00',
    endTime: '13:15',
    schedules: [schedule],
    existingAppointments: [],
    todayStr: '2026-10-20',
  });
  assert.equal(outsideCheck.isValid, false);
  assert.equal(outsideCheck.errorCode, 'OUTSIDE_HOURS');

  // 6. RN04: Inactive doctor cannot receive appointments
  const inactiveDoctorCheck = validateAppointmentSlot({
    doctorId: 'd1',
    doctor: { ...doctor, isActive: false },
    date: '2026-11-16',
    startTime: '08:00',
    endTime: '08:15',
    schedules: [schedule],
    existingAppointments: [],
    todayStr: '2026-10-20',
  });
  assert.equal(inactiveDoctorCheck.isValid, false);
  assert.equal(inactiveDoctorCheck.errorCode, 'DOCTOR_INACTIVE');
});

test('canTransitionStatus enforces RN10 and valid flows', () => {
  // Attended cannot be cancelled or altered (RN10)
  assert.equal(canTransitionStatus('Atendida', 'Cancelada').allowed, false);
  assert.equal(canTransitionStatus('Atendida', 'Programada').allowed, false);

  // Programada to Confirmada is allowed
  assert.equal(canTransitionStatus('Programada', 'Confirmada').allowed, true);
  // Confirmada to Atendida is allowed
  assert.equal(canTransitionStatus('Confirmada', 'Atendida').allowed, true);
});

test('generateAppointmentCode increments sequentially', () => {
  assert.equal(generateAppointmentCode([]), 'CM-0001');
  const existing = [{ id: '1' }, { id: '2' }] as Appointment[];
  assert.equal(generateAppointmentCode(existing), 'CM-0003');
});

test('DoctorAbsence validation blocks appointments during vacations or scheduled absence (CU12b)', () => {
  const doctor: Doctor = {
    id: 'doc-002',
    code: 'MED-002',
    licenseNumber: 'MP-6621-SC',
    fullName: 'Dra. Elena Vargas',
    specialtyIds: ['esp-dermato'],
    phone: '71029384',
    email: 'elena.vargas@clinicamedical.com',
    isActive: true,
  };

  const schedule: DoctorSchedule = {
    id: 's-derm-1',
    doctorId: 'doc-002',
    dayOfWeek: 'Viernes',
    startTime: '08:30',
    endTime: '12:30',
    slotDurationMinutes: 15,
  };

  const absences: DoctorAbsence[] = [
    {
      id: 'abs-1',
      doctorId: 'doc-002',
      startDate: '2026-11-20',
      endDate: '2026-11-27',
      type: 'VACACIONES',
      reason: 'Período vacacional anual programado por jefatura médica',
      createdAt: '2026-11-01T08:00:00Z',
      createdBy: 'Admin',
    },
  ];

  // 1. Helper function correctly finds active absence on range dates
  assert.ok(getDoctorAbsenceForDate('doc-002', '2026-11-20', absences));
  assert.ok(getDoctorAbsenceForDate('doc-002', '2026-11-24', absences));
  assert.ok(getDoctorAbsenceForDate('doc-002', '2026-11-27', absences));
  assert.equal(getDoctorAbsenceForDate('doc-002', '2026-11-28', absences), undefined);
  assert.equal(getDoctorAbsenceForDate('doc-other', '2026-11-24', absences), undefined);

  // 2. validateAppointmentSlot blocks date inside absence
  const blockedCheck = validateAppointmentSlot({
    doctorId: 'doc-002',
    doctor,
    date: '2026-11-20', // Viernes inside vacation
    startTime: '08:30',
    endTime: '08:45',
    schedules: [schedule],
    existingAppointments: [],
    absences,
    todayStr: '2026-11-01',
  });

  assert.equal(blockedCheck.isValid, false);
  assert.equal(blockedCheck.errorCode, 'DOCTOR_ABSENT');
  assert.ok(blockedCheck.errorMessage?.includes('Vacaciones programadas'));
  assert.ok(blockedCheck.errorMessage?.includes('Período vacacional anual'));

  // 3. validateAppointmentSlot allows dates outside vacation
  const allowedCheck = validateAppointmentSlot({
    doctorId: 'doc-002',
    doctor,
    date: '2026-12-04', // Viernes after vacation
    startTime: '08:30',
    endTime: '08:45',
    schedules: [schedule],
    existingAppointments: [],
    absences,
    todayStr: '2026-11-01',
  });

  assert.equal(allowedCheck.isValid, true);

  // 4. getAvailableSlotsForDoctorAndDate flags slots unavailable during absence
  const slotsDuringAbsence = getAvailableSlotsForDoctorAndDate(
    doctor,
    '2026-11-20',
    [schedule],
    [],
    absences,
    '2026-11-01'
  );
  assert.ok(slotsDuringAbsence.length > 0);
  assert.ok(slotsDuringAbsence.every(s => !s.isAvailable));
  assert.ok(slotsDuringAbsence[0].conflictReason?.includes('Vacaciones programadas'));
});
