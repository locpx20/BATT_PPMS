import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  Calendar,
  Scale,
  FileText,
  DollarSign,
  AlertCircle,
  X,
  History,
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

interface PurchasingViewProps {
  currentUser: User;
}

export const PurchasingView: React.FC<PurchasingViewProps> = ({ currentUser }) => {
  const snapshot = db.getSnapshot();
  const purchases = snapshot.purchases;
  const suppliers = snapshot.suppliers;
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
  const [rawMaterialType, setRawMaterialType] = useState('Mùn cưa keo tràm');
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

    // Purchasing staff sees all or their own
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
      rawMaterialType,
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
    setPurchasingNotes(p.purchasingNotes || '');
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
      purchasingNotes,
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
      showToast('success', 'Đã phê duyệt', `${p.code} đã được duyệt và chuyển sang bước chờ thủ kho nhận`);
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

  const handleSubmitReason = (reason: string) => {
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
        `Hồ sơ ${reasonModalConfig.entityCode} đã được cập nhật`
      );
      setReasonModalConfig({ isOpen: false, actionType: 'RETURN', targetId: '', entityCode: '' });
    } else {
      showToast('error', 'Lỗi', res.error);
    }
  };

  const handleViewEvidence = (p: PurchaseAssignment) => {
    const imgs: { url: string; label?: string }[] = [];
    if (p.scaleTicketImageUrl) imgs.push({ url: p.scaleTicketImageUrl, label: 'Phiếu cân điện tử' });
    if (p.invoiceImageUrl) imgs.push({ url: p.invoiceImageUrl, label: 'Hóa đơn / Chứng từ' });
    if (imgs.length > 0) {
      setViewerImages(imgs);
      setShowEvidenceViewer(true);
    }
  };

  const handleViewAudit = (p: PurchaseAssignment) => {
    setSelectedPurchase(p);
    setShowAuditModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Phân công Thu mua</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý kế hoạch mua, ghi nhận cân hàng thực tế và phê duyệt hồ sơ thu mua
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
            <option value="ASSIGNED">Đã phân công (ASSIGNED)</option>
            <option value="SUBMITTED">Chờ phê duyệt (SUBMITTED)</option>
            <option value="APPROVED">Đã phê duyệt (APPROVED)</option>
            <option value="RETURNED">Bị trả lại (RETURNED)</option>
            <option value="REJECTED">Từ chối (REJECTED)</option>
            <option value="RECEIVED">Đã nhập kho (RECEIVED)</option>
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
                <th className="py-3 px-4">Nguyên vật liệu</th>
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
                      <td className="py-3 px-4">{p.rawMaterialType}</td>
                      <td className="py-3 px-4 text-right font-medium">
                        {p.plannedQuantityKg.toLocaleString('vi-VN')} kg
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900">
                        {p.weighedQuantityKg ? `${p.weighedQuantityKg.toLocaleString('vi-VN')} kg` : '—'}
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
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
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
                  Loại nguyên vật liệu <span className="text-rose-500">*</span>
                </label>
                <select
                  value={rawMaterialType}
                  onChange={(e) => setRawMaterialType(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="Mùn cưa keo tràm">Mùn cưa keo tràm</option>
                  <option value="Dăm bào cao su">Dăm bào cao su</option>
                  <option value="Dăm gỗ keo lá tràm">Dăm gỗ keo lá tràm</option>
                  <option value="Mùn cưa thông">Mùn cưa thông</option>
                  <option value="Dăm bào khô">Dăm bào khô</option>
                  <option value="Cây củi tạp địa phương">Cây củi tạp địa phương</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Khối lượng dự kiến (kg) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={plannedQuantityKg}
                    onChange={(e) => setPlannedQuantityKg(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ngày dự kiến cân <span className="text-rose-500">*</span>
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
                  Nhân viên thu mua phụ trách <span className="text-rose-500">*</span>
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
                  Ghi chú điều hành
                </label>
                <textarea
                  rows={2}
                  value={createNotes}
                  onChange={(e) => setCreateNotes(e.target.value)}
                  placeholder="Ghi chú về địa điểm trạm cân, yêu cầu độ ẩm..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {formError && <p className="text-xs text-rose-600 font-medium">{formError}</p>}

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
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Xác nhận Tạo phân công
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PURCHASE RESULT MODAL (Purchasing Staff) */}
      {showRecordResultModal && selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Ghi Kết quả Thu mua Thực tế</h3>
                <p className="text-xs text-slate-500 font-mono">Phiếu phân công: {selectedPurchase.code}</p>
              </div>
              <button
                onClick={() => setShowRecordResultModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitResult} className="p-6 space-y-4">
              {/* Inherited Info (ReadOnly as required in 5.2) */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Nhà cung cấp:</span>
                  <span className="font-semibold text-slate-800">{selectedPurchase.supplierName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Loại NVL:</span>
                  <span className="font-semibold text-slate-800">{selectedPurchase.rawMaterialType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Khối lượng dự kiến:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedPurchase.plannedQuantityKg.toLocaleString('vi-VN')} kg
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Ngày dự kiến:</span>
                  <span className="font-semibold text-slate-800">{selectedPurchase.plannedDate}</span>
                </div>
              </div>

              {selectedPurchase.status === 'RETURNED' && selectedPurchase.returnReason && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold">Lý do bị trả lại trước đó: </span>
                  {selectedPurchase.returnReason}
                </div>
              )}

              {/* Editable Actuals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Khối lượng cân thực tế (kg) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={weighedQuantityKg}
                    onChange={(e) => setWeighedQuantityKg(Number(e.target.value))}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 text-slate-800 font-semibold focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Đơn giá mua (VND/kg) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={unitPriceVnd}
                    onChange={(e) => setUnitPriceVnd(Number(e.target.value))}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 text-slate-800 font-semibold focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Total Calculation Display */}
              <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                <span className="text-xs font-medium text-indigo-900">Tổng giá trị thanh toán tính toán:</span>
                <span className="text-base font-bold text-indigo-950 font-mono">
                  {(weighedQuantityKg * unitPriceVnd).toLocaleString('vi-VN')} VND
                </span>
              </div>

              {/* Evidence Uploads */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <EvidenceUpload
                  label="Phiếu cân xe điện tử"
                  value={scaleTicketImageUrl}
                  onChange={setScaleTicketImageUrl}
                />
                <EvidenceUpload
                  label="Hóa đơn / Biên nhận"
                  value={invoiceImageUrl}
                  onChange={setInvoiceImageUrl}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ghi chú kết quả cân
                </label>
                <textarea
                  rows={2}
                  value={purchasingNotes}
                  onChange={(e) => setPurchasingNotes(e.target.value)}
                  placeholder="Ghi chú số phiếu trạm cân, xe chở..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {formError && <p className="text-xs text-rose-600 font-medium">{formError}</p>}

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRecordResultModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Gửi duyệt kết quả thu mua
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mandatory Reason Modal for Return or Reject */}
      <ReasonModal
        isOpen={reasonModalConfig.isOpen}
        title={reasonModalConfig.actionType === 'RETURN' ? 'Trả lại hồ sơ thu mua' : 'Từ chối hồ sơ thu mua'}
        actionType={reasonModalConfig.actionType}
        entityName={reasonModalConfig.entityCode}
        onClose={() =>
          setReasonModalConfig({ isOpen: false, actionType: 'RETURN', targetId: '', entityCode: '' })
        }
        onSubmit={handleSubmitReason}
      />

      {/* Evidence Viewer */}
      <EvidenceViewerModal
        isOpen={showEvidenceViewer}
        images={viewerImages}
        onClose={() => setShowEvidenceViewer(false)}
      />

      {/* Audit History Timeline Modal */}
      {selectedPurchase && (
        <AuditHistoryModal
          isOpen={showAuditModal}
          entityCode={selectedPurchase.code}
          logs={snapshot.auditLogs.filter(
            (l) => l.entityId === selectedPurchase.id || l.entityCode === selectedPurchase.code
          )}
          onClose={() => setShowAuditModal(false)}
        />
      )}
    </div>
  );
};
