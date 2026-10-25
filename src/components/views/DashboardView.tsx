import React from 'react';
import {
  TrendingUp,
  Package,
  Boxes,
  Truck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Shield,
  Layers,
  ShoppingBag,
  Wrench,
} from 'lucide-react';
import { User } from '../../types';
import { db } from '../../services/db';
import { MetricCard } from '../common/MetricCard';
import { StatusBadge } from '../common/StatusBadge';
import { NavItemKey } from '../../services/rbac';

interface DashboardViewProps {
  currentUser: User;
  onNavigate: (view: NavItemKey) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ currentUser, onNavigate }) => {
  const snapshot = db.getSnapshot();
  const role = currentUser.role;

  // Real data calculations
  const totalPurchasedKg = snapshot.purchases
    .filter((p) => p.status === 'RECEIVED')
    .reduce((acc, p) => acc + (p.receivedQuantityKg || 0), 0);

  const pendingPurchaseApprovals = snapshot.purchases.filter((p) => p.status === 'SUBMITTED').length;
  const pendingWarehousePurchases = snapshot.purchases.filter((p) => p.status === 'APPROVED').length;
  const returnedPurchases = snapshot.purchases.filter(
    (p) => p.status === 'RETURNED' && (role !== 'PS' || p.assignedStaffId === currentUser.id)
  ).length;

  const inProgressPlans = snapshot.productionPlans.filter((p) => p.status === 'IN_PROGRESS').length;
  const pendingShiftReports = snapshot.shiftReports.filter((r) => r.status === 'SUBMITTED').length;

  const pendingQcLots = snapshot.lots.filter((l) => l.qcStatus === 'PENDING' || l.qcStatus === 'IN_TESTING').length;
  const passedLots = snapshot.lots.filter((l) => l.qcStatus === 'QC_COMPLETED').length;

  const pendingOutboundApprovals = snapshot.outboundProposals.filter(
    (o) => o.status === 'PENDING_OWNER_APPROVAL'
  ).length;
  const pendingOutboundDispatches = snapshot.outboundProposals.filter(
    (o) => o.status === 'APPROVED' && !o.isDispatched
  ).length;

  const activeFailures = snapshot.failures.filter(
    (f) => f.status === 'REPORTED' || f.status === 'ASSIGNED' || f.status === 'UNDER_REPAIR'
  ).length;

  // Active Users count for Admin
  const totalUsers = snapshot.users.length;
  const activeUsers = snapshot.users.filter((u) => u.isActive).length;
  const lockedUsers = snapshot.users.filter((u) => !u.isActive).length;

  return (
    <div className="space-y-6">
      {/* 1. Header with Role Focus */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Tổng quan Vận hành</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu sản xuất thời gian thực — CÔNG TY CỔ PHẦN NĂNG LƯỢNG TÁI TẠO BATT
          </p>
        </div>
      </div>

      {/* 2. ADMIN ISOLATED DASHBOARD */}
      {role === 'A' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              title="Tổng số Tài khoản"
              value={totalUsers}
              iconName="Users"
              color="indigo"
              subtext="Tất cả các tài khoản hệ thống"
            />
            <MetricCard
              title="Tài khoản Hoạt động"
              value={activeUsers}
              iconName="CheckCircle2"
              color="emerald"
              subtext="Đang hoạt động bình thường"
            />
            <MetricCard
              title="Tài khoản Tạm khóa"
              value={lockedUsers}
              iconName="Shield"
              color={lockedUsers > 0 ? 'rose' : 'slate'}
              subtext="Bị vô hiệu hóa truy cập"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-slate-800">Nhật ký Quản trị Người dùng Gần đây</h3>
              <button
                onClick={() => onNavigate('audit-logs')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
              >
                Xem toàn bộ nhật ký →
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {snapshot.auditLogs
                .filter((l) => l.entityType === 'USER')
                .slice(0, 5)
                .map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">{log.action}</span>
                      <p className="text-slate-500 mt-0.5">{log.details}</p>
                    </div>
                    <span className="text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        /* 3. OPERATIONAL ROLE DASHBOARDS (O, M, PS, WS, S, QC, MS) */
        <div className="space-y-6">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Tồn kho Nguyên liệu"
              value={(snapshot.rawInventoryBalanceKg / 1000).toLocaleString('vi-VN', {
                maximumFractionDigits: 1,
              })}
              unit="Tấn"
              iconName="Boxes"
              color="indigo"
              subtext="Mùn cưa, dăm bào trong bãi"
            />
            <MetricCard
              title="Tồn kho Thành phẩm"
              value={((snapshot.finishedInventoryWarehouseA_Kg + snapshot.finishedInventoryWarehouseB_Kg) / 1000).toLocaleString('vi-VN', {
                maximumFractionDigits: 1,
              })}
              unit="Tấn"
              iconName="Package"
              color="emerald"
              subtext={`Kho A: ${(snapshot.finishedInventoryWarehouseA_Kg / 1000).toFixed(1)}T • Kho B: ${(snapshot.finishedInventoryWarehouseB_Kg / 1000).toFixed(1)}T`}
            />
            {(role === 'O' || role === 'M') ? (
              <MetricCard
                title="Doanh thu Xuất hàng"
                value={(
                  snapshot.saleInvoices.reduce((sum, inv) => sum + inv.totalAmountVnd, 0) / 1_000_000
                ).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
                unit="Tr.đ"
                iconName="TrendingUp"
                color="sky"
                subtext={`Công nợ còn: ${(snapshot.saleInvoices.reduce((sum, inv) => sum + inv.remainingAmountVnd, 0) / 1_000_000).toFixed(1)} Tr`}
              />
            ) : (
              <MetricCard
                title="Kế hoạch Đang chạy"
                value={inProgressPlans}
                unit="Kế hoạch"
                iconName="Layers"
                color="sky"
                subtext="Các dây chuyền băm, sấy, ép"
              />
            )}
            <MetricCard
              title="Sự cố Máy móc"
              value={activeFailures}
              unit="Máy"
              iconName="AlertTriangle"
              color={activeFailures > 0 ? 'rose' : 'slate'}
              subtext="Cần xử lý hoặc đang sửa"
            />
          </div>

          {/* Action-Oriented Queue Sections for Specific Roles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Queue: Pending Approvals & Immediate Tasks */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-amber-50 text-amber-600">
                    <Clock className="w-4 h-4" />
                  </span>
                  <h3 className="font-semibold text-sm text-slate-800">
                    {role === 'O' || role === 'M' ? 'Hồ sơ Cần xem xét & Phê duyệt' : 'Công việc Cần xử lý'}
                  </h3>
                </div>
              </div>

              <div className="space-y-3">
                {/* Purchasing Submitted queue */}
                {(role === 'O' || role === 'M') && pendingPurchaseApprovals > 0 && (
                  <div
                    onClick={() => onNavigate('purchasing')}
                    className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/80 hover:bg-amber-100/50 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-amber-900">
                        {pendingPurchaseApprovals} Phiếu thu mua đã cân chờ duyệt
                      </p>
                      <p className="text-[11px] text-amber-700">Cần kiểm tra phiếu cân và duyệt đơn giá</p>
                    </div>
                    <span className="text-xs font-semibold text-amber-800">Xem ngay →</span>
                  </div>
                )}

                {/* Shift Reports queue */}
                {(role === 'O' || role === 'M') && pendingShiftReports > 0 && (
                  <div
                    onClick={() => onNavigate('shift-report')}
                    className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-200/80 hover:bg-indigo-100/50 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-indigo-900">
                        {pendingShiftReports} Báo cáo ca sản xuất chờ duyệt
                      </p>
                      <p className="text-[11px] text-indigo-700">Duyệt sản lượng để phát hành mã LOT cho KCS</p>
                    </div>
                    <span className="text-xs font-semibold text-indigo-800">Xem ngay →</span>
                  </div>
                )}

                {/* Outbound proposals queue for Owner */}
                {role === 'O' && pendingOutboundApprovals > 0 && (
                  <div
                    onClick={() => onNavigate('outbound')}
                    className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/80 hover:bg-emerald-100/50 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-emerald-900">
                        {pendingOutboundApprovals} Đề xuất xuất hàng chờ Owner quyết định
                      </p>
                      <p className="text-[11px] text-emerald-700">Quyết định giá bán và duyệt xuất hàng cho đối tác</p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-800">Quyết định →</span>
                  </div>
                )}

                {/* Returned Records Alert */}
                {returnedPurchases > 0 && (
                  <div
                    onClick={() => onNavigate('purchasing')}
                    className="p-3 rounded-lg bg-orange-50/60 border border-orange-200/80 hover:bg-orange-100/50 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-orange-900">
                        {returnedPurchases} Hồ sơ thu mua bị trả lại
                      </p>
                      <p className="text-[11px] text-orange-700">Cần chỉnh sửa trên cùng mã hồ sơ theo yêu cầu</p>
                    </div>
                    <span className="text-xs font-semibold text-orange-800">Chỉnh sửa →</span>
                  </div>
                )}

                {/* Warehouse pending raw receipts */}
                {role === 'WS' && pendingWarehousePurchases > 0 && (
                  <div
                    onClick={() => onNavigate('raw-inventory')}
                    className="p-3 rounded-lg bg-teal-50/60 border border-teal-200/80 hover:bg-teal-100/50 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-teal-900">
                        {pendingWarehousePurchases} Xe hàng đã duyệt chờ cân nhập kho
                      </p>
                      <p className="text-[11px] text-teal-700">Tiếp nhận và xác nhận khối lượng thực nhập</p>
                    </div>
                    <span className="text-xs font-semibold text-teal-800">Nhập kho →</span>
                  </div>
                )}

                {/* QC pending lots */}
                {role === 'QC' && pendingQcLots > 0 && (
                  <div
                    onClick={() => onNavigate('qc')}
                    className="p-3 rounded-lg bg-sky-50/60 border border-sky-200/80 hover:bg-sky-100/50 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-sky-900">
                        {pendingQcLots} Lô hàng đang chờ kiểm tra 3 lần độc lập
                      </p>
                      <p className="text-[11px] text-sky-700">Đo độ ẩm, độ tro và phân loại Grade A/B</p>
                    </div>
                    <span className="text-xs font-semibold text-sky-800">Kiểm tra →</span>
                  </div>
                )}

                {/* Empty Queue state */}
                {pendingPurchaseApprovals === 0 &&
                  pendingShiftReports === 0 &&
                  pendingOutboundApprovals === 0 &&
                  returnedPurchases === 0 && (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Không có công việc nào đang chờ duyệt tại thời điểm này
                    </div>
                  )}
              </div>
            </div>

            {/* Right: Real-time Stock Movements / Recent Operations */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-indigo-50 text-indigo-600">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                  <h3 className="font-semibold text-sm text-slate-800">Giao dịch Kho Vật lý Gần nhất</h3>
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {snapshot.stockMovements.slice(0, 5).map((sm) => (
                  <div key={sm.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${
                            sm.movementType === 'IN' ? 'text-emerald-700' : 'text-slate-900'
                          }`}
                        >
                          {sm.movementType === 'IN' ? 'Nhập kho (+)' : 'Xuất kho (-)'}{' '}
                          {sm.quantityKg.toLocaleString('vi-VN')} kg
                        </span>
                        <span className="px-1.5 py-0.2 rounded-sm bg-slate-100 text-[10px] font-mono text-slate-600">
                          {sm.referenceDocumentCode}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{sm.notes}</p>
                      <span className="text-[10px] text-slate-400 font-medium">Thực hiện: {sm.confirmedByName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(sm.timestamp).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
