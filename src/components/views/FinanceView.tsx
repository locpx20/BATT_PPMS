import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  CreditCard,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  X,
  Eye,
} from 'lucide-react';
import {
  User,
  SaleInvoice,
  ExpenseRecord,
  ExpenseCategory,
  EXPENSE_CATEGORY_NAMES,
  FinishedWarehouseType,
} from '../../types';
import { db } from '../../services/db';
import { Permissions } from '../../services/rbac';
import { MetricCard } from '../common/MetricCard';
import { StatusBadge } from '../common/StatusBadge';
import { ReasonModal } from '../common/ReasonModal';
import { EvidenceUpload } from '../common/EvidenceUpload';
import { showToast } from '../common/Toast';

interface FinanceViewProps {
  currentUser: User;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ currentUser }) => {
  const snapshot = db.getSnapshot();
  const invoices = snapshot.saleInvoices;
  const expenses = snapshot.expenseRecords;

  const [activeTab, setActiveTab] = useState<'REVENUE_INVOICES' | 'EXPENSES' | 'SUMMARY'>(
    'REVENUE_INVOICES'
  );

  // Financial KPI calculations
  const revenueWarehouseA = invoices
    .filter((inv) => inv.warehouseType === 'KHO_A')
    .reduce((sum, inv) => sum + inv.totalAmountVnd, 0);

  const revenueWarehouseB = invoices
    .filter((inv) => inv.warehouseType === 'KHO_B')
    .reduce((sum, inv) => sum + inv.totalAmountVnd, 0);

  const totalRevenue = revenueWarehouseA + revenueWarehouseB;

  const totalReceivables = invoices.reduce(
    (sum, inv) => sum + inv.remainingAmountVnd,
    0
  );

  const totalExpenses = expenses
    .filter((exp) => exp.status === 'PAID' || exp.status === 'APPROVED')
    .reduce((sum, exp) => sum + exp.amountVnd, 0);

  // Payment Recording Modal
  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentError, setPaymentError] = useState('');

  // Create Expense Proposal Modal
  const [showCreateExpenseModal, setShowCreateExpenseModal] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('FUEL_OIL');
  const [expenseAmount, setExpenseAmount] = useState<number>(5000000);
  const [expenseVendor, setExpenseVendor] = useState('');
  const [expenseReceiptImg, setExpenseReceiptImg] = useState<string | undefined>();
  const [expenseError, setExpenseError] = useState('');

  // Reject Expense Modal
  const [rejectExpenseModal, setRejectExpenseModal] = useState<{
    isOpen: boolean;
    expense: ExpenseRecord | null;
  }>({ isOpen: false, expense: null });

  // Handlers
  const handleOpenPayment = (inv: SaleInvoice) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.remainingAmountVnd);
    setPaymentNotes('Chuyển khoản thanh toán đợt');
    setPaymentError('');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    if (paymentAmount <= 0) {
      setPaymentError('Số tiền thanh toán phải lớn hơn 0');
      return;
    }
    if (paymentAmount > selectedInvoice.remainingAmountVnd) {
      setPaymentError('Số tiền thanh toán không được vượt quá số nợ còn lại');
      return;
    }

    const res = db.recordCustomerPayment(
      selectedInvoice.id,
      paymentAmount,
      paymentNotes,
      currentUser
    );

    if (res.success) {
      showToast(
        'success',
        'Ghi nhận thanh toán thành công',
        `Đã thu ${paymentAmount.toLocaleString('vi-VN')} VND cho hóa đơn ${selectedInvoice.code}`
      );
      setSelectedInvoice(null);
    } else {
      setPaymentError(res.error || 'Lỗi khi ghi nhận thanh toán');
    }
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim()) {
      setExpenseError('Vui lòng nhập nội dung chi phí');
      return;
    }
    if (expenseAmount <= 0) {
      setExpenseError('Số tiền chi phí phải lớn hơn 0');
      return;
    }

    const res = db.createExpenseProposal({
      expenseDate: new Date().toISOString().split('T')[0],
      category: expenseCategory,
      title: expenseTitle.trim(),
      amountVnd: expenseAmount,
      recipientOrVendor: expenseVendor.trim() || 'Nhà cung ứng dịch vụ',
      receiptImageUrl: expenseReceiptImg,
      user: currentUser,
    });

    if (res.success) {
      const msg =
        currentUser.role === 'O'
          ? 'Chi phí đã được duyệt trực tiếp (Owner thẩm quyền)'
          : 'Đề xuất chi phí đã chuyển Owner phê duyệt';
      showToast('success', 'Tạo đề xuất chi phí thành công', msg);
      setShowCreateExpenseModal(false);
      setExpenseTitle('');
      setExpenseVendor('');
      setExpenseReceiptImg(undefined);
    } else {
      setExpenseError(res.error || 'Lỗi khi tạo đề xuất chi phí');
    }
  };

  const handleApproveExpense = (exp: ExpenseRecord) => {
    const res = db.decideExpense({
      expenseId: exp.id,
      decision: 'APPROVE',
      user: currentUser,
    });
    if (res.success) {
      showToast('success', 'Đã duyệt chi phí', `${exp.title} - ${exp.amountVnd.toLocaleString('vi-VN')} VND`);
    } else {
      showToast('error', 'Lỗi', res.error);
    }
  };

  const handleConfirmRejectExpense = (reason: string) => {
    if (!rejectExpenseModal.expense) return;
    const res = db.decideExpense({
      expenseId: rejectExpenseModal.expense.id,
      decision: 'REJECT',
      reason,
      user: currentUser,
    });
    if (res.success) {
      showToast('error', 'Đã từ chối chi phí', rejectExpenseModal.expense.code);
      setRejectExpenseModal({ isOpen: false, expense: null });
    } else {
      showToast('error', 'Lỗi', res.error);
    }
  };

  const handlePayExpense = (exp: ExpenseRecord) => {
    const res = db.recordExpensePayment(exp.id, currentUser);
    if (res.success) {
      showToast('success', 'Đã chi tiền thành công', `Đã thanh toán ${exp.amountVnd.toLocaleString('vi-VN')} VND`);
    } else {
      showToast('error', 'Lỗi', res.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Tài chính &amp; Doanh thu</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý doanh thu xuất xưởng Kho A &amp; Kho B, theo dõi công nợ khách hàng và kiểm soát chi phí vận hành
          </p>
        </div>

        {Permissions.canProposeExpense(currentUser.role) && (
          <button
            type="button"
            onClick={() => {
              setExpenseError('');
              setShowCreateExpenseModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Đề xuất chi phí vận hành
          </button>
        )}
      </div>

      {/* Top Banner Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <MetricCard
          title="Doanh thu Kho A (Xuất khẩu)"
          value={(revenueWarehouseA / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
          unit="Tr.đ"
          iconName="DollarSign"
          color="indigo"
          subtext="Viên nén Grade A ENplus"
        />
        <MetricCard
          title="Doanh thu Kho B (Công nghiệp)"
          value={(revenueWarehouseB / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
          unit="Tr.đ"
          iconName="TrendingUp"
          color="sky"
          subtext="Viên nén Grade B tiêu thụ nội địa"
        />
        <MetricCard
          title="Tổng Doanh thu Bán hàng"
          value={(totalRevenue / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
          unit="Tr.đ"
          iconName="Receipt"
          color="emerald"
          subtext="Tổng giá trị xuất xưởng đã chốt"
        />
        <MetricCard
          title="Công nợ Phải thu (Khách)"
          value={(totalReceivables / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
          unit="Tr.đ"
          iconName="Clock"
          color="amber"
          subtext="Số tiền khách hàng còn nợ"
        />
        <MetricCard
          title="Chi phí Vận hành (Đã chi)"
          value={(totalExpenses / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
          unit="Tr.đ"
          iconName="CreditCard"
          color="rose"
          subtext="Xăng dầu, bảo trì & sửa chữa"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('REVENUE_INVOICES')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === 'REVENUE_INVOICES'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          1. Doanh thu &amp; Hóa đơn Xuất hàng ({invoices.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('EXPENSES')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === 'EXPENSES'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          2. Chi phí Vận hành &amp; Duyệt chi ({expenses.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('SUMMARY')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === 'SUMMARY'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          3. Sổ Tổng hợp Thu — Chi — Biên lợi nhuận
        </button>
      </div>

      {/* TAB 1: REVENUE & SALE INVOICES */}
      {activeTab === 'REVENUE_INVOICES' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
              Hóa đơn Bán hàng &amp; Theo dõi Thu hồi Công nợ
            </h3>
            <span className="text-xs text-slate-500">Tự động phát hành khi Thủ kho xác nhận xuất xưởng</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Mã Hóa đơn</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Kho xuất</th>
                  <th className="py-3 px-4 text-right">Khối lượng</th>
                  <th className="py-3 px-4 text-right">Đơn giá bán</th>
                  <th className="py-3 px-4 text-right">Tổng thanh toán</th>
                  <th className="py-3 px-4 text-right">Đã thu</th>
                  <th className="py-3 px-4 text-right">Còn nợ</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      Chưa có hóa đơn bán hàng nào phát sinh
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">{inv.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{inv.customerName}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {inv.warehouseType === 'KHO_A' ? 'Kho A (Xuất khẩu)' : 'Kho B (Công nghiệp)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {inv.dispatchedQuantityKg.toLocaleString('vi-VN')} kg
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {inv.unitPriceVnd.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {inv.totalAmountVnd.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {inv.paidAmountVnd.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-700">
                        {inv.remainingAmountVnd.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={inv.paymentStatus} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        {inv.remainingAmountVnd > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleOpenPayment(inv)}
                            className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            Thu tiền
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-semibold text-[11px]">Đã tất toán</span>
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

      {/* TAB 2: OPERATING EXPENSES */}
      {activeTab === 'EXPENSES' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
              Sổ Chi phí Vận hành Nhà máy &amp; Phê duyệt Chi
            </h3>
            <span className="text-xs text-slate-500">Bao gồm xăng dầu xe múc, phụ tùng bảo trì và dịch vụ sửa chữa</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Mã chi phí</th>
                  <th className="py-3 px-4">Ngày chi</th>
                  <th className="py-3 px-4">Hạng mục</th>
                  <th className="py-3 px-4">Nội dung chi phí</th>
                  <th className="py-3 px-4">Đối tác / Nhà cung cấp</th>
                  <th className="py-3 px-4 text-right">Số tiền (VND)</th>
                  <th className="py-3 px-4">Người đề xuất</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Chưa có bản ghi chi phí nào
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => {
                    const canOwnerApprove =
                      exp.status === 'PENDING_APPROVAL' && currentUser.role === 'O';
                    const canPay =
                      exp.status === 'APPROVED' && (currentUser.role === 'O' || currentUser.role === 'M');

                    return (
                      <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{exp.code}</td>
                        <td className="py-3 px-4">{exp.expenseDate}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {EXPENSE_CATEGORY_NAMES[exp.category]}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{exp.title}</td>
                        <td className="py-3 px-4">{exp.recipientOrVendor}</td>
                        <td className="py-3 px-4 text-right font-bold text-rose-700 text-sm">
                          {exp.amountVnd.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-4">{exp.createdByName}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={exp.status} size="sm" />
                          {exp.status === 'REJECTED' && exp.rejectionReason && (
                            <span className="block text-[10px] text-rose-600 mt-0.5">
                              Lý do: {exp.rejectionReason}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {canOwnerApprove && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApproveExpense(exp)}
                                  className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                                >
                                  Duyệt chi
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectExpenseModal({ isOpen: true, expense: exp })}
                                  className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs cursor-pointer"
                                >
                                  Từ chối
                                </button>
                              </>
                            )}

                            {canPay && (
                              <button
                                type="button"
                                onClick={() => handlePayExpense(exp)}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                              >
                                Chi tiền
                              </button>
                            )}

                            {exp.status === 'PAID' && (
                              <span className="text-[11px] font-semibold text-emerald-700">Đã thanh toán</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FINANCIAL SUMMARY */}
      {activeTab === 'SUMMARY' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-3 uppercase tracking-wider">
              Bảng Tổng hợp Cân đối Tài chính Nhà máy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100">
                <span className="text-xs font-semibold text-indigo-700 block">Doanh thu Thuần Thực tế</span>
                <span className="text-2xl font-bold text-indigo-950 block mt-1">
                  {totalRevenue.toLocaleString('vi-VN')} VND
                </span>
                <p className="text-[11px] text-slate-500 mt-2">
                  Kho A: {revenueWarehouseA.toLocaleString('vi-VN')} VND • Kho B: {revenueWarehouseB.toLocaleString('vi-VN')} VND
                </p>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100">
                <span className="text-xs font-semibold text-rose-700 block">Tổng Chi phí Vận hành</span>
                <span className="text-2xl font-bold text-rose-950 block mt-1">
                  {totalExpenses.toLocaleString('vi-VN')} VND
                </span>
                <p className="text-[11px] text-slate-500 mt-2">
                  Bao gồm xăng dầu, vật tư bảo trì máy và chi phí xưởng
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-xs font-semibold text-emerald-700 block">Chênh lệch Thu - Chi Vận hành</span>
                <span className="text-2xl font-bold text-emerald-950 block mt-1">
                  {(totalRevenue - totalExpenses).toLocaleString('vi-VN')} VND
                </span>
                <p className="text-[11px] text-slate-500 mt-2">
                  Tỷ suất lợi nhuận gộp ước tính: {totalRevenue > 0 ? (((totalRevenue - totalExpenses) / totalRevenue) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECORD CUSTOMER PAYMENT MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Ghi nhận Thu tiền Khách hàng</h3>
                <p className="text-xs text-indigo-700 font-mono font-semibold">{selectedInvoice.code}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Khách hàng:</span>
                  <span className="font-bold text-slate-900">{selectedInvoice.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tổng hóa đơn:</span>
                  <span className="font-bold text-slate-900">{selectedInvoice.totalAmountVnd.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Đã thanh toán:</span>
                  <span className="font-bold text-emerald-700">{selectedInvoice.paidAmountVnd.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Số tiền còn nợ:</span>
                  <span className="font-bold text-rose-700">{selectedInvoice.remainingAmountVnd.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Số tiền thực thu đợt này (VND) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedInvoice.remainingAmountVnd}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full text-base font-bold border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ghi chú chứng từ thanh toán
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="UNC ngân hàng số, phiếu thu..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {paymentError && <p className="text-xs text-rose-600 font-medium">{paymentError}</p>}

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
                >
                  Xác nhận Thu tiền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE EXPENSE PROPOSAL MODAL */}
      {showCreateExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <h3 className="font-bold text-slate-900 text-sm">Đề xuất Chi phí Vận hành Mới</h3>
              <button
                onClick={() => setShowCreateExpenseModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hạng mục chi phí <span className="text-rose-500">*</span>
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-indigo-500"
                >
                  {(Object.keys(EXPENSE_CATEGORY_NAMES) as ExpenseCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {EXPENSE_CATEGORY_NAMES[cat]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nội dung chi phí <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="Ví dụ: Đổ dầu DO cho xe múc số 02, Sửa bơm dầu thủy lực..."
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Số tiền đề xuất (VND) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1000"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="w-full text-sm font-bold border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Đơn vị nhận / Cửa hàng
                  </label>
                  <input
                    type="text"
                    value={expenseVendor}
                    onChange={(e) => setExpenseVendor(e.target.value)}
                    placeholder="Cửa hàng xăng dầu Petrolimex..."
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <EvidenceUpload
                label="Hóa đơn / Phiếu xuất / Biên nhận chứng từ"
                value={expenseReceiptImg}
                onChange={setExpenseReceiptImg}
              />

              {currentUser.role === 'O' && (
                <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900">
                  <span className="font-bold">Đặc quyền Owner: </span>
                  Khoản chi này sẽ được phê duyệt tự động ngay khi lưu (không cần tự duyệt lại).
                </div>
              )}

              {expenseError && <p className="text-xs text-rose-600 font-medium">{expenseError}</p>}

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateExpenseModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
                >
                  Xác nhận Tạo đề xuất
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT EXPENSE MODAL */}
      {rejectExpenseModal.expense && (
        <ReasonModal
          isOpen={rejectExpenseModal.isOpen}
          title="Từ chối Đề xuất Chi phí"
          actionType="REJECT"
          entityName={rejectExpenseModal.expense.code}
          onClose={() => setRejectExpenseModal({ isOpen: false, expense: null })}
          onSubmit={handleConfirmRejectExpense}
        />
      )}
    </div>
  );
};
