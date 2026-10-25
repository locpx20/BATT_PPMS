import React, { useState } from 'react';
import { Boxes, Plus, CheckCircle2, ArrowDownRight, ArrowUpRight, AlertTriangle, FileText, X } from 'lucide-react';
import { User, PurchaseAssignment, ProductionPlan } from '../../types';
import { db } from '../../services/db';
import { Permissions } from '../../services/rbac';
import { MetricCard } from '../common/MetricCard';
import { StatusBadge } from '../common/StatusBadge';
import { showToast } from '../common/Toast';
import { Pagination } from '../common/Pagination';

interface RawInventoryViewProps {
  currentUser: User;
}

export const RawInventoryView: React.FC<RawInventoryViewProps> = ({ currentUser }) => {
  const snapshot = db.getSnapshot();
  const rawBalance = snapshot.rawInventoryBalanceKg;
  const approvedPurchases = snapshot.purchases.filter((p) => p.status === 'APPROVED');
  const plans = snapshot.productionPlans.filter(
    (p) => p.status === 'PLANNED' || p.status === 'IN_PROGRESS'
  );
  const rawMovements = snapshot.stockMovements.filter((m) => m.materialCategory === 'RAW_MATERIAL');

  const [activeTab, setActiveTab] = useState<'RECEIVE_PURCHASE' | 'ISSUE_MATERIAL' | 'LEDGER'>(
    'RECEIVE_PURCHASE'
  );

  // Receive Modal
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseAssignment | null>(null);
  const [receivedQuantityKg, setReceivedQuantityKg] = useState<number>(0);
  const [warehouseNotes, setWarehouseNotes] = useState('');
  const [discrepancyReason, setDiscrepancyReason] = useState('');
  const [receiveError, setReceiveError] = useState('');

  // Issue Modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issuePlanId, setIssuePlanId] = useState(plans[0]?.id || '');
  const [rawMaterialType, setRawMaterialType] = useState('Mùn cưa keo tràm');
  const [issuedQuantityKg, setIssuedQuantityKg] = useState<number>(20000);
  const [recipientDepartment, setRecipientDepartment] = useState('Tổ Vận hành Lò Sấy & Ép Viên');
  const [issueNotes, setIssueNotes] = useState('');
  const [issueError, setIssueError] = useState('');

  // Pagination for Ledger
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const paginatedMovements = rawMovements.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenReceive = (p: PurchaseAssignment) => {
    setSelectedPurchase(p);
    setReceivedQuantityKg(p.weighedQuantityKg || p.plannedQuantityKg);
    setWarehouseNotes('');
    setDiscrepancyReason('');
    setReceiveError('');
  };

  const handleConfirmReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchase) return;

    const res = db.receiveRawMaterialIntoWarehouse({
      assignmentId: selectedPurchase.id,
      receivedQuantityKg,
      warehouseNotes,
      discrepancyReason,
      user: currentUser,
    });

    if (res.success) {
      showToast(
        'success',
        'Nhập kho thành công',
        `Đã nhập ${receivedQuantityKg.toLocaleString('vi-VN')} kg ${selectedPurchase.rawMaterialType} vào bãi NVL`
      );
      setSelectedPurchase(null);
    } else {
      setReceiveError(res.error || 'Lỗi khi nhập kho');
    }
  };

  const handleConfirmIssue = (e: React.FormEvent) => {
    e.preventDefault();
    const res = db.issueRawMaterial({
      planId: issuePlanId,
      rawMaterialType,
      issuedQuantityKg,
      recipientDepartment,
      notes: issueNotes,
      user: currentUser,
    });

    if (res.success) {
      showToast(
        'success',
        'Cấp NVL thành công',
        `Đã xuất kho ${issuedQuantityKg.toLocaleString('vi-VN')} kg cho kế hoạch sản xuất`
      );
      setShowIssueModal(false);
    } else {
      setIssueError(res.error || 'Lỗi khi cấp NVL');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Tồn kho NVL Hiện hành"
          value={(rawBalance / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
          unit="Tấn"
          iconName="Boxes"
          color="indigo"
          subtext="Tổng mùn cưa và dăm bào thực tế"
        />
        <MetricCard
          title="Hàng mua Chờ nhận kho"
          value={approvedPurchases.length}
          unit="Phiếu"
          iconName="ArrowDownRight"
          color="amber"
          subtext="Đã duyệt, chờ cân kiểm và đổ bãi"
        />
        <MetricCard
          title="Kế hoạch Cần cấp NVL"
          value={plans.length}
          unit="Kế hoạch"
          iconName="ArrowUpRight"
          color="sky"
          subtext="Chờ cấp liệu vào phễu nạp"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('RECEIVE_PURCHASE')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === 'RECEIVE_PURCHASE'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          1. Tiếp nhận Hàng mua đã duyệt ({approvedPurchases.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ISSUE_MATERIAL')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === 'ISSUE_MATERIAL'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          2. Cấp phát NVL cho Sản xuất
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('LEDGER')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === 'LEDGER'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          3. Sổ thẻ kho NVL ({rawMovements.length})
        </button>
      </div>

      {/* TAB 1: RECEIVE PURCHASED MATERIALS */}
      {activeTab === 'RECEIVE_PURCHASE' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Danh sách Hồ sơ Thu mua đã phê duyệt — Chờ Thủ kho nhận hàng
            </h3>
            <span className="text-xs text-slate-500">Chỉ tăng tồn kho sau khi Thủ kho xác nhận vật lý</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Mã phiếu</th>
                  <th className="py-3 px-4">Nhà cung cấp</th>
                  <th className="py-3 px-4">Nguyên vật liệu</th>
                  <th className="py-3 px-4 text-right">Dự kiến</th>
                  <th className="py-3 px-4 text-right">Cân mua</th>
                  <th className="py-3 px-4">Người duyệt</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvedPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Không có hồ sơ thu mua nào đang chờ nhận kho
                    </td>
                  </tr>
                ) : (
                  approvedPurchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">{p.code}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{p.supplierName}</td>
                      <td className="py-3 px-4">{p.rawMaterialType}</td>
                      <td className="py-3 px-4 text-right">{p.plannedQuantityKg.toLocaleString('vi-VN')} kg</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {p.weighedQuantityKg?.toLocaleString('vi-VN')} kg
                      </td>
                      <td className="py-3 px-4">{p.approvedByName}</td>
                      <td className="py-3 px-4 text-center">
                        {Permissions.canReceiveRawMaterial(currentUser.role) ? (
                          <button
                            type="button"
                            onClick={() => handleOpenReceive(p)}
                            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            Xác nhận Nhập kho
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Chỉ Thủ kho được nhận</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ISSUE RAW MATERIAL */}
      {activeTab === 'ISSUE_MATERIAL' && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Cấp phát Nguyên vật liệu cho Kế hoạch Sản xuất
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kiểm tra tồn kho khả dụng trước khi xuất kho sang khu vực lò sấy / máy nghiền
              </p>
            </div>
            {Permissions.canIssueRawMaterial(currentUser.role) && (
              <button
                type="button"
                onClick={() => {
                  setIssuePlanId(plans[0]?.id || '');
                  setIssuedQuantityKg(20000);
                  setIssueNotes('');
                  setIssueError('');
                  setShowIssueModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tạo phiếu cấp NVL
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {plans.map((pl) => (
              <div key={pl.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{pl.code}</span>
                    <span className="font-semibold text-slate-800">{pl.productName}</span>
                    <StatusBadge status={pl.status} size="sm" />
                  </div>
                  <p className="text-slate-500 mt-1">
                    Ngày: {pl.productionDate} • Ca: {pl.shift} • Mục tiêu sản xuất:{' '}
                    {pl.targetQuantityKg.toLocaleString('vi-VN')} kg
                  </p>
                </div>
                {Permissions.canIssueRawMaterial(currentUser.role) && (
                  <button
                    type="button"
                    onClick={() => {
                      setIssuePlanId(pl.id);
                      setIssuedQuantityKg(pl.targetQuantityKg * 1.1); // suggest with 10% moisture buffer
                      setShowIssueModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold cursor-pointer"
                  >
                    Cấp vật tư cho kế hoạch này
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PHYSICAL STOCK LEDGER */}
      {activeTab === 'LEDGER' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Loại giao dịch</th>
                  <th className="py-3 px-4">Mã chứng từ gốc</th>
                  <th className="py-3 px-4">Nguyên vật liệu</th>
                  <th className="py-3 px-4 text-right">Số lượng (kg)</th>
                  <th className="py-3 px-4 text-right">Tồn sau giao dịch</th>
                  <th className="py-3 px-4">Thủ kho xác nhận</th>
                  <th className="py-3 px-4">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {new Date(m.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          m.movementType === 'IN' ? 'text-emerald-700' : 'text-slate-700'
                        }`}
                      >
                        {m.movementType === 'IN' ? '+ Nhập kho' : '- Xuất cấp'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{m.referenceDocumentCode}</td>
                    <td className="py-3 px-4">{m.materialName}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {m.quantityKg.toLocaleString('vi-VN')} kg
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-indigo-700">
                      {m.balanceAfterKg.toLocaleString('vi-VN')} kg
                    </td>
                    <td className="py-3 px-4">{m.confirmedByName}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate">{m.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalItems={rawMovements.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* RECEIVE MODAL (Warehouse Staff only) */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Xác nhận Nhập kho Nguyên liệu</h3>
                <p className="text-xs text-slate-500 font-mono">Phiếu: {selectedPurchase.code}</p>
              </div>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReceive} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Nhà cung cấp:</span>
                  <span className="font-semibold text-slate-800">{selectedPurchase.supplierName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Loại NVL:</span>
                  <span className="font-semibold text-slate-800">{selectedPurchase.rawMaterialType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Dự kiến ban đầu:</span>
                  <span className="font-medium text-slate-700">
                    {selectedPurchase.plannedQuantityKg.toLocaleString('vi-VN')} kg
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Cân mua thực tế:</span>
                  <span className="font-bold text-indigo-700">
                    {selectedPurchase.weighedQuantityKg?.toLocaleString('vi-VN')} kg
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Khối lượng thực nhận vào bãi kho (kg) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={receivedQuantityKg}
                  onChange={(e) => setReceivedQuantityKg(Number(e.target.value))}
                  className="w-full text-base font-bold text-slate-900 border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              {/* Discrepancy Alert */}
              {selectedPurchase.weighedQuantityKg &&
                Math.abs(receivedQuantityKg - selectedPurchase.weighedQuantityKg) > 100 && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>
                        Chênh lệch so với cân mua:{' '}
                        {Math.abs(receivedQuantityKg - selectedPurchase.weighedQuantityKg).toLocaleString('vi-VN')} kg
                      </span>
                    </div>
                    <label className="block font-semibold mt-1">Nguyên nhân chênh lệch (Bắt buộc nếu &gt; 5%):</label>
                    <input
                      type="text"
                      value={discrepancyReason}
                      onChange={(e) => setDiscrepancyReason(e.target.value)}
                      placeholder="Ví dụ: Rơi vãi lúc bốc dỡ xe ben, trừ bì tạp chất tại bãi..."
                      className="w-full text-xs border border-amber-300 rounded-md p-2 bg-white text-slate-800 focus:outline-hidden"
                    />
                  </div>
                )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ghi chú vị trí đổ bãi
                </label>
                <input
                  type="text"
                  value={warehouseNotes}
                  onChange={(e) => setWarehouseNotes(e.target.value)}
                  placeholder="Bãi chứa số 1, hố nạp lò sấy..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {receiveError && <p className="text-xs text-rose-600 font-medium">{receiveError}</p>}

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedPurchase(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Xác nhận Nhập kho vật lý
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ISSUE MATERIAL MODAL (Warehouse Staff) */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Cấp phát NVL cho Kế hoạch Sản xuất</h3>
              <button
                onClick={() => setShowIssueModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmIssue} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Chọn kế hoạch sản xuất <span className="text-rose-500">*</span>
                </label>
                <select
                  value={issuePlanId}
                  onChange={(e) => setIssuePlanId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-indigo-500"
                  required
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.productName} (Mục tiêu: {p.targetQuantityKg.toLocaleString('vi-VN')} kg)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Loại NVL cấp phát <span className="text-rose-500">*</span>
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
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Khối lượng cấp thực tế (kg) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={rawBalance}
                  value={issuedQuantityKg}
                  onChange={(e) => setIssuedQuantityKg(Number(e.target.value))}
                  className="w-full text-sm font-bold text-slate-900 border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Tồn kho khả dụng hiện tại: <span className="font-bold">{rawBalance.toLocaleString('vi-VN')} kg</span>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Bộ phận tiếp nhận <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={recipientDepartment}
                  onChange={(e) => setRecipientDepartment(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ghi chú cấp liệu
                </label>
                <input
                  type="text"
                  value={issueNotes}
                  onChange={(e) => setIssueNotes(e.target.value)}
                  placeholder="Cấp vào phễu băm / sấy..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {issueError && <p className="text-xs text-rose-600 font-medium">{issueError}</p>}

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Xác nhận Cấp NVL (Trừ kho)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
