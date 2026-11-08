import { useState } from 'react';
import { 
  UserPlus, 
  Search, 
  Clock, 
  Calendar, 
  Check, 
  AlertCircle, 
  Edit3, 
  Power, 
  Plus, 
  Trash2,
  Stethoscope,
  Building2
} from 'lucide-react';
import type { Doctor, Specialty, DoctorSchedule } from '../../types/clinic.ts';

interface DoctorManagementViewProps {
  doctors: Doctor[];
  specialties: Specialty[];
  schedules: DoctorSchedule[];
  onAddDoctor: (doctor: Doctor) => void;
  onUpdateDoctor: (doctor: Doctor) => void;
  onToggleDoctorStatus: (doctorId: string) => void;
  onAddSchedule: (schedule: DoctorSchedule) => { success: boolean; error?: string };
  onDeleteSchedule: (scheduleId: string) => void;
}

export default function DoctorManagementView({
  doctors,
  specialties,
  schedules,
  onAddDoctor,
  onUpdateDoctor,
  onToggleDoctorStatus,
  onAddSchedule,
  onDeleteSchedule,
}: DoctorManagementViewProps) {
  const [filterText, setFilterText] = useState('');
  const [selectedDoctorForSchedule, setSelectedDoctorForSchedule] = useState<Doctor | null>(null);

  // New Doctor Modal
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [docLicense, setDocLicense] = useState('');
  const [docFullName, setDocFullName] = useState('');
  const [docPhone, setDocPhone] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docRoom, setDocRoom] = useState('Consultorio 106');
  const [docSpecialtyIds, setDocSpecialtyIds] = useState<string[]>([specialties[0]?.id || '']);
  const [docFormError, setDocFormError] = useState<string | null>(null);

  // New Schedule form inside modal
  const [newSchedDay, setNewSchedDay] = useState<DoctorSchedule['dayOfWeek']>('Lunes');
  const [newSchedStart, setNewSchedStart] = useState('08:00');
  const [newSchedEnd, setNewSchedEnd] = useState('12:00');
  const [newSchedDuration, setNewSchedDuration] = useState(15);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const filteredDoctors = doctors.filter(doc => {
    const term = filterText.toLowerCase();
    const docSpecs = specialties.filter(s => doc.specialtyIds.includes(s.id));
    return (
      doc.fullName.toLowerCase().includes(term) ||
      doc.code.toLowerCase().includes(term) ||
      doc.licenseNumber.toLowerCase().includes(term) ||
      docSpecs.some(s => s.name.toLowerCase().includes(term))
    );
  });

  const handleSaveDoctor = () => {
    setDocFormError(null);
    if (!docFullName.trim()) {
      setDocFormError('El nombre completo del médico es obligatorio.');
      return;
    }
    if (!docLicense.trim()) {
      setDocFormError('El número de registro profesional es obligatorio.');
      return;
    }
    if (docSpecialtyIds.length === 0) {
      setDocFormError('Seleccione al menos una especialidad.');
      return;
    }

    const nextCode = `MED-${(doctors.length + 1).toString().padStart(3, '0')}`;
    const newDoc: Doctor = {
      id: `doc-${Date.now()}`,
      code: nextCode,
      licenseNumber: docLicense.trim(),
      fullName: docFullName.trim(),
      phone: docPhone.trim() || '70000000',
      email: docEmail.trim() || 'medico@clinicamedical.com',
      roomNumber: docRoom.trim() || 'Consultorio',
      specialtyIds: docSpecialtyIds,
      isActive: true,
    };

    onAddDoctor(newDoc);
    setShowNewDocModal(false);
    setDocFullName('');
    setDocLicense('');
  };

  const handleCreateSchedule = () => {
    if (!selectedDoctorForSchedule) return;
    setScheduleError(null);

    const [sh, sm] = newSchedStart.split(':').map(Number);
    const [eh, em] = newSchedEnd.split(':').map(Number);
    if (sh * 60 + sm >= eh * 60 + em) {
      setScheduleError('La hora final debe ser posterior a la hora inicial (RF05).');
      return;
    }

    const newSched: DoctorSchedule = {
      id: `sch-${Date.now()}`,
      doctorId: selectedDoctorForSchedule.id,
      dayOfWeek: newSchedDay,
      startTime: newSchedStart,
      endTime: newSchedEnd,
      slotDurationMinutes: newSchedDuration,
    };

    const res = onAddSchedule(newSched);
    if (!res.success) {
      setScheduleError(res.error || 'Error al agregar horario.');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
      
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-600" />
            <h2 className="text-xl font-black text-slate-900">
              Gestión de Médicos y Horarios de Atención
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Administración del cuerpo médico, asignación de especialidades y configuración de turnos
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Buscar médico o especialidad..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowNewDocModal(true)}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Médico</span>
          </button>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Código / Reg.</th>
              <th className="py-3 px-4">Médico</th>
              <th className="py-3 px-4">Especialidades</th>
              <th className="py-3 px-4">Horarios Asignados</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDoctors.map((doc) => {
              const docSpecs = specialties.filter(s => doc.specialtyIds.includes(s.id));
              const docSchedules = schedules.filter(s => s.doctorId === doc.id);

              return (
                <tr key={doc.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-teal-800 block text-xs">
                      {doc.code}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {doc.licenseNumber}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <strong className="text-slate-900 block font-bold text-sm">
                      {doc.fullName}
                    </strong>
                    <span className="text-slate-500 text-[11px] block">
                      {doc.roomNumber || 'Consultorio'} • Tel: {doc.phone}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="flex flex-wrap gap-1">
                      {docSpecs.map(s => (
                        <span key={s.id} className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {docSchedules.length > 0 ? (
                      <div className="space-y-1">
                        {docSchedules.slice(0, 2).map(s => (
                          <span key={s.id} className="block text-[11px] text-slate-600 font-medium">
                            <strong>{s.dayOfWeek}:</strong> {s.startTime}-{s.endTime} ({s.slotDurationMinutes}m)
                          </span>
                        ))}
                        {docSchedules.length > 2 && (
                          <span className="text-[10px] text-teal-700 font-bold block">
                            +{docSchedules.length - 2} turnos más
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Sin horario definido</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        doc.isActive
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {doc.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDoctorForSchedule(doc)}
                      className="px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold text-xs border border-teal-200 cursor-pointer"
                      title="Configurar turnos y horarios de atención"
                    >
                      Gestionar Horarios
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleDoctorStatus(doc.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        doc.isActive
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                      title="RN04, RN11: Activar o desactivar médico sin perder citas históricas"
                    >
                      {doc.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* New Doctor Modal */}
      {showNewDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Registrar Nuevo Médico (RF03)</h3>
                <p className="text-xs text-slate-500">Número de registro profesional y especialidades</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewDocModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            {docFormError && (
              <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{docFormError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Nombres y Apellidos *
                </label>
                <input
                  type="text"
                  value={docFullName}
                  onChange={(e) => setDocFullName(e.target.value)}
                  placeholder="Ej. Dr. Mario Morales Céspedes"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Registro Profesional (MP) *
                  </label>
                  <input
                    type="text"
                    value={docLicense}
                    onChange={(e) => setDocLicense(e.target.value)}
                    placeholder="MP-10492-BOL"
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Consultorio Asignado
                  </label>
                  <input
                    type="text"
                    value={docRoom}
                    onChange={(e) => setDocRoom(e.target.value)}
                    placeholder="Consultorio 209"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={docPhone}
                    onChange={(e) => setDocPhone(e.target.value)}
                    placeholder="77001122"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={docEmail}
                    onChange={(e) => setDocEmail(e.target.value)}
                    placeholder="mario.morales@clinicamedical.com"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Especialidad Principal *
                </label>
                <select
                  value={docSpecialtyIds[0] || ''}
                  onChange={(e) => setDocSpecialtyIds([e.target.value])}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold"
                >
                  {specialties.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewDocModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveDoctor}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer"
              >
                Guardar Médico
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Schedules Modal (RF05) */}
      {selectedDoctorForSchedule && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-lg">
                  Horarios de Atención: {selectedDoctorForSchedule.fullName}
                </h3>
                <p className="text-xs text-slate-500">
                  Bloques de atención médica de 15 minutos sin superposición de turnos
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoctorForSchedule(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            {/* List current schedules */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Turnos de Disponibilidad Configurados
              </h4>
              <div className="space-y-2">
                {schedules.filter(s => s.doctorId === selectedDoctorForSchedule.id).map(sched => (
                  <div key={sched.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-teal-900 font-bold text-sm">{sched.dayOfWeek}</strong>
                      <span className="text-slate-600 ml-3 font-semibold">
                        {sched.startTime} a {sched.endTime} ({sched.slotDurationMinutes} min por cita)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteSchedule(sched.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                      title="Eliminar este turno"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add new schedule form */}
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 space-y-3">
              <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-teal-700" />
                Agregar Nuevo Horario de Atención
              </h4>

              {scheduleError && (
                <div className="p-2.5 rounded-lg bg-rose-50 text-rose-800 text-xs">
                  {scheduleError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Día</label>
                  <select
                    value={newSchedDay}
                    onChange={(e) => setNewSchedDay(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Lunes">Lunes</option>
                    <option value="Martes">Martes</option>
                    <option value="Miércoles">Miércoles</option>
                    <option value="Jueves">Jueves</option>
                    <option value="Viernes">Viernes</option>
                    <option value="Sábado">Sábado</option>
                    <option value="Domingo">Domingo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    value={newSchedStart}
                    onChange={(e) => setNewSchedStart(e.target.value)}
                    className="w-full p-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hora Fin</label>
                  <input
                    type="time"
                    value={newSchedEnd}
                    onChange={(e) => setNewSchedEnd(e.target.value)}
                    className="w-full p-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleCreateSchedule}
                    className="w-full py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer"
                  >
                    Guardar Turno
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDoctorForSchedule(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
