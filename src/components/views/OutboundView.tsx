import React, { useState } from 'react';
import { Truck, Plus, CheckCircle2, RotateCcw, XCircle, AlertTriangle, FileText, UserCheck, ShieldCheck, X } from 'lucide-react';
import { User, OutboundProposal, Customer, LotItem } from '../../types';
import { db } from '../../services/db';
import { Permissions } from '../../services/rbac';
import { StatusBadge } from '../common/StatusBadge';
import { DecisionButtons } from '../common/DecisionButtons';
import { ReasonModal } from '../common/ReasonModal';
import { EvidenceUpload } from '../common/EvidenceUpload';
import { showToast } from '../common/Toast';

interface OutboundViewProps {
  currentUser: User;
}

export const OutboundView: React.FC<OutboundViewProps> = ({ currentUser }) => {
  const snapshot = db.getSnapshot();
  const proposals = snapshot.outboundProposals;
  const customers = snapshot.customers;
  const inWarehouseLots = snapshot.lots.filter((l) => l.isReceivedInWarehouse && l.availableQuantityKg > 0);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProp, setSelectedProp] = useState<OutboundProposal | null>(null);
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [showQcModal, setShowQcModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showOwnerDecisionModal, setShowOwnerDecisionModal] = useState(false);
  const [dispatchRejectModal, setDispatchRejectModal] = useState<{
    isOpen: boolean;
    proposal: OutboundProposal | null;
  }>({ isOpen: false, proposal: null });

  // Form states: Create proposal
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [selectedLotId, setSelectedLotId] = useState(inWarehouseLots[0]?.id || '');
  const [requestedQuantityKg, setRequestedQuantityKg] = useState<number>(10000);
  const [unitPriceVnd, setUnitPriceVnd] = useState<number>(3850);
  const [notes, setNotes] = useState('');
  const [createError, setCreateError] = useState('');

  // Form states: Recipient info (Manager)
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [truckLicensePlate, setTruckLicensePlate] = useState('');
  const [pickupTimeScheduled, setPickupTimeScheduled] = useState('');

  // Form states: Outbound QC (QC Staff)
  const [outboundMoisture, setOutboundMoisture] = useState<number>(8.0);
  const [outboundAsh, setOutboundAsh] = useState<number>(0.7);
  const [outboundImpurities, setOutboundImpurities] = useState<number>(0.15);

  // Form states: Dispatch (Warehouse Staff)
  const [truckPlateVerified, setTruckPlateVerified] = useState('');
  const [actualDispatchedKg, setActualDispatchedKg] = useState<number>(10000);
  const [dispatchEvidenceUrl, setDispatchEvidenceUrl] = useState<string | undefined>();
  const [dispatchError, setDispatchError] = useState('');

  // Form states: Owner Decision Modal (Override customer, adjust price, approve/return/reject)
  const [overrideCustomerId, setOverrideCustomerId] = useState('');
  const [adjustedPrice, setAdjustedPrice] = useState<number>(0);
  const [ownerDecisionReason, setOwnerDecisionReason] = useState('');

  // Reason Modal
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

  const handleOpenCreate = () => {
    setCustomerId(customers[0]?.id || '');
    setSelectedLotId(inWarehouseLots[0]?.id || '');
    setRequestedQuantityKg(10000);
    setUnitPriceVnd(3850);
    setNotes('');
    setCreateError('');
    setShowCreateModal(true);
  };

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    const lot = inWarehouseLots.find((l) => l.id === selectedLotId);
    if (!lot) {
      setCreateError('Chưa chọn lô hàng thành phẩm hợp lệ');
      return;
    }

    const res = db.createOutboundProposal({
      sourceWarehouse: lot.targetWarehouse || 'KHO_A',
      customerId,
      lotId: lot.id,
      requestedQuantityKg,
      notes,
      user: currentUser,
    });

    if (res.success) {
      showToast('success', 'Tạo đề xuất thành công', 'Đề xuất xuất hàng đã được tạo theo quy trình');
      setShowCreateModal(false);
    } else {
      setCreateError(res.error || 'Lỗi khi tạo đề xuất');
    }
  };

  const handleOpenOwnerModal = (p: OutboundProposal) => {
    setSelectedProp(p);
    setOverrideCustomerId(p.customerId);
    setAdjustedPrice(p.unitPriceVnd || 3850);
    setOwnerDecisionReason('');
    setShowOwnerDecisionModal(true);
  };

  const handleOwnerApprove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProp) return;

    const res = db.ownerDecideOutboundProposal({
      proposalId: selectedProp.id,
      decision: 'APPROVE',
      newCustomerId: overrideCustomerId,
      decidedPriceVnd: adjustedPrice,
      user: currentUser,
    });

    if (res.success) {
      showToast('success', 'Owner đã phê duyệt', `Đề xuất ${selectedProp.code} đã được phê duyệt xuất hàng`);
      setShowOwnerDecisionModal(false);
    } else {
      showToast('error', 'Lỗi', res.error);
    }
  };

  const handleOpenRecipient = (p: OutboundProposal) => {
    setSelectedProp(p);
    setRecipientName(p.recipientName || '');
    setRecipientPhone(p.recipientPhone || '');
    setTruckLicensePlate(p.truckLicensePlate || '');
    setPickupTimeScheduled(p.pickupTimeScheduled || new Date().toISOString().slice(0, 16));
    setShowRecipientModal(true);
  };

  const handleSaveRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProp) return;

    const res = db.recordRecipientInfo({
      proposalId: selectedProp.id,
      recipientName,
      recipientPhone,
      truckLicensePlate,
      pickupTimeScheduled,
      user: currentUser,
    });

    if (res.success) {
      showToast('success', 'Đã cập nhật xe nhận hàng', `Đã lưu thông tin tài xế ${recipientName} (${truckLicensePlate})`);
      setShowRecipientModal(false);
    }
  };

  const handleOpenQc = (p: OutboundProposal) => {
    setSelectedProp(p);
    setOutboundMoisture(8.0);
    setOutboundAsh(0.7);
    setOutboundImpurities(0.15);
    setShowQcModal(true);
  };

  const handleSaveOutboundQc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProp) return;

    const res = db.recordOutboundQc({
      proposalId: selectedProp.id,
      moisturePercent: outboundMoisture,
      ashPercent: outboundAsh,
      impuritiesPercent: outboundImpurities,
      user: currentUser,
    });

    if (res.success) {
      showToast('success', 'Đã lưu QC xuất hàng', `Kết quả kiểm tra xuất xưởng đã được liên kết với hồ sơ`);
      setShowQcModal(false);
    }
  };

  const handleOpenDispatch = (p: OutboundProposal) => {
    setSelectedProp(p);
    setTruckPlateVerified(p.truckLicensePlate || '');
    setActualDispatchedKg(p.requestedQuantityKg);
    setDispatchEvidenceUrl(undefined);
    setDispatchError('');
    setShowDispatchModal(true);
  };

  const handleConfirmDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProp) return;

    const res = db.confirmPhysicalDispatch({
      proposalId: selectedProp.id,
      actualDispatchedKg,
      truckPlateVerified,
      dispatchEvidenceImageUrl: dispatchEvidenceUrl,
      user: currentUser,
    });

    if (res.success) {
      showToast(
        'success',
        'Xuất kho thành công',
        `Đã bàn giao ${actualDispatchedKg.toLocaleString('vi-VN')} kg cho xe ${truckPlateVerified}. Tồn kho đã giảm.`
      );
      setShowDispatchModal(false);
    } else {
      setDispatchError(res.error || 'Lỗi xuất kho');
    }
  };

  const handleConfirmRejectDispatch = (reason: string) => {
    if (!dispatchRejectModal.proposal) return;
    const res = db.rejectDispatch({
      proposalId: dispatchRejectModal.proposal.id,
      reason,
      user: currentUser,
    });
    if (res.success) {
      showToast('error', 'Đã từ chối xuất kho', `Đã từ chối xuất cho đề xuất ${dispatchRejectModal.proposal.code}`);
      setDispatchRejectModal({ isOpen: false, proposal: null });
    } else {
      showToast('error', 'Lỗi', res.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Xuất xưởng & Bàn giao Thành phẩm</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý & Thủ kho trực tiếp đề xuất lên Giám đốc duyệt giá bán • Thủ kho xác nhận xuất kho hoặc từ chối
          </p>
        </div>

        {/* Can create proposal */}
        {(currentUser.role === 'WS' || currentUser.role === 'M' || currentUser.role === 'O') && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tạo đề xuất xuất hàng
          </button>
        )}
      </div>

      {/* Proposals List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Mã đề xuất</th>
                <th className="py-3 px-4">Kho xuất</th>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Lô hàng xuất</th>
                <th className="py-3 px-4 text-right">Khối lượng</th>
                <th className="py-3 px-4 text-right">Đơn giá (VND/kg)</th>
                <th className="py-3 px-4 text-center">QC Xuất</th>
                <th className="py-3 px-4">Xe nhận hàng</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {proposals.map((p) => {
                const canOwnerDecide =
                  p.status === 'PENDING_OWNER_APPROVAL' && Permissions.canOwnerDecideOutbound(currentUser.role);

                const canRecordRecipient =
                  p.status === 'APPROVED' &&
                  !p.isDispatched &&
                  Permissions.canRecordRecipientInfo(currentUser.role);

                const canRecordQc =
                  !p.outboundQcTested && Permissions.canRecordOutboundQc(currentUser.role);

                const canDispatch =
                  p.status === 'APPROVED' &&
                  !p.isDispatched &&
                  p.truckLicensePlate &&
                  Permissions.canConfirmDispatch(currentUser.role);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.code}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {p.sourceWarehouse === 'KHO_A' ? 'Kho A (Xuất khẩu)' : 'Kho B (Công nghiệp)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {p.customerName}
                      {p.originalCustomerName && (
                        <span className="block text-[10px] text-indigo-600 font-normal">
                          (Đổi từ: {p.originalCustomerName})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-700">{p.lotCode}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {p.requestedQuantityKg.toLocaleString('vi-VN')} kg
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {p.unitPriceVnd ? `${p.unitPriceVnd.toLocaleString('vi-VN')} VND` : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.outboundQcTested ? (
                        <span className="text-emerald-700 font-semibold text-[11px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đạt ({p.outboundQcMoisture}%)
                        </span>
                      ) : canRecordQc ? (
                        <button
                          type="button"
                          onClick={() => handleOpenQc(p)}
                          className="px-2 py-1 rounded bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold text-[11px] cursor-pointer"
                        >
                          Đo QC xuất
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Chưa đo</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {p.truckLicensePlate ? (
                        <div>
                          <span className="font-mono font-bold text-slate-800">{p.truckLicensePlate}</span>
                          <span className="block text-[10px] text-slate-500">{p.recipientName}</span>
                        </div>
                      ) : canRecordRecipient ? (
                        <button
                          type="button"
                          onClick={() => handleOpenRecipient(p)}
                          className="px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold text-[11px] cursor-pointer"
                        >
                          + Ghi xe nhận
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Chưa đăng ký</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={p.status} size="sm" />
                      {p.dispatchMismatchFlag && (
                        <span className="block text-[10px] text-rose-600 font-bold mt-0.5">
                          Lệch biển số xe!
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* Owner Decision Action */}
                        {canOwnerDecide && (
                          <button
                            type="button"
                            onClick={() => handleOpenOwnerModal(p)}
                            className="px-3 py-1 rounded-md bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-xs cursor-pointer"
                          >
                            Owner Quyết định
                          </button>
                        )}

                        {/* Dispatch confirmation / Rejection (Warehouse staff) */}
                        {canDispatch && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenDispatch(p)}
                              className="px-2.5 py-1 rounded-md bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 shadow-xs cursor-pointer"
                            >
                              Xuất kho
                            </button>
                            <button
                              type="button"
                              onClick={() => setDispatchRejectModal({ isOpen: true, proposal: p })}
                              className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs hover:bg-rose-100 cursor-pointer"
                            >
                              Từ chối
                            </button>
                          </div>
                        )}

                        {p.isDispatched && (
                          <span className="text-[11px] font-semibold text-slate-500">Đã giao hàng</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE OUTBOUND PROPOSAL MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Tạo Đề xuất Xuất hàng</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Khách hàng mua hàng <span className="text-rose-500">*</span>
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-indigo-500"
                  required
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Lô hàng thành phẩm xuất kho (FIFO) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedLotId}
                  onChange={(e) => setSelectedLotId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-indigo-500"
                  required
                >
                  {inWarehouseLots.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.lotCode} ({l.productName} • {l.targetWarehouse === 'KHO_A' ? 'Kho A (Xuất khẩu)' : 'Kho B (Công nghiệp)'} • Khả dụng: {l.availableQuantityKg.toLocaleString('vi-VN')} kg)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Khối lượng xuất (kg) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={requestedQuantityKg}
                    onChange={(e) => setRequestedQuantityKg(Number(e.target.value))}
                    className="w-full text-sm font-bold border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Đơn giá bán
                  </label>
                  {currentUser.role === 'O' ? (
                    <input
                      type="number"
                      value={unitPriceVnd}
                      onChange={(e) => setUnitPriceVnd(Number(e.target.value))}
                      placeholder="VND/kg"
                      className="w-full text-sm font-semibold border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                    />
                  ) : (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 italic">
                      Do Giám đốc (Owner) quyết định
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ghi chú xuất xưởng
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú điều kiện giao hàng, cảng đến..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {createError && <p className="text-xs text-rose-600 font-medium">{createError}</p>}

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Gửi đề xuất xuất hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OWNER EXCLUSIVE DECISION MODAL */}
      {showOwnerDecisionModal && selectedProp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Owner Quyết định Xuất hàng Cuối cùng</h3>
                <p className="text-xs text-slate-500 font-mono">Đề xuất: {selectedProp.code}</p>
              </div>
              <button
                onClick={() => setShowOwnerDecisionModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOwnerApprove} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-1 text-xs">
                <p className="font-semibold text-indigo-900">
                  Lô hàng xuất: <span className="font-mono">{selectedProp.lotCode}</span> ({selectedProp.sourceWarehouse === 'KHO_A' ? 'Kho A (Xuất khẩu)' : 'Kho B (Công nghiệp)'})
                </p>
                <p className="text-indigo-800">
                  Khối lượng: {selectedProp.requestedQuantityKg.toLocaleString('vi-VN')} kg
                </p>
              </div>

              {/* Owner power: Override customer while preserving history */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Đối tác mua hàng (Owner có quyền thay đổi đối tác)
                </label>
                <select
                  value={overrideCustomerId}
                  onChange={(e) => setOverrideCustomerId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 bg-white font-medium focus:outline-hidden focus:border-indigo-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Owner power: Set or adjust selling price */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Đơn giá bán chốt (VND/kg) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustedPrice}
                  onChange={(e) => setAdjustedPrice(Number(e.target.value))}
                  className="w-full text-sm font-bold border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  required
                />
                <span className="text-xs font-bold text-emerald-700 mt-1 block">
                  Tổng giá trị đơn hàng: {(adjustedPrice * selectedProp.requestedQuantityKg).toLocaleString('vi-VN')} VND
                </span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOwnerDecisionModal(false);
                      setReasonModal({
                        isOpen: true,
                        actionType: 'RETURN',
                        targetId: selectedProp.id,
                        entityCode: selectedProp.code,
                      });
                    }}
                    className="px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Trả lại đề xuất
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOwnerDecisionModal(false);
                      setReasonModal({
                        isOpen: true,
                        actionType: 'REJECT',
                        targetId: selectedProp.id,
                        entityCode: selectedProp.code,
                      });
                    }}
                    className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Từ chối
                  </button>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Owner Phê duyệt Xuất hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECIPIENT INFORMATION MODAL (Manager) */}
      {showRecipientModal && selectedProp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Ghi nhận Xe & Người Nhận hàng</h3>
              <button
                onClick={() => setShowRecipientModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipient} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Họ tên tài xế / người nhận <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn Hùng"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Số điện thoại liên hệ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="09xx.xxx.xxx"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Biển số xe nhận hàng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={truckLicensePlate}
                  onChange={(e) => setTruckLicensePlate(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: 72C-184.92"
                  className="w-full text-sm font-mono font-bold border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Thủ kho sẽ kiểm tra biển số xe thực tế trước khi cho phép xuất kho
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Thời gian nhận hàng dự kiến <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={pickupTimeScheduled}
                  onChange={(e) => setPickupTimeScheduled(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRecipientModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Lưu thông tin xe nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OUTBOUND QC MODAL (QC Staff) */}
      {showQcModal && selectedProp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Ghi nhận QC Kiểm tra Xuất hàng</h3>
              <button
                onClick={() => setShowQcModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOutboundQc} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Lô xuất: <span className="font-bold text-slate-800 font-mono">{selectedProp.lotCode}</span>
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Độ ẩm tại thời điểm xuất (%) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={outboundMoisture}
                  onChange={(e) => setOutboundMoisture(Number(e.target.value))}
                  className="w-full text-sm font-bold border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Độ tro (%) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={outboundAsh}
                  onChange={(e) => setOutboundAsh(Number(e.target.value))}
                  className="w-full text-sm font-bold border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowQcModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Xác nhận QC xuất hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PHYSICAL DISPATCH MODAL (Warehouse Staff) */}
      {showDispatchModal && selectedProp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Xác minh & Bàn giao Xuất kho</h3>
                <p className="text-xs text-slate-500 font-mono">Đề xuất: {selectedProp.code}</p>
              </div>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDispatch} className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Khách hàng:</span>
                  <span className="font-bold text-slate-900">{selectedProp.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Biển số xe đã đăng ký:</span>
                  <span className="font-mono font-bold text-indigo-700 text-sm">
                    {selectedProp.truckLicensePlate || 'Chưa đăng ký'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Lô hàng xuất:</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedProp.lotCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Khối lượng phê duyệt:</span>
                  <span className="font-bold text-slate-900">
                    {selectedProp.requestedQuantityKg.toLocaleString('vi-VN')} kg
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Xác minh biển số xe thực tế đến nhận <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={truckPlateVerified}
                  onChange={(e) => setTruckPlateVerified(e.target.value.toUpperCase())}
                  placeholder="Nhập biển số xe thực tế..."
                  className="w-full text-base font-mono font-bold border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Nếu không trùng khớp biển số đăng ký, hệ thống sẽ chặn xuất và cảnh báo Quản lý.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Khối lượng thực xuất cân giao (kg) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={actualDispatchedKg}
                  onChange={(e) => setActualDispatchedKg(Number(e.target.value))}
                  className="w-full text-sm font-bold border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <EvidenceUpload
                label="Ảnh chụp xe chở hàng / Biên bản bàn giao"
                value={dispatchEvidenceUrl}
                onChange={setDispatchEvidenceUrl}
              />

              {dispatchError && <p className="text-xs text-rose-600 font-medium">{dispatchError}</p>}

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Xác nhận Bàn giao & Trừ kho Thành phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mandatory Reason Modal */}
      <ReasonModal
        isOpen={reasonModal.isOpen}
        title={reasonModal.actionType === 'RETURN' ? 'Trả lại đề xuất xuất hàng' : 'Từ chối đề xuất xuất hàng'}
        actionType={reasonModal.actionType}
        entityName={reasonModal.entityCode}
        onClose={() => setReasonModal({ isOpen: false, actionType: 'RETURN', targetId: '', entityCode: '' })}
        onSubmit={(reason) => {
          db.ownerDecideOutboundProposal({
            proposalId: reasonModal.targetId,
            decision: reasonModal.actionType,
            reason,
            user: currentUser,
          });
          showToast(
            reasonModal.actionType === 'RETURN' ? 'warning' : 'error',
            reasonModal.actionType === 'RETURN' ? 'Đã trả lại đề xuất' : 'Đã từ chối đề xuất',
            `Đề xuất ${reasonModal.entityCode} đã được cập nhật`
          );
          setReasonModal({ isOpen: false, actionType: 'RETURN', targetId: '', entityCode: '' });
        }}
      />
      {/* Warehouse Staff Dispatch Rejection Modal */}
      {dispatchRejectModal.proposal && (
        <ReasonModal
          isOpen={dispatchRejectModal.isOpen}
          title="Từ chối Xuất kho Bàn giao"
          actionType="REJECT"
          entityName={dispatchRejectModal.proposal.code}
          onClose={() => setDispatchRejectModal({ isOpen: false, proposal: null })}
          onSubmit={handleConfirmRejectDispatch}
        />
      )}
    </div>
  );
};
