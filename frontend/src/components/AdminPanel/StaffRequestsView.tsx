import { useState } from 'react';
import {
  FileBadge,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Stethoscope,
  Building2,
  ShieldCheck,
  Search,
  Filter,
  UserCheck,
  Calendar,
  Phone,
  Mail,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { apiClient, type StaffRequestItem } from '../../utils/apiClient.ts';
import type { Specialty } from '../../types/clinic.ts';

interface StaffRequestsViewProps {
  requests: StaffRequestItem[];
  specialties: Specialty[];
  onRequestsUpdated: () => void;
}

export default function StaffRequestsView({
  requests,
  specialties,
  onRequestsUpdated,
}: StaffRequestsViewProps) {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequestForAction, setSelectedRequestForAction] = useState<StaffRequestItem | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const getSpecialtyName = (id?: string) => {
    if (!id) return 'No especificada';
    return specialties.find(s => s.id === id)?.name || id;
  };

  const filteredRequests = requests.filter(r => {
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      r.fullName.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term) ||
      r.ci.includes(term) ||
      (r.licenseNumber && r.licenseNumber.toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  });

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  const handleConfirmAction = async () => {
    if (!selectedRequestForAction || !actionType) return;
    setLoading(true);
    setFeedback(null);

    try {
      if (actionType === 'APPROVE') {
        const res = await apiClient.approveStaffRequest(selectedRequestForAction.id);
        setFeedback({ type: 'success', message: res.message });
      } else {
        const res = await apiClient.rejectStaffRequest(
          selectedRequestForAction.id,
          rejectionReason || 'No cumple con las credenciales requeridas.'
        );
        setFeedback({ type: 'success', message: res.message });
      }

      setSelectedRequestForAction(null);
      setActionType(null);
      setRejectionReason('');
      onRequestsUpdated();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error al procesar la solicitud' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Invariant Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <FileBadge className="w-5 h-5 text-teal-600" />
            <h2 className="text-xl font-black text-slate-900">
              Solicitudes de Registro Profesional
            </h2>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs">
                {pendingCount} pendientes
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Revisión, acreditación y aprobación de cuentas para Médicos Especialistas y Recepcionistas.
          </p>
        </div>
      </div>

      {/* Single Admin Guarantee Banner */}
      <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 text-teal-950 text-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="block font-bold">Garantía de Administrador Único Activo:</strong>
          <p className="text-teal-900/90 leading-relaxed">
            Por política de seguridad y restricción estricta de base de datos, Clínica Medical opera con un solo Administrador de Sistemas activo. Las solicitudes públicas únicamente admiten postulaciones para <strong>Médicos</strong> o <strong>Recepcionistas</strong>.
          </p>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterStatus('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === 'PENDING'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pendientes ({requests.filter(r => r.status === 'PENDING').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('APPROVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === 'APPROVED'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Aprobadas ({requests.filter(r => r.status === 'APPROVED').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('REJECTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === 'REJECTED'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rechazadas ({requests.filter(r => r.status === 'REJECTED').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas ({requests.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, CI, matrícula..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:border-teal-600 outline-hidden"
          />
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((req) => (
            <div
              key={req.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-teal-200 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      req.type === 'MEDICO'
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {req.type === 'MEDICO' ? (
                      <Stethoscope className="w-3.5 h-3.5" />
                    ) : (
                      <Building2 className="w-3.5 h-3.5" />
                    )}
                    {req.type === 'MEDICO' ? 'Médico Especialista' : 'Recepcionista'}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      req.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : req.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {req.status === 'PENDING' && 'Pendiente de Aprobación'}
                    {req.status === 'APPROVED' && 'Aprobada & Activa'}
                    {req.status === 'REJECTED' && 'Rechazada'}
                  </span>

                  <span className="text-[11px] text-slate-400 font-mono">
                    Ref: {req.id} • {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-black text-slate-900">{req.fullName}</h4>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {req.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {req.phone}
                    </span>
                    <span className="font-semibold text-slate-700">
                      CI: {req.ci}
                    </span>
                  </div>
                </div>

                {/* Medical specific details */}
                {req.type === 'MEDICO' && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>
                      Especialidad postulada: <strong>{getSpecialtyName(req.specialtyId)}</strong>
                    </span>
                    <span>
                      Matrícula Profesional: <strong className="font-mono text-teal-800">{req.licenseNumber || 'N/A'}</strong>
                    </span>
                  </div>
                )}

                {req.notes && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                    "{req.notes}"
                  </p>
                )}

                {req.status === 'APPROVED' && req.reviewedBy && (
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Aprobado por: {req.reviewedBy} el {new Date(req.reviewedAt!).toLocaleString()}
                  </p>
                )}

                {req.status === 'REJECTED' && (
                  <p className="text-[11px] text-rose-700 font-medium">
                    Rechazado el {new Date(req.reviewedAt!).toLocaleString()} • Motivo: {req.rejectionReason}
                  </p>
                )}
              </div>

              {/* Action buttons (only if PENDING) */}
              {req.status === 'PENDING' && (
                <div className="flex sm:flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRequestForAction(req);
                      setActionType('APPROVE');
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aprobar Solicitud</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRequestForAction(req);
                      setActionType('REJECT');
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Rechazar</span>
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-2">
            <FileBadge className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No se encontraron solicitudes</h4>
            <p className="text-xs text-slate-400">
              No hay solicitudes de registro que coincidan con los filtros aplicados.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Approval / Rejection */}
      {selectedRequestForAction && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-2">
              {actionType === 'APPROVE' ? (
                <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
              ) : (
                <span className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                  <XCircle className="w-5 h-5" />
                </span>
              )}
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {actionType === 'APPROVE' ? 'Aprobar y Activar Cuenta' : 'Rechazar Solicitud de Registro'}
                </h3>
                <span className="text-xs text-slate-500">{selectedRequestForAction.fullName}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {actionType === 'APPROVE' ? (
                <>
                  ¿Confirma la acreditación y activación de esta cuenta como{' '}
                  <strong>{selectedRequestForAction.type === 'MEDICO' ? 'Médico Especialista' : 'Recepcionista'}</strong>?
                  {selectedRequestForAction.type === 'MEDICO' && (
                    <span className="block mt-1 text-teal-800 font-semibold">
                      Se registrará en el catálogo médico y se le asignará un consultorio y turnos ambulatorios.
                    </span>
                  )}
                </>
              ) : (
                <>
                  Indique el motivo por el cual se rechaza la solicitud de registro profesional:
                </>
              )}
            </p>

            {actionType === 'REJECT' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Motivo de Rechazo *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ej. Matrícula profesional no acreditada en el Colegio Médico departamental..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-teal-600 outline-hidden"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRequestForAction(null);
                  setActionType(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmAction}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-xs cursor-pointer ${
                  actionType === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {loading ? 'Procesando...' : actionType === 'APPROVE' ? 'Confirmar Aprobación' : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
