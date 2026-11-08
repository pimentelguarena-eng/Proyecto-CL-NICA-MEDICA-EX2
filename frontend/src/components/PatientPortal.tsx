import { useState } from 'react';
import { 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  Heart, 
  AlertTriangle, 
  Pill, 
  Shield, 
  Phone, 
  Mail, 
  MapPin, 
  Edit3, 
  Check, 
  X, 
  CalendarPlus,
  Ban,
  CheckCircle2,
  Stethoscope,
  Info
} from 'lucide-react';
import type { Patient, Appointment, Doctor, Specialty } from '../types/clinic.ts';

interface PatientPortalProps {
  currentPatient: Patient | null;
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onUpdatePatient: (updated: Patient) => void;
  appointments: Appointment[];
  doctors: Doctor[];
  specialties: Specialty[];
  onCancelAppointment: (appointmentId: string, reason: string) => void;
  onOpenBooking: () => void;
}

export default function PatientPortal({
  currentPatient,
  patients,
  onSelectPatient,
  onUpdatePatient,
  appointments,
  doctors,
  specialties,
  onCancelAppointment,
  onOpenBooking,
}: PatientPortalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [searchCi, setSearchCi] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'appointments'>('appointments');
  const [cancelModalAppt, setCancelModalAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Editable fields state
  const [editFormData, setEditFormData] = useState<Partial<Patient>>({});

  const activePatient = currentPatient || patients[0];

  const handleStartEdit = () => {
    setEditFormData({ ...activePatient });
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    if (activePatient && editFormData) {
      onUpdatePatient({
        ...activePatient,
        ...editFormData,
      } as Patient);
      setIsEditing(false);
    }
  };

  const handleSearchPatient = () => {
    const found = patients.find(p => p.ci.trim() === searchCi.trim());
    if (found) {
      onSelectPatient(found);
      setSearchCi('');
    } else {
      alert(`No se encontró ningún paciente con el CI "${searchCi}".`);
    }
  };

  // Filter patient's appointments
  const patientAppointments = appointments.filter(a => a.patientId === activePatient?.id);
  const upcomingAppointments = patientAppointments.filter(
    a => a.status === 'Programada' || a.status === 'Confirmada'
  );
  const pastOrCancelledAppointments = patientAppointments.filter(
    a => a.status === 'Atendida' || a.status === 'Cancelada' || a.status === 'Inasistencia'
  );

  return (
    <div className="py-10 bg-slate-50 min-h-[80vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-black text-2xl shadow-md">
              {activePatient?.firstName.charAt(0)}{activePatient?.lastName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">
                  {activePatient?.firstName} {activePatient?.lastName}
                </h1>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-mono">
                  {activePatient?.code}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                CI: <strong>{activePatient?.ci}</strong> • Fecha Nac: {activePatient?.birthDate} • Sexo: {activePatient?.gender}
              </p>
            </div>
          </div>

          {/* Quick CI switcher & Book action */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <input
                type="text"
                value={searchCi}
                onChange={(e) => setSearchCi(e.target.value)}
                placeholder="Buscar por CI..."
                className="w-32 sm:w-36 px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleSearchPatient}
                className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 cursor-pointer"
              >
                Cargar
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenBooking}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Pedir Nueva Cita</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'appointments'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Mis Citas Médicas</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Ficha Médica & Datos Personales</span>
          </button>
        </div>

        {/* Tab 1: Appointments List */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            
            {/* Upcoming Appointments */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-600" />
                  <h2 className="text-lg font-black text-slate-900">
                    Próximas Citas Programadas
                  </h2>
                </div>
                <span className="text-xs text-slate-500">
                  Recordatorios automáticos activos
                </span>
              </div>

              {upcomingAppointments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingAppointments.map((appt) => {
                    const doc = doctors.find(d => d.id === appt.doctorId);
                    const spec = specialties.find(s => s.id === appt.specialtyId);

                    return (
                      <div
                        key={appt.id}
                        className="p-5 rounded-2xl border-2 border-teal-100 bg-teal-50/30 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between pb-3 border-b border-teal-100">
                            <span className="text-xs font-mono font-bold text-teal-800">
                              {appt.code}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-200/60 text-teal-900">
                              {appt.status}
                            </span>
                          </div>

                          <div className="py-3 space-y-2">
                            <div>
                              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                                Especialidad
                              </span>
                              <strong className="text-sm text-slate-900 font-extrabold">
                                {spec?.name}
                              </strong>
                            </div>

                            <div>
                              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                                Médico Asignado
                              </span>
                              <span className="text-xs text-slate-800 font-semibold block">
                                {doc?.fullName} ({doc?.roomNumber || 'Consultorio'})
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                              <div>
                                <span className="text-[11px] text-slate-400 block">Fecha:</span>
                                <strong className="text-slate-800">{appt.date}</strong>
                              </div>
                              <div>
                                <span className="text-[11px] text-slate-400 block">Horario:</span>
                                <strong className="text-teal-700">{appt.timeSlot}</strong>
                              </div>
                            </div>

                            {appt.reason && (
                              <p className="text-xs text-slate-500 pt-1 italic">
                                &quot;{appt.reason}&quot;
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-teal-100/60 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">
                            Presentarse 10 min antes
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setCancelModalAppt(appt);
                              setCancelReason('');
                            }}
                            className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Cancelar Cita</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-sm font-bold text-slate-700">No tienes citas médicas pendientes.</p>
                  <p className="text-xs text-slate-500 mt-1">Puedes agendar una consulta médica ambulatoria en cualquier momento.</p>
                  <button
                    type="button"
                    onClick={onOpenBooking}
                    className="mt-4 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700"
                  >
                    Agendar Cita Ahora
                  </button>
                </div>
              )}
            </div>

            {/* Historical and Attended Appointments */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-slate-600" />
                <h2 className="text-lg font-black text-slate-900">
                  Historial de Citas Pasadas y Atendidas
                </h2>
              </div>

              {pastOrCancelledAppointments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Código</th>
                        <th className="py-3 px-4">Fecha y Hora</th>
                        <th className="py-3 px-4">Especialidad</th>
                        <th className="py-3 px-4">Médico</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4">Observaciones / Notas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pastOrCancelledAppointments.map((appt) => {
                        const doc = doctors.find(d => d.id === appt.doctorId);
                        const spec = specialties.find(s => s.id === appt.specialtyId);

                        return (
                          <tr key={appt.id} className="hover:bg-slate-50/60">
                            <td className="py-3 px-4 font-mono font-bold text-teal-800">
                              {appt.code}
                            </td>
                            <td className="py-3 px-4">
                              <strong>{appt.date}</strong>
                              <span className="block text-[11px] text-slate-500">{appt.timeSlot}</span>
                            </td>
                            <td className="py-3 px-4 font-semibold">{spec?.name}</td>
                            <td className="py-3 px-4">{doc?.fullName}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  appt.status === 'Atendida'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : appt.status === 'Cancelada'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {appt.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 max-w-xs">
                              {appt.clinicalNotes ? (
                                <span className="text-slate-800 font-medium">{appt.clinicalNotes}</span>
                              ) : appt.cancellationReason ? (
                                <span className="text-rose-700 italic">Motivo de cancelación: {appt.cancellationReason}</span>
                              ) : (
                                <span className="text-slate-400">Sin notas adicionales</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  No hay registros en el historial médico anterior.
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab 2: Patient Medical Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Perfil Clínico del Paciente
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Información personal, antecedentes médicos y contacto de emergencia protegidos
                </p>
              </div>

              <div>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Guardar Cambios</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Edit3 className="w-4 h-4 text-slate-600" />
                    <span>Editar Información</span>
                  </button>
                )}
              </div>
            </div>

            {/* Grid with 4 Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Section 1: Datos personales */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-teal-800 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  1. Datos Personales
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block font-semibold">Nombres:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editFormData.firstName || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-white"
                      />
                    ) : (
                      <span className="font-bold text-slate-900">{activePatient?.firstName}</span>
                    )}
                  </div>

                  <div>
                    <label className="text-slate-400 block font-semibold">Apellidos:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editFormData.lastName || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-white"
                      />
                    ) : (
                      <span className="font-bold text-slate-900">{activePatient?.lastName}</span>
                    )}
                  </div>

                  <div>
                    <label className="text-slate-400 block font-semibold">Documento de Identidad (CI):</label>
                    <span className="font-bold font-mono text-slate-900">{activePatient?.ci}</span>
                    <span className="text-[10px] text-slate-400 block">Identificador único</span>
                  </div>

                  <div>
                    <label className="text-slate-400 block font-semibold">Sexo:</label>
                    {isEditing ? (
                      <select
                        value={editFormData.gender || 'Femenino'}
                        onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as any })}
                        className="w-full p-2 border rounded-lg bg-white text-xs"
                      >
                        <option value="Femenino">Femenino</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Otro">Otro</option>
                      </select>
                    ) : (
                      <span className="font-bold text-slate-900">{activePatient?.gender}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Contacto */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-teal-800 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  2. Contacto y Domicilio
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block font-semibold">Teléfono de Contacto:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editFormData.phone || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-white"
                      />
                    ) : (
                      <span className="font-bold text-slate-900">{activePatient?.phone}</span>
                    )}
                  </div>

                  <div>
                    <label className="text-slate-400 block font-semibold">Correo Electrónico:</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editFormData.email || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-white"
                      />
                    ) : (
                      <span className="text-slate-900">{activePatient?.email || 'No registrado'}</span>
                    )}
                  </div>

                  <div>
                    <label className="text-slate-400 block font-semibold">Dirección de Domicilio:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editFormData.address || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-white"
                      />
                    ) : (
                      <span className="text-slate-900">{activePatient?.address || 'No registrado'}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Información Médica */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-teal-800 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-600" />
                  3. Información Médica Relevante
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block font-semibold">Tipo de Sangre:</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.bloodType || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, bloodType: e.target.value })}
                          className="w-full p-2 border rounded-lg bg-white font-bold"
                        />
                      ) : (
                        <span className="font-bold text-slate-900">{activePatient?.bloodType || 'Por determinar'}</span>
                      )}
                    </div>

                    <div>
                      <label className="text-slate-400 block font-semibold text-rose-600">Alergias Conocidas:</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.allergies || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, allergies: e.target.value })}
                          className="w-full p-2 border rounded-lg bg-white"
                        />
                      ) : (
                        <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 block">
                          {activePatient?.allergies || 'Ninguna'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block font-semibold">Enfermedades Crónicas:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editFormData.chronicDiseases || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, chronicDiseases: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-white"
                      />
                    ) : (
                      <span className="text-slate-800">{activePatient?.chronicDiseases || 'Ninguna reportada'}</span>
                    )}
                  </div>

                  <div>
                    <label className="text-slate-400 block font-semibold">Medicamentos Habituales:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editFormData.currentMedications || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, currentMedications: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-white"
                      />
                    ) : (
                      <span className="text-slate-800">{activePatient?.currentMedications || 'Sin medicación continua'}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 4: Contacto de Emergencia */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-teal-800 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  4. Contacto de Emergencia
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block font-semibold">Nombre del Contacto:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editFormData.emergencyContactName || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, emergencyContactName: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-white"
                      />
                    ) : (
                      <span className="font-bold text-slate-900">{activePatient?.emergencyContactName || 'No registrado'}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block font-semibold">Parentesco:</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.emergencyContactRelationship || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, emergencyContactRelationship: e.target.value })}
                          className="w-full p-2 border rounded-lg bg-white"
                        />
                      ) : (
                        <span className="text-slate-800">{activePatient?.emergencyContactRelationship || 'Familiar'}</span>
                      )}
                    </div>

                    <div>
                      <label className="text-slate-400 block font-semibold">Teléfono de Emergencia:</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.emergencyContactPhone || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, emergencyContactPhone: e.target.value })}
                          className="w-full p-2 border rounded-lg bg-white"
                        />
                      ) : (
                        <span className="font-bold text-slate-900">{activePatient?.emergencyContactPhone || 'No registrado'}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Cancel Appointment Modal */}
      {cancelModalAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-50">
                <Ban className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Cancelar Cita Médica</h3>
                <span className="text-xs font-mono text-slate-500">{cancelModalAppt.code}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Según las reglas del sistema (RN09), la cancelación liberará el horario para otros pacientes y se conservará el registro en el historial clínico.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Motivo de Cancelación *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Indica el motivo de la cancelación..."
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
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
                  onCancelAppointment(cancelModalAppt.id, cancelReason);
                  setCancelModalAppt(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
