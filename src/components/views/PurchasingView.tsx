import React, { useState } from 'react';
import {
  Plus,
  Search,
  Eye,
  Calendar,
  Scale,
  FileText,
  DollarSign,
  AlertCircle,
  X,
  History,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import { User, PurchaseAssignment, PurchaseStatus } from '../../types';
import { db } from '../../services/db';
import { Permissions } from '../../services/rbac';
import { StatusBadge } from '../common/StatusBadge';
import { DecisionButtons } from '../common/DecisionButtons';
import { ReasonModal } from '../common/ReasonModal';
import { EvidenceUpload } from '../common/EvidenceUpload';
import { EvidenceViewerModal } from '../common/EvidenceViewerModal';
import { AuditHistoryModal } from '../common/AuditHistoryModal';
import { Pagination } from '../common/Pagination';
import { showToast } from '../common/Toast';
import { formatVND, formatNumberVN } from '../../utils/formatters';

interface PurchasingViewProps {
  currentUser: User;
}

export const PurchasingView: React.FC<PurchasingViewProps> = ({ currentUser }) => {
  const snapshot = db.getSnapshot();
  const purchases = snapshot.purchases;
  const suppliers = snapshot.suppliers.filter((s) => s.status === 'ACTIVE');
  const users = snapshot.users;

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseAssignment | null>(null);
  const [showRecordResultModal, setShowRecordResultModal] = useState(false);
  const [detailPurchase, setDetailPurchase] = useState<PurchaseAssignment | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Evidence Viewer
  const [viewerImages, setViewerImages] = useState<{ url: string; label?: string }[]>([]);
  const [showEvidenceViewer, setShowEvidenceViewer] = useState(false);

  // Reason Modal for Return / Reject
  const [reasonModalConfig, setReasonModalConfig] = useState<{
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

  // Create Form State
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [plannedQuantityKg, setPlannedQuantityKg] = useState<number>(20000);
  const [plannedDate, setPlannedDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignedStaffId, setAssignedStaffId] = useState(
    users.find((u) => u.role === 'PS')?.id || ''
  );
  const [createNotes, setCreateNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Result Form State
  const [weighedQuantityKg, setWeighedQuantityKg] = useState<number>(0);
  const [unitPriceVnd, setUnitPriceVnd] = useState<number>(750);
  const [scaleTicketImageUrl, setScaleTicketImageUrl] = useState<string | undefined>();
  const [invoiceImageUrl, setInvoiceImageUrl] = useState<string | undefined>();
  const [purchasingNotes, setPurchasingNotes] = useState('');

  // Filter list
  const filteredPurchases = purchases.filter((p) => {
    const matchesSearch =
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.assignedStaffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.rawMaterialType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedPurchases = filteredPurchases.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Handlers
  const handleOpenCreate = () => {
    setSupplierId(suppliers[0]?.id || '');
    setPlannedQuantityKg(20000);
    setPlannedDate(new Date().toISOString().split('T')[0]);
    setAssignedStaffId(users.find((u) => u.role === 'PS')?.id || '');
    setCreateNotes('');
    setFormError('');
    setShowCreateModal(true);
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (plannedQuantityKg <= 0) {
      setFormError('Khối lượng dự kiến phải lớn hơn 0 kg');
      return;
    }
    const res = db.createPurchaseAssignment({
      supplierId,
      plannedQuantityKg,
      plannedDate,
      assignedStaffId,
      notes: createNotes,
      creator: currentUser,
    });

    if (res.success) {
      showToast('success', 'Tạo phân công thành công', `Mã phân công: ${res.assignment?.code}`);
      setShowCreateModal(false);
    } else {
      setFormError(res.error || 'Lỗi khi tạo phân công');
    }
  };

  const handleOpenRecordResult = (p: PurchaseAssignment) => {
    setSelectedPurchase(p);
    setWeighedQuantityKg(p.weighedQuantityKg || p.plannedQuantityKg);
    setUnitPriceVnd(p.unitPriceVnd || 750);
    setScaleTicketImageUrl(p.scaleTicketImageUrl);
    setInvoiceImageUrl(p.invoiceImageUrl);
    setPurchasingNotes(p.purchasingResultNotes || '');
    setFormError('');
    setShowRecordResultModal(true);
  };

  const handleSubmitResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchase) return;
    if (weighedQuantityKg <= 0) {
      setFormError('Khối lượng cân thực tế phải lớn hơn 0');
      return;
    }
    if (unitPriceVnd <= 0) {
      setFormError('Đơn giá phải lớn hơn 0');
      return;
    }

    const res = db.recordPurchaseResult({
      assignmentId: selectedPurchase.id,
      weighedQuantityKg,
      unitPriceVnd,
      scaleTicketImageUrl,
      invoiceImageUrl,
      purchasingResultNotes: purchasingNotes,
      user: currentUser,
    });

    if (res.success) {
      showToast('success', 'Gửi kết quả thành công', 'Hồ sơ đã được gửi đến Quản lý để phê duyệt');
      setShowRecordResultModal(false);
      setSelectedPurchase(null);
    } else {
      setFormError(res.error || 'Lỗi khi lưu kết quả');
    }
  };

  const handleApprove = (p: PurchaseAssignment) => {
    const res = db.decidePurchaseApproval({
      assignmentId: p.id,
      decision: 'APPROVE',
      user: currentUser,
    });
    if (res.success) {
      showToast('success', 'Đã phê duyệt', `Phiếu ${p.code} đã được duyệt và chuyển sang cho Thủ kho nhận hàng`);
    } else {
      showToast('error', 'Lỗi', res.error);
    }
  };

  const handleOpenReasonModal = (p: PurchaseAssignment, actionType: 'RETURN' | 'REJECT') => {
    setReasonModalConfig({
      isOpen: true,
      actionType,
      targetId: p.id,
      entityCode: p.code,
    });
  };

  const handleConfirmReason = (reason: string) => {
    const { actionType, targetId } = reasonModalConfig;
    const res = db.decidePurchaseApproval({
      assignmentId: targetId,
      decision: actionType,
      reason,
      user: currentUser,
    });

    if (res.success) {
      showToast(
        actionType === 'RETURN' ? 'warning' : 'error',
        actionType === 'RETURN' ? 'Đã trả lại hồ sơ' : 'Đã từ chối hồ sơ',
        `Lý do: ${reason}`
      );
      setReasonModalConfig({ ...reasonModalConfig, isOpen: false });
    } else {
      showToast('error', 'Lỗi', res.error);
    }
  };

  const handleViewEvidence = (p: PurchaseAssignment) => {
    const images: { url: string; label?: string }[] = [];
    if (p.scaleTicketImageUrl) {
      images.push({ url: p.scaleTicketImageUrl, label: 'Phiếu cân xe điện tử' });
    }
    if (p.invoiceImageUrl) {
      images.push({ url: p.invoiceImageUrl, label: 'Hóa đơn / Bảng kê thu mua' });
    }
    setViewerImages(images);
    setShowEvidenceViewer(true);
  };

  const handleViewAudit = (p: PurchaseAssignment) => {
    setSelectedPurchase(p);
    setShowAuditModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Thu mua Nguyên vật liệu</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quy trình phân công thu mua, cân xe điện tử, ghi nhận hóa đơn chứng từ và duyệt tiếp nhận
          </p>
        </div>

        {Permissions.canCreatePurchaseAssignment(currentUser.role) && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tạo phân công
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã phiếu, nhà cung cấp, NVL..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 bg-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ASSIGNED">Đã phân công</option>
            <option value="SUBMITTED">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="RETURNED">Đã trả lại</option>
            <option value="REJECTED">Đã từ chối</option>
            <option value="RECEIVED">Đã nhập kho</option>
            <option value="REJECTED_BY_WAREHOUSE">Kho từ chối</option>
          </select>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Mã phiếu</th>
                <th className="py-3 px-4">Nhà cung cấp</th>
                <th className="py-3 px-4">Mặt hàng</th>
                <th className="py-3 px-4 text-right">Dự kiến</th>
                <th className="py-3 px-4 text-right">Cân thực tế</th>
                <th className="py-3 px-4">Nhân viên thu mua</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Không tìm thấy hồ sơ thu mua nào
                  </td>
                </tr>
              ) : (
                paginatedPurchases.map((p) => {
                  const canRecord =
                    (p.status === 'ASSIGNED' || p.status === 'RETURNED') &&
                    Permissions.canRecordPurchaseResult(currentUser.role, p.assignedStaffId, currentUser.id);

                  const canApprove =
                    p.status === 'SUBMITTED' && Permissions.canDecidePurchase(currentUser.role);

                  const hasEvidence = !!p.scaleTicketImageUrl || !!p.invoiceImageUrl;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">{p.code}</td>
                      <td className="py-3 px-4 font-medium text-slate-800 max-w-[200px] truncate">
                        {p.supplierName}
                      </td>
                      <td className="py-3 px-4">Nguyên vật liệu</td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatNumberVN(p.plannedQuantityKg)} kg
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900">
                        {p.weighedQuantityKg ? `${formatNumberVN(p.weighedQuantityKg)} kg` : '—'}
                      </td>
                      <td className="py-3 px-4">{p.assignedStaffName}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={p.status} size="sm" />
                        {p.status === 'RETURNED' && p.returnReason && (
                          <span
                            className="block text-[10px] text-amber-700 truncate max-w-[150px] mt-0.5"
                            title={p.returnReason}
                          >
                            Lý do: {p.returnReason}
                          </span>
                        )}
                        {p.status === 'REJECTED_BY_WAREHOUSE' && p.warehouseRejectionReason && (
                          <span
                            className="block text-[10px] text-rose-700 truncate max-w-[150px] mt-0.5"
                            title={p.warehouseRejectionReason}
                          >
                            Kho từ chối: {p.warehouseRejectionReason}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Dedicated View Details Button */}
                          <button
                            type="button"
                            onClick={() => setDetailPurchase(p)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                            title="Xem chi tiết phân công & ghi chú"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Chi tiết</span>
                          </button>

                          {/* Record Result Button for Purchasing Staff */}
                          {canRecord && (
                            <button
                              type="button"
                              onClick={() => handleOpenRecordResult(p)}
                              className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs transition-colors cursor-pointer"
                            >
                              {p.status === 'RETURNED' ? 'Sửa hồ sơ' : 'Ghi kết quả'}
                            </button>
                          )}

                          {/* Distinct Decision Buttons for Owner / Manager (NO combobox!) */}
                          {canApprove && (
                            <DecisionButtons
                              size="sm"
                              onApprove={() => handleApprove(p)}
                              onReturn={() => handleOpenReasonModal(p, 'RETURN')}
                              onReject={() => handleOpenReasonModal(p, 'REJECT')}
                            />
                          )}

                          {/* Evidence View Icon */}
                          {hasEvidence && (
                            <button
                              type="button"
                              onClick={() => handleViewEvidence(p)}
                              className="p-1 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Xem ảnh chứng từ / phiếu cân"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}

                          {/* Audit History View Icon */}
                          <button
                            type="button"
                            onClick={() => handleViewAudit(p)}
                            className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Xem lịch sử xử lý"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={filteredPurchases.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* DETAIL MODAL (Prominently shows Manager's Assignment Notes!) */}
      {detailPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {detailPurchase.code}
                </span>
                <h3 className="font-bold text-slate-900 text-base">Hồ sơ Chi tiết Thu mua</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailPurchase(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* STATUS & SUPPLIER SUMMARY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block mb-0.5">Nhà cung cấp:</span>
                  <span className="font-bold text-slate-900 text-sm">{detailPurchase.supplierName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Trạng thái xử lý:</span>
                  <StatusBadge status={detailPurchase.status} size="md" />
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Mặt hàng:</span>
                  <span className="font-semibold text-slate-800">Nguyên vật liệu</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Nhân viên thu mua phụ trách:</span>
                  <span className="font-semibold text-indigo-700">{detailPurchase.assignedStaffName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Người giao nhiệm vụ:</span>
                  <span className="font-medium text-slate-700">{detailPurchase.createdByName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Ngày dự kiến thu mua:</span>
                  <span className="font-medium text-slate-700">{detailPurchase.plannedDate}</span>
                </div>
              </div>

              {/* MANDATORY: CREATOR ASSIGNMENT NOTES (Never overwritten, prominently displayed!) */}
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-900">
                <span className="font-bold text-xs uppercase tracking-wider block mb-1 text-amber-800 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Ghi chú phân công của Lãnh đạo / Quản lý:
                </span>
                <p className="text-xs text-amber-950 font-medium leading-relaxed bg-white/60 p-2.5 rounded-lg border border-amber-200">
                  {detailPurchase.assignmentNotes || 'Không có ghi chú phân công đặc biệt.'}
                </p>
              </div>

              {/* ACTUAL PURCHASING RESULT */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Kết quả Thu mua Thực tế
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-slate-100">
                    <span className="text-slate-400 block mb-1">Khối lượng cân:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {detailPurchase.weighedQuantityKg
                        ? `${formatNumberVN(detailPurchase.weighedQuantityKg)} kg`
                        : 'Chưa thực hiện'}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-100">
                    <span className="text-slate-400 block mb-1">Đơn giá thực tế:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {detailPurchase.unitPriceVnd
                        ? `${formatNumberVN(detailPurchase.unitPriceVnd)} đ/kg`
                        : 'Chưa có đơn giá'}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-100">
                    <span className="text-slate-400 block mb-1">Tổng thành tiền:</span>
                    <span className="font-bold text-indigo-700 text-sm">
                      {detailPurchase.totalAmountVnd
                        ? formatVND(detailPurchase.totalAmountVnd)
                        : '—'}
                    </span>
                  </div>
                </div>

                {detailPurchase.purchasingResultNotes && (
                  <div className="mt-2">
                    <span className="text-slate-500 font-semibold block mb-0.5">
                      Ghi chú của nhân viên thu mua:
                    </span>
                    <p className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-800">
                      {detailPurchase.purchasingResultNotes}
                    </p>
                  </div>
                )}

                {/* Evidence attachments */}
                <div className="flex gap-2 pt-2">
                  {detailPurchase.scaleTicketImageUrl && (
                    <button
                      type="button"
                      onClick={() => handleViewEvidence(detailPurchase)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs flex items-center gap-1.5 border border-indigo-200 cursor-pointer"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Xem ảnh phiếu cân
                    </button>
                  )}
                  {detailPurchase.invoiceImageUrl && (
                    <button
                      type="button"
                      onClick={() => handleViewEvidence(detailPurchase)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs flex items-center gap-1.5 border border-emerald-200 cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      Xem ảnh hóa đơn
                    </button>
                  )}
                </div>
              </div>

              {/* APPROVAL & WAREHOUSE INFORMATION */}
              {(detailPurchase.approvalDecidedAt || detailPurchase.receivedAt) && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Tiến độ Duyệt & Nhập kho
                  </h4>
                  {detailPurchase.approvalDecidedAt && (
                    <div className="text-xs text-slate-600">
                      <span>Người phê duyệt: </span>
                      <strong className="text-slate-800">{detailPurchase.approvedByName}</strong>
                      <span className="text-slate-400"> ({new Date(detailPurchase.approvalDecidedAt).toLocaleString('vi-VN')})</span>
                    </div>
                  )}
                  {detailPurchase.receivedAt && (
                    <div className="text-xs text-slate-600">
                      <span>Thủ kho tiếp nhận: </span>
                      <strong className="text-slate-800">{detailPurchase.receivedByName}</strong>
                      <span> • Thực nhận: </span>
                      <strong className="text-emerald-700">{formatNumberVN(detailPurchase.receivedQuantityKg)} kg</strong>
                      <span className="text-slate-400"> ({new Date(detailPurchase.receivedAt).toLocaleString('vi-VN')})</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailPurchase(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ASSIGNMENT MODAL (Owner / Manager) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Tạo Phân công Thu mua</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nhà cung cấp <span className="text-rose-500">*</span>
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-indigo-500"
                  required
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name} ({s.contactPerson})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mặt hàng thu mua
                </label>
                <input
                  type="text"
                  value="Nguyên vật liệu"
                  disabled
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 text-slate-500 bg-slate-100 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Khối lượng dự kiến (kg) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="100"
                    value={plannedQuantityKg}
                    onChange={(e) => setPlannedQuantityKg(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ngày dự kiến <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={plannedDate}
                    onChange={(e) => setPlannedDate(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phân công Nhân viên thu mua <span className="text-rose-500">*</span>
                </label>
                <select
                  value={assignedStaffId}
                  onChange={(e) => setAssignedStaffId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-indigo-500"
                  required
                >
                  {users
                    .filter((u) => u.role === 'PS')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.phone})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ghi chú phân công của Lãnh đạo (Hiển thị cố định cho nhân viên)
                </label>
                <textarea
                  rows={3}
                  value={createNotes}
                  onChange={(e) => setCreateNotes(e.target.value)}
                  placeholder="Yêu cầu kiểm tra tạp chất, yêu cầu lấy hóa đơn VAT, thời gian giao hàng..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {formError && <p className="text-xs text-rose-600 font-medium">{formError}</p>}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
                >
                  Xác nhận Phân công
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD RESULT MODAL (Purchasing Staff) */}
      {showRecordResultModal && selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Ghi nhận Kết quả Thu mua Thực tế</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">Hồ sơ: {selectedPurchase.code}</p>
              </div>
              <button
                onClick={() => setShowRecordResultModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitResult} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Reminder of Creator notes */}
              {selectedPurchase.assignmentNotes && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs">
                  <span className="font-bold block mb-1">Ghi chú giao việc từ Quản lý:</span>
                  <p>{selectedPurchase.assignmentNotes}</p>
                </div>
              )}

              {selectedPurchase.status === 'RETURNED' && selectedPurchase.returnReason && (
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 text-orange-900 text-xs">
                  <span className="font-bold block mb-1">Lý do trả lại cần khắc phục:</span>
                  <p>{selectedPurchase.returnReason}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Khối lượng cân thực tế (kg) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="10"
                    value={weighedQuantityKg}
                    onChange={(e) => setWeighedQuantityKg(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Đơn giá (VNĐ/kg) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="10"
                    value={unitPriceVnd}
                    onChange={(e) => setUnitPriceVnd(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Calculated total amount */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Tổng thành tiền dự kiến:</span>
                <span className="text-sm font-bold text-indigo-700">
                  {formatVND(weighedQuantityKg * unitPriceVnd)}
                </span>
              </div>

              <div className="space-y-3">
                <EvidenceUpload
                  label="Ảnh Phiếu cân xe điện tử (Trạm cân)"
                  currentImageUrl={scaleTicketImageUrl}
                  onImageSelected={setScaleTicketImageUrl}
                  required
                />

                <EvidenceUpload
                  label="Ảnh Hóa đơn VAT / Bảng kê thu mua"
                  currentImageUrl={invoiceImageUrl}
                  onImageSelected={setInvoiceImageUrl}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ghi chú riêng của Nhân viên thu mua
                </label>
                <textarea
                  rows={2}
                  value={purchasingNotes}
                  onChange={(e) => setPurchasingNotes(e.target.value)}
                  placeholder="Ghi nhận số phiếu cân, biển số xe chở hàng, tình trạng thực tế..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {formError && <p className="text-xs text-rose-600 font-medium">{formError}</p>}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRecordResultModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
                >
                  Gửi duyệt kết quả
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REASON MODAL FOR RETURN / REJECT */}
      <ReasonModal
        isOpen={reasonModalConfig.isOpen}
        title={reasonModalConfig.actionType === 'RETURN' ? 'Trả lại hồ sơ yêu cầu sửa' : 'Từ chối phê duyệt hồ sơ'}
        actionType={reasonModalConfig.actionType}
        entityCode={reasonModalConfig.entityCode}
        onConfirm={handleConfirmReason}
        onClose={() => setReasonModalConfig({ ...reasonModalConfig, isOpen: false })}
      />

      {/* EVIDENCE VIEWER MODAL */}
      <EvidenceViewerModal
        isOpen={showEvidenceViewer}
        images={viewerImages}
        onClose={() => setShowEvidenceViewer(false)}
      />

      {/* AUDIT HISTORY MODAL */}
      {selectedPurchase && (
        <AuditHistoryModal
          isOpen={showAuditModal}
          entityType="PURCHASE_ASSIGNMENT"
          entityId={selectedPurchase.id}
          entityCode={selectedPurchase.code}
          onClose={() => setShowAuditModal(false)}
        />
      )}
    </div>
  );
};
