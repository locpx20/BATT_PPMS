import React, { useState } from 'react';
import { Plus, CheckCircle2, RotateCcw, XCircle, FileText, Image as ImageIcon, X } from 'lucide-react';
import { User, ShiftReport, ProductionStage, PlanShift, STAGE_NAMES, SHIFT_NAMES } from '../../types';
import { db } from '../../services/db';
import { Permissions } from '../../services/rbac';
import { StatusBadge } from '../common/StatusBadge';
import { DecisionButtons } from '../common/DecisionButtons';
import { ReasonModal } from '../common/ReasonModal';
import { EvidenceUpload } from '../common/EvidenceUpload';
import { showToast } from '../common/Toast';

interface ShiftReportViewProps {
  currentUser: User;
}

export const ShiftReportView: React.FC<ShiftReportViewProps> = ({ currentUser }) => {
  const snapshot = db.getSnapshot();
  const reports = snapshot.shiftReports;
  const plans = snapshot.productionPlans;
  const machines = snapshot.machines;

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id || '');
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState<PlanShift>('CA_1');
  const [stage, setStage] = useState<ProductionStage>('PACKAGING');
  const [machineId, setMachineId] = useState(machines[0]?.id || '');
  const [actualMaterialUsedKg, setActualMaterialUsedKg] = useState<number>(22000);
  const [actualOutputKg, setActualOutputKg] = useState<number>(20000);
  const [hasIncident, setHasIncident] = useState(false);
  const [incidentDescription, setIncidentDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Reason modal for Return / Reject
  const [reasonModal, setReasonModal] = useState<{
    isOpen: boolean;
    actionType: 'RETURN' | 'REJECT';
    targetId: string;
    entityCode: string;
  }>({
    isOpen: false,
    actionType: 'RETURN',
    targetId: '',
    entityCode: '',
  });

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (actualOutputKg <= 0 || actualMaterialUsedKg <= 0) {
      setFormError('Sản lượng và NVL thực dùng phải lớn hơn 0');
      return;
    }

    const res = db.submitShiftReport({
      planId: selectedPlanId,
      productionDate,
      shift,
      stage,
      machineId,
      actualMaterialUsedKg,
      actualOutputKg,
      hasIncident,
      incidentDescription,
      imageUrl,
      notes,
      user: currentUser,
    });

    if (res.success) {
      showToast('success', 'Nộp báo cáo thành công', 'Báo cáo ca đã được gửi cho Quản lý phê duyệt');
      setShowSubmitModal(false);
    } else {
      setFormError(res.error || 'Lỗi khi nộp báo cáo ca');
    }
  };

  const handleApprove = (r: ShiftReport) => {
    const res = db.decideShiftReportApproval({
      reportId: r.id,
      decision: 'APPROVE',
      user: currentUser,
    });
    if (res.success) {
      showToast('success', 'Đã phê duyệt báo cáo', `Đã tạo lô hàng mới chờ kiểm tra KCS`);
    } else {
      showToast('error', 'Lỗi', res.error);
    }
  };

  const handleSubmitReason = (reason: string) => {
    const res = db.decideShiftReportApproval({
      reportId: reasonModal.targetId,
      decision: reasonModal.actionType,
      reason,
      user: currentUser,
    });

    if (res.success) {
      showToast(
        reasonModal.actionType === 'RETURN' ? 'warning' : 'error',
        reasonModal.actionType === 'RETURN' ? 'Đã trả lại báo cáo' : 'Đã từ chối báo cáo',
        `Báo cáo ${reasonModal.entityCode} đã được cập nhật`
      );
      setReasonModal({ isOpen: false, actionType: 'RETURN', targetId: '', entityCode: '' });
    } else {
      showToast('error', 'Lỗi', res.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Báo cáo Ca Sản xuất</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ghi nhận NVL thực dùng, sản lượng thực tế và phát hành mã LOT cho phòng KCS
          </p>
        </div>

        {Permissions.canSubmitShiftReport(currentUser.role) && (
          <button
            type="button"
            onClick={() => {
              setFormError('');
              setShowSubmitModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Gửi báo cáo ca
          </button>
        )}
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Mã báo cáo</th>
                <th className="py-3 px-4">Kế hoạch</th>
                <th className="py-3 px-4">Ngày / Ca</th>
                <th className="py-3 px-4">Công đoạn & Máy</th>
                <th className="py-3 px-4 text-right">NVL thực dùng</th>
                <th className="py-3 px-4 text-right">Sản lượng thực tế</th>
                <th className="py-3 px-4">Người báo cáo</th>
                <th className="py-3 px-4">Mã LOT tạo ra</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((r) => {
                const canDecide = r.status === 'SUBMITTED' && Permissions.canDecideShiftReport(currentUser.role);
                return (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.code}</td>
                    <td className="py-3 px-4 font-mono text-indigo-700 font-semibold">{r.planCode}</td>
                    <td className="py-3 px-4">
                      {r.productionDate} • {r.shift}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold block text-slate-800">{STAGE_NAMES[r.stage]}</span>
                      <span className="text-slate-400 text-[11px] truncate block">{r.machineName}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {r.actualMaterialUsedKg.toLocaleString('vi-VN')} kg
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {r.actualOutputKg.toLocaleString('vi-VN')} kg
                    </td>
                    <td className="py-3 px-4">{r.reportedByName}</td>
                    <td className="py-3 px-4">
                      {r.lotCodeGenerated ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold text-[11px]">
                          {r.lotCodeGenerated}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Chưa phát hành</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={r.status} size="sm" />
                      {r.status === 'RETURNED' && r.returnReason && (
                        <span className="block text-[10px] text-amber-700 mt-0.5">
                          Lý do: {r.returnReason}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {canDecide ? (
                        <DecisionButtons
                          size="sm"
                          onApprove={() => handleApprove(r)}
                          onReturn={() =>
                            setReasonModal({
                              isOpen: true,
                              actionType: 'RETURN',
                              targetId: r.id,
                              entityCode: r.code,
                            })
                          }
                          onReject={() =>
                            setReasonModal({
                              isOpen: true,
                              actionType: 'REJECT',
                              targetId: r.id,
                              entityCode: r.code,
                            })
                          }
                        />
                      ) : (
                        <span className="text-slate-400 text-[11px]">
                          {r.status === 'APPROVED' ? `Duyệt bởi ${r.approvedByName}` : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUBMIT REPORT MODAL (Production Staff) */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-slate-900 text-base">Gửi Báo cáo Ca Sản xuất</h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kế hoạch sản xuất liên quan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-indigo-500"
                  required
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.productName} ({p.productionDate} • {p.shift})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Công đoạn hoàn thành <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as ProductionStage)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-indigo-500"
                  >
                    {(Object.keys(STAGE_NAMES) as ProductionStage[]).map((s) => (
                      <option key={s} value={s}>
                        {STAGE_NAMES[s]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Thiết bị máy vận hành <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={machineId}
                    onChange={(e) => setMachineId(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-indigo-500"
                  >
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.code} - {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    NVL thực dùng (kg) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={actualMaterialUsedKg}
                    onChange={(e) => setActualMaterialUsedKg(Number(e.target.value))}
                    className="w-full text-sm font-semibold border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    (Không trừ kho lần hai khi duyệt báo cáo)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Sản lượng thực tế (kg) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={actualOutputKg}
                    onChange={(e) => setActualOutputKg(Number(e.target.value))}
                    className="w-full text-sm font-bold text-slate-900 border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Incident report checkbox */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasIncident}
                    onChange={(e) => setHasIncident(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded-sm"
                  />
                  Có sự cố phát sinh trong ca sản xuất
                </label>
                {hasIncident && (
                  <textarea
                    rows={2}
                    value={incidentDescription}
                    onChange={(e) => setIncidentDescription(e.target.value)}
                    placeholder="Mô tả hiện tượng kẹt liệu, mất điện, máy rung..."
                    className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white text-slate-800 focus:outline-hidden"
                  />
                )}
              </div>

              <EvidenceUpload
                label="Hình ảnh hiện trường / mẫu viên nén"
                value={imageUrl}
                onChange={setImageUrl}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ghi chú ca làm việc
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú về chất lượng dăm, độ ẩm lò sấy..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {formError && <p className="text-xs text-rose-600 font-medium">{formError}</p>}

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Xác nhận Nộp báo cáo ca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reason Modal */}
      <ReasonModal
        isOpen={reasonModal.isOpen}
        title={reasonModal.actionType === 'RETURN' ? 'Trả lại báo cáo ca' : 'Từ chối báo cáo ca'}
        actionType={reasonModal.actionType}
        entityName={reasonModal.entityCode}
        onClose={() => setReasonModal({ isOpen: false, actionType: 'RETURN', targetId: '', entityCode: '' })}
        onSubmit={handleSubmitReason}
      />
    </div>
  );
};
