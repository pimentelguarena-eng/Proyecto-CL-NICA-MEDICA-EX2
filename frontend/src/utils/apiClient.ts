import type { Appointment, UserSession, Specialty, ClinicalService, Doctor, DoctorSchedule, DoctorAbsence, AuditLogEntry } from '../types/clinic.ts';

const TOKEN_KEY = 'clinica_medical_auth_token';
const REMEMBER_KEY = 'clinica_medical_remember';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'Administrador' | 'Recepcionista' | 'Médico' | 'Paciente';
  doctorId?: string;
  patientId?: string;
  patientCi?: string;
  phone?: string;
}

export interface StaffRequestItem {
  id: string;
  type: 'MEDICO' | 'RECEPCIONISTA';
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ci: string;
  specialtyId?: string;
  licenseNumber?: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface SystemStatusResponse {
  singleAdminValid: boolean;
  activeAdminCount: number;
  administratorEmail: string | null;
  totalUsers: number;
  usersByRole: {
    Administrador: number;
    Médico: number;
    Recepcionista: number;
    Paciente: number;
  };
  pendingStaffRequestsCount: number;
  totalAppointments: number;
  totalAuditLogs: number;
}

export const apiClient = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string, remember: boolean = true) {
    if (remember) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(REMEMBER_KEY, 'true');
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REMEMBER_KEY);
    }
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REMEMBER_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || data.message || `Error en la solicitud (${response.status})`;
      const err = new Error(errorMsg);
      (err as any).status = response.status;
      (err as any).data = data;
      throw err;
    }

    return data as T;
  },

  // Auth methods
  async login(email: string, password: string, rememberMe: boolean = true) {
    const data = await this.request<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
    });
    this.setToken(data.token, rememberMe);
    return data;
  },

  async registerPatient(formData: {
    firstName: string;
    lastName: string;
    ci: string;
    email: string;
    phone: string;
    birthDate?: string;
    gender?: 'Masculino' | 'Femenino' | 'Otro';
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
  }) {
    const data = await this.request<{ success: boolean; token: string; user: AuthUser; message: string }>(
      '/api/auth/register-patient',
      {
        method: 'POST',
        body: JSON.stringify(formData),
      }
    );
    this.setToken(data.token, true);
    return data;
  },

  async registerStaffRequest(formData: {
    type: 'MEDICO' | 'RECEPCIONISTA';
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    ci: string;
    specialtyId?: string;
    licenseNumber?: string;
    notes?: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
  }) {
    return this.request<{ success: boolean; message: string; requestId: string }>(
      '/api/auth/register-staff-request',
      {
        method: 'POST',
        body: JSON.stringify(formData),
      }
    );
  },

  async getMe() {
    return this.request<{ user: AuthUser }>('/api/auth/me');
  },

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      this.clearToken();
    }
  },

  async forgotPassword(email: string) {
    return this.request<{ success: boolean; message: string }>(
      '/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      }
    );
  },

  async resetPassword(token: string, newPassword: string, confirmPassword: string) {
    return this.request<{ success: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword, confirmPassword }),
    });
  },

  // Public Clinical Data
  async getPublicData() {
    return this.request<{
      specialties: Specialty[];
      services: ClinicalService[];
      doctors: Doctor[];
      schedules: DoctorSchedule[];
      absences: DoctorAbsence[];
    }>('/api/public/data');
  },

  // Admin Methods
  async getStaffRequests() {
    return this.request<{ requests: StaffRequestItem[] }>('/api/admin/staff-requests');
  },

  async approveStaffRequest(id: string) {
    return this.request<{ success: boolean; message: string; newUser: any }>(
      `/api/admin/staff-requests/${id}/approve`,
      { method: 'POST' }
    );
  },

  async rejectStaffRequest(id: string, reason?: string) {
    return this.request<{ success: boolean; message: string }>(
      `/api/admin/staff-requests/${id}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );
  },

  async getSystemStatus() {
    return this.request<SystemStatusResponse>('/api/admin/system-status');
  },

  // Appointments
  async bookAppointment(appointmentData: {
    specialtyId: string;
    doctorId: string;
    date: string;
    startTime: string;
    endTime: string;
    reason?: string;
    paymentMethod?: string;
  }) {
    return this.request<{ success: boolean; message: string; appointment: Appointment }>(
      '/api/appointments/book',
      {
        method: 'POST',
        body: JSON.stringify(appointmentData),
      }
    );
  },

  async getAppointments(patientId?: string) {
    const query = patientId ? `?patientId=${encodeURIComponent(patientId)}` : '';
    return this.request<{ appointments: Appointment[] }>(`/api/appointments${query}`);
  },

  async getPatientHistory(patientId: string) {
    return this.request<{ patient: Patient; appointments: Appointment[] }>(
      `/api/patients/${patientId}/history`
    );
  },

  async updateAppointmentStatus(
    id: string,
    newStatus: Appointment['status'],
    extra?: { cancellationReason?: string; clinicalNotes?: string; vitalSigns?: any }
  ) {
    return this.request<{ success: boolean; appointment: Appointment }>(
      `/api/appointments/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ newStatus, ...extra }),
      }
    );
  },

  async doctorEmergencyCancel(doctorId: string, date: string, reason?: string) {
    return this.request<{
      success: boolean;
      count: number;
      message: string;
      cancelledAppointments: Appointment[];
    }>('/api/appointments/doctor-emergency-cancel', {
      method: 'POST',
      body: JSON.stringify({ doctorId, date, reason }),
    });
  },

  async rescheduleAppointment(
    id: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string,
    newTimeSlot?: string
  ) {
    return this.request<{ success: boolean; message: string; appointment: Appointment }>(
      `/api/appointments/${id}/reschedule`,
      {
        method: 'PATCH',
        body: JSON.stringify({ newDate, newStartTime, newEndTime, newTimeSlot }),
      }
    );
  },

  // Doctor Absences and Vacations (CU12b)
  async getDoctorAbsences(doctorId?: string) {
    const query = doctorId ? `?doctorId=${encodeURIComponent(doctorId)}` : '';
    return this.request<{ absences: DoctorAbsence[] }>(`/api/doctor-absences${query}`);
  },

  async createDoctorAbsence(data: {
    doctorId: string;
    startDate: string;
    endDate: string;
    type: DoctorAbsence['type'];
    reason: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      absence: DoctorAbsence;
      affectedAppointmentsCount: number;
    }>('/api/doctor-absences', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteDoctorAbsence(id: string) {
    return this.request<{ success: boolean; message: string }>(
      `/api/doctor-absences/${id}`,
      {
        method: 'DELETE',
      }
    );
  },

  // Immutable Audit Log & Real-time Live Bitácora (RN04)
  async getAuditLogs() {
    return this.request<{ logs: AuditLogEntry[] }>('/api/audit-logs');
  },
};
