import { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Filter, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Ban, 
  Clock, 
  Stethoscope,
  TrendingUp
} from 'lucide-react';
import type { Appointment, Doctor, Patient, Specialty } from '../../types/clinic.ts';

interface ReportsViewProps {
  appointments: Appointment[];
  patients: Patient[];
  doctors: Doctor[];
  specialties: Specialty[];
}

export default function ReportsView({
  appointments,
  patients,
  doctors,
  specialties,
}: ReportsViewProps) {
  const [reportType, setReportType] = useState<
    'general' | 'by-specialty' | 'by-doctor' | 'by-status' | 'patients'
  >('general');

  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-11-30');

  // Filter appointments by date range
  const filteredAppointments = appointments.filter(a => {
    return a.date >= startDate && a.date <= endDate;
  });

  // KPI Metrics
  const totalAppointments = filteredAppointments.length;
  const attendedCount = filteredAppointments.filter(a => a.status === 'Atendida').length;
  const confirmedCount = filteredAppointments.filter(a => a.status === 'Confirmada').length;
  const scheduledCount = filteredAppointments.filter(a => a.status === 'Programada').length;
  const cancelledCount = filteredAppointments.filter(a => a.status === 'Cancelada').length;
  const absentCount = filteredAppointments.filter(a => a.status === 'Inasistencia').length;

  // Breakdown by Specialty
  const specialtyBreakdown = specialties.map(spec => {
    const appts = filteredAppointments.filter(a => a.specialtyId === spec.id);
    return {
      name: spec.name,
      category: spec.category,
      total: appts.length,
      attended: appts.filter(a => a.status === 'Atendida').length,
      cancelled: appts.filter(a => a.status === 'Cancelada').length,
    };
  }).filter(item => item.total > 0 || reportType === 'by-specialty');

  // Breakdown by Doctor
  const doctorBreakdown = doctors.map(doc => {
    const appts = filteredAppointments.filter(a => a.doctorId === doc.id);
    return {
      code: doc.code,
      name: doc.fullName,
      license: doc.licenseNumber,
      total: appts.length,
      attended: appts.filter(a => a.status === 'Atendida').length,
      cancelled: appts.filter(a => a.status === 'Cancelada').length,
      pending: appts.filter(a => a.status === 'Programada' || a.status === 'Confirmada').length,
    };
  }).filter(item => item.total > 0 || reportType === 'by-doctor');

  // Export to CSV functionality (RF13 Mejora opcional)
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `reporte_clinica_medical_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (reportType === 'general' || reportType === 'by-status') {
      headers = ['Codigo Cita', 'Fecha', 'Horario', 'Paciente', 'CI Paciente', 'Especialidad', 'Medico', 'Estado', 'Motivo'];
      rows = filteredAppointments.map(a => {
        const p = patients.find(pat => pat.id === a.patientId);
        const d = doctors.find(doc => doc.id === a.doctorId);
        const s = specialties.find(sp => sp.id === a.specialtyId);
        return [
          a.code,
          a.date,
          a.timeSlot,
          p ? `${p.firstName} ${p.lastName}` : '',
          p ? p.ci : '',
          s ? s.name : '',
          d ? d.fullName : '',
          a.status,
          `"${(a.reason || '').replace(/"/g, '""')}"`,
        ];
      });
    } else if (reportType === 'by-specialty') {
      headers = ['Especialidad', 'Categoria', 'Total Citas', 'Atendidas', 'Canceladas'];
      rows = specialtyBreakdown.map(sb => [sb.name, sb.category, sb.total, sb.attended, sb.cancelled]);
    } else if (reportType === 'by-doctor') {
      headers = ['Codigo Medico', 'Nombre', 'Registro Profesional', 'Total Citas', 'Atendidas', 'Pendientes', 'Canceladas'];
      rows = doctorBreakdown.map(db => [db.code, db.name, db.license, db.total, db.attended, db.pending, db.cancelled]);
    } else if (reportType === 'patients') {
      headers = ['Codigo Paciente', 'CI', 'Nombres', 'Apellidos', 'Telefono', 'Fecha Nacimiento', 'Sexo', 'Alergias', 'Estado'];
      rows = patients.map(p => [
        p.code,
        p.ci,
        p.firstName,
        p.lastName,
        p.phone,
        p.birthDate,
        p.gender,
        `"${(p.allergies || '').replace(/"/g, '""')}"`,
        p.isActive ? 'Activo' : 'Inactivo',
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            <h2 className="text-xl font-black text-slate-900">
              Reportes Administrativos y Estadísticas
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Métricas de atención, citas por fecha, médico, especialidad y exportación de datos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-bold border border-teal-200 flex items-center gap-1.5 cursor-pointer"
            title="Exportar a archivo CSV (RF13 mejora opcional)"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Date Filter & Report Category Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
        <div>
          <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
            Tipo de Reporte:
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="w-full p-2 rounded-xl border border-slate-200 bg-white font-bold"
          >
            <option value="general">Citas Generales en Período</option>
            <option value="by-specialty">Citas por Especialidad</option>
            <option value="by-doctor">Agenda y Citas por Médico</option>
            <option value="by-status">Citas por Estado (Atendidas/Canceladas)</option>
            <option value="patients">Padrón de Pacientes Registrados</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
            Fecha Inicio:
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-1.5 rounded-xl border border-slate-200 bg-white font-semibold"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
            Fecha Fin:
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-1.5 rounded-xl border border-slate-200 bg-white font-semibold"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Citas</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{totalAppointments}</span>
          <span className="text-[10px] text-slate-500">En el período</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
          <span className="text-emerald-700 text-[10px] font-bold uppercase tracking-wider block">Atendidas</span>
          <span className="text-2xl font-black text-emerald-800 mt-1 block">{attendedCount}</span>
          <span className="text-[10px] text-emerald-700">Completadas</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
          <span className="text-amber-700 text-[10px] font-bold uppercase tracking-wider block">Confirmadas</span>
          <span className="text-2xl font-black text-amber-800 mt-1 block">{confirmedCount}</span>
          <span className="text-[10px] text-amber-700">Por asistir</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
          <span className="text-blue-700 text-[10px] font-bold uppercase tracking-wider block">Programadas</span>
          <span className="text-2xl font-black text-blue-800 mt-1 block">{scheduledCount}</span>
          <span className="text-[10px] text-blue-700">En agenda</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
          <span className="text-rose-700 text-[10px] font-bold uppercase tracking-wider block">Canceladas</span>
          <span className="text-2xl font-black text-rose-800 mt-1 block">{cancelledCount}</span>
          <span className="text-[10px] text-rose-600">Cupo liberado</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200">
          <span className="text-purple-700 text-[10px] font-bold uppercase tracking-wider block">Pacientes</span>
          <span className="text-2xl font-black text-purple-900 mt-1 block">{patients.length}</span>
          <span className="text-[10px] text-purple-700">Registrados</span>
        </div>
      </div>

      {/* Dynamic Report Table */}
      <div className="overflow-x-auto">
        {reportType === 'by-specialty' ? (
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Especialidad</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-center">Total Citas</th>
                <th className="py-3 px-4 text-center">Atendidas</th>
                <th className="py-3 px-4 text-center">Canceladas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {specialtyBreakdown.map((sb, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-teal-900">{sb.name}</td>
                  <td className="py-3 px-4 text-slate-500">{sb.category}</td>
                  <td className="py-3 px-4 text-center font-bold">{sb.total}</td>
                  <td className="py-3 px-4 text-center text-emerald-700 font-bold">{sb.attended}</td>
                  <td className="py-3 px-4 text-center text-rose-700">{sb.cancelled}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : reportType === 'by-doctor' ? (
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Código / Reg.</th>
                <th className="py-3 px-4">Médico</th>
                <th className="py-3 px-4 text-center">Total Citas</th>
                <th className="py-3 px-4 text-center">Atendidas</th>
                <th className="py-3 px-4 text-center">Pendientes</th>
                <th className="py-3 px-4 text-center">Canceladas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doctorBreakdown.map((db, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-teal-800">{db.code}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{db.name}</td>
                  <td className="py-3 px-4 text-center font-bold">{db.total}</td>
                  <td className="py-3 px-4 text-center text-emerald-700 font-bold">{db.attended}</td>
                  <td className="py-3 px-4 text-center text-blue-700 font-bold">{db.pending}</td>
                  <td className="py-3 px-4 text-center text-rose-700">{db.cancelled}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : reportType === 'patients' ? (
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">CI</th>
                <th className="py-3 px-4">Nombre Completo</th>
                <th className="py-3 px-4">Teléfono</th>
                <th className="py-3 px-4">Tipo Sangre</th>
                <th className="py-3 px-4">Alergias</th>
                <th className="py-3 px-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-teal-800">{p.code}</td>
                  <td className="py-3 px-4 font-bold">{p.ci}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{p.firstName} {p.lastName}</td>
                  <td className="py-3 px-4">{p.phone}</td>
                  <td className="py-3 px-4 font-semibold">{p.bloodType || 'N/A'}</td>
                  <td className="py-3 px-4 text-rose-700 font-medium">{p.allergies || 'Ninguna'}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {p.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Paciente</th>
                <th className="py-3 px-4">Especialidad</th>
                <th className="py-3 px-4">Médico</th>
                <th className="py-3 px-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.map((appt) => {
                const pat = patients.find(p => p.id === appt.patientId);
                const doc = doctors.find(d => d.id === appt.doctorId);
                const sp = specialties.find(s => s.id === appt.specialtyId);

                return (
                  <tr key={appt.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-teal-800">{appt.code}</td>
                    <td className="py-3 px-4">
                      <strong>{appt.date}</strong>
                      <span className="block text-[11px] text-slate-500">{appt.timeSlot}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {pat ? `${pat.firstName} ${pat.lastName}` : 'Paciente'}
                    </td>
                    <td className="py-3 px-4">{sp?.name}</td>
                    <td className="py-3 px-4">{doc?.fullName}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
