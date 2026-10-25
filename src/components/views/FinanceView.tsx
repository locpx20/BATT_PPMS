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
  Filter,
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
import { formatVND, formatNumberVN } from '../../utils/formatters';

interface FinanceViewProps {
  currentUser: User;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ currentUser }) => {
  const snapshot = db.getSnapshot();
  const invoices = snapshot.saleInvoices;
  const expenses = snapshot.expenseRecords;
  const purchases = snapshot.purchases;
  const suppliers = snapshot.suppliers;

  const [activeTab, setActiveTab] = useState<'REVENUE_INVOICES' | 'EXPENSES' | 'SUMMARY'>(
    'REVENUE_INVOICES'
  );

  // Date filter
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Financial KPI calculations
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmountVnd, 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + inv.paidAmountVnd, 0);
  const totalReceivables = invoices.reduce((sum, inv) => sum + inv.remainingAmountVnd, 0);

  // Payables to Suppliers (purchases received minus already recorded payments)
  const totalPurchasedValue = purchases
    .filter((p) => p.status === 'RECEIVED')
    .reduce((sum, p) => sum + (p.totalAmountVnd || 0), 0);
  const totalPaidToSuppliers = suppliers.reduce((sum, s) => sum + (s.totalPaidVnd || 0), 0);
  const totalPayables = Math.max(0, totalPurchasedValue - totalPaidToSuppliers);

  // Expenses Breakdown
  const totalExpenses = expenses
    .filter((exp) => exp.status === 'PAID' || exp.status === 'APPROVED')
    .reduce((sum, exp) => sum + exp.amountVnd, 0);

  const partsExpenses = expenses
    .filter((exp) => exp.category === 'MAINTENANCE_PARTS' && (exp.status === 'PAID' || exp.status === 'APPROVED'))
    .reduce((sum, exp) => sum + exp.amountVnd, 0);

  const fuelExpenses = expenses
    .filter((exp) => exp.category === 'FUEL_OIL' && (exp.status === 'PAID' || exp.status === 'APPROVED'))
    .reduce((sum, exp) => sum + exp.amountVnd, 0);

  const repairExpenses = expenses
    .filter((exp) => exp.category === 'MACHINE_REPAIR' && (exp.status === 'PAID' || exp.status === 'APPROVED'))
    .reduce((sum, exp) => sum + exp.amountVnd, 0);

  const pendingExpenseApprovals = expenses.filter((exp) => exp.status === 'PENDING_APPROVAL').length;
  const unpaidInvoicesCount = invoices.filter((inv) => inv.paymentStatus !== 'PAID').length;
  const pendingActionsCount = pendingExpenseApprovals + unpaidInvoicesCount;

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

  // Filtered lists
  const filteredInvoices = invoices.filter((inv) => {
    if (filterStartDate && inv.invoiceDate < filterStartDate) return false;
    if (filterEndDate && inv.invoiceDate > filterEndDate) return false;
    return true;
  });

  const filteredExpenses = expenses.filter((exp) => {
    if (filterStartDate && exp.expenseDate < filterStartDate) return false;
    if (filterEndDate && exp.expenseDate > filterEndDate) return false;
    return true;
  });

  // Handlers
  const handleOpenPayment = (inv: SaleInvoice) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.remainingAmountVnd);
    setPaymentNotes('Chuyển khoản thanh toán theo đối soát');
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
        `Đã thu ${formatVND(paymentAmount)} cho hóa đơn ${selectedInvoice.code}`
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
      showToast('success', 'Đã duyệt chi phí', `Khoản chi ${exp.code} đã được duyệt thanh toán`);
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
      showToast('error', 'Đã từ chối chi phí', `Lý do: ${reason}`);
      setRejectExpenseModal({ isOpen: false, expense: null });
    }
  };

  const handleConfirmPayExpense = (exp: ExpenseRecord) => {
    const res = db.recordExpensePayment(exp.id, currentUser);
    if (res.success) {
      showToast('success', 'Xác nhận thanh toán', `Đã chi ${formatVND(exp.amountVnd)}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Tài chính & Doanh thu Doanh nghiệp</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị dòng tiền, hóa đơn bán hàng Kho A/B, công nợ đối tác và kiểm soát chi phí vận hành
          </p>
        </div>

        <div className="flex items-center gap-2">
          {Permissions.canProposeExpense(currentUser.role) && (
            <button
              type="button"
              onClick={() => {
                setExpenseError('');
                setShowCreateExpenseModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tạo đề xuất chi phí
            </button>
          )}
        </div>
      </div>

      {/* 2. Enterprise Financial KPIs - Standard Vietnamese Format */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Doanh thu */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Doanh thu xuất xưởng</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900 tracking-tight">{formatVND(totalRevenue)}</div>
            <p className="text-[11px] text-slate-400 mt-1">Tổng giá trị đơn hàng đã giao</p>
          </div>
        </div>

        {/* Tiền đã thu */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Tiền đã thu</span>
            <span className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl font-extrabold text-teal-700 tracking-tight">{formatVND(totalCollected)}</div>
            <p className="text-[11px] text-slate-400 mt-1">Đã vào tài khoản công ty</p>
          </div>
        </div>

        {/* Công nợ phải thu */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Công nợ phải thu</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl font-extrabold text-amber-700 tracking-tight">{formatVND(totalReceivables)}</div>
            <p className="text-[11px] text-slate-400 mt-1">Khách hàng chưa thanh toán</p>
          </div>
        </div>

        {/* Công nợ phải trả */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Công nợ phải trả (NCC)</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl font-extrabold text-rose-700 tracking-tight">{formatVND(totalPayables)}</div>
            <p className="text-[11px] text-slate-400 mt-1">Tiền mua nguyên vật liệu còn nợ</p>
          </div>
        </div>

        {/* Tổng chi phí vận hành */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Tổng chi phí vận hành</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900 tracking-tight">{formatVND(totalExpenses)}</div>
            <p className="text-[11px] text-slate-400 mt-1">Xăng dầu, vật tư và bảo dưỡng</p>
          </div>
        </div>

        {/* Chi phí mua vật tư */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Chi phí mua vật tư</span>
            <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl font-extrabold text-sky-800 tracking-tight">{formatVND(partsExpenses)}</div>
            <p className="text-[11px] text-slate-400 mt-1">Vòng bi, phụ tùng cơ điện thay thế</p>
          </div>
        </div>

        {/* Chi phí xăng dầu */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Chi phí xăng dầu</span>
            <span className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl font-extrabold text-orange-800 tracking-tight">{formatVND(fuelExpenses)}</div>
            <p className="text-[11px] text-slate-400 mt-1">Dầu xe xúc lật và lò sấy</p>
          </div>
        </div>

        {/* Các khoản cần xử lý */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Khoản cần xử lý</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl font-extrabold text-purple-800 tracking-tight">
              {pendingActionsCount} khoản
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {pendingExpenseApprovals} chi phí chờ duyệt • {unpaidInvoicesCount} hóa đơn nợ
            </p>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('REVENUE_INVOICES')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'REVENUE_INVOICES'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Hóa đơn Bán hàng ({invoices.length})
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
            Sổ Chi phí Vận hành ({expenses.length})
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
            Sổ Tổng hợp Dòng tiền
          </button>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-2 py-1 text-slate-700 bg-white"
            placeholder="Từ ngày"
          />
          <span className="text-slate-400">đến</span>
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-2 py-1 text-slate-700 bg-white"
            placeholder="Đến ngày"
          />
          {(filterStartDate || filterEndDate) && (
            <button
              type="button"
              onClick={() => {
                setFilterStartDate('');
                setFilterEndDate('');
              }}
              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Xóa bộ lọc ngày"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: REVENUE & SALE INVOICES */}
      {activeTab === 'REVENUE_INVOICES' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
              Danh sách Hóa đơn Bán hàng & Theo dõi Thu nợ
            </h3>
            <span className="text-xs text-slate-500">Tự động phát hành khi Thủ kho xác nhận xuất xưởng</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Mã Hóa đơn</th>
                  <th className="py-3 px-4">Ngày lập</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Kho xuất</th>
                  <th className="py-3 px-4 text-right">Khối lượng</th>
                  <th className="py-3 px-4 text-right">Đơn giá bán</th>
                  <th className="py-3 px-4 text-right">Tổng thành tiền</th>
                  <th className="py-3 px-4 text-right">Đã thu</th>
                  <th className="py-3 px-4 text-right">Còn nợ</th>
                  <th className="py-3 px-4">Trạng thái thanh toán</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      Chưa có hóa đơn bán hàng nào phát sinh trong kỳ
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">{inv.code}</td>
                      <td className="py-3 px-4">{inv.invoiceDate}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{inv.customerName}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inv.warehouseType === 'KHO_A' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                          {inv.warehouseType === 'KHO_A' ? 'Kho A' : 'Kho B'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatNumberVN(inv.dispatchedQuantityKg)} kg
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatVND(inv.unitPriceVnd)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatVND(inv.totalAmountVnd)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {formatVND(inv.paidAmountVnd)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-700">
                        {formatVND(inv.remainingAmountVnd)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={inv.paymentStatus} size="sm" context="FINANCE" />
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
                  <th className="py-3 px-4 text-right">Số tiền</th>
                  <th className="py-3 px-4">Người đề xuất</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Chưa có bản ghi chi phí nào trong kỳ
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => {
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
                          {formatVND(exp.amountVnd)}
                        </td>
                        <td className="py-3 px-4">{exp.createdByName}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={exp.status} size="sm" context="FINANCE" />
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
                                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs cursor-pointer"
                                >
                                  Duyệt chi
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectExpenseModal({ isOpen: true, expense: exp })}
                                  className="px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-[11px] cursor-pointer"
                                >
                                  Từ chối
                                </button>
                              </>
                            )}
                            {canPay && (
                              <button
                                type="button"
                                onClick={() => handleConfirmPayExpense(exp)}
                                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-xs cursor-pointer"
                              >
                                Đã chi tiền
                              </button>
                            )}
                            {exp.status === 'PAID' && (
                              <span className="text-[11px] text-slate-400 font-medium">Hoàn tất</span>
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

      {/* TAB 3: CASH FLOW & NET PROFIT SUMMARY */}
      {activeTab === 'SUMMARY' && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs space-y-6">
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100">
            Báo cáo Cân đối Thu — Chi &amp; Dòng tiền Thực tế
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 block">
                1. Dòng tiền Vào (Thực thu)
              </span>
              <div className="text-xl font-bold text-emerald-700">{formatVND(totalCollected)}</div>
              <p className="text-xs text-slate-500">
                Thu từ khách hàng mua viên nén gỗ Kho A và Kho B
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700 block">
                2. Dòng tiền Ra (Đã chi)
              </span>
              <div className="text-xl font-bold text-rose-700">{formatVND(totalExpenses)}</div>
              <p className="text-xs text-slate-500">
                Gồm xăng dầu vận hành, mua phụ tùng và dịch vụ sửa chữa
              </p>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-indigo-900 block">
                3. Thặng dư Dòng tiền Thuần
              </span>
              <div className="text-xl font-bold text-indigo-800">
                {formatVND(totalCollected - totalExpenses)}
              </div>
              <p className="text-xs text-indigo-950 font-medium">
                Dòng tiền thực tế sẵn sàng cho tái đầu tư sản xuất
              </p>
            </div>
          </div>
        </div>
      )}

      {/* RECORD CUSTOMER PAYMENT MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Ghi nhận Thu tiền Khách hàng</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">Hóa đơn: {selectedInvoice.code}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Khách hàng:</span>
                  <span className="font-bold text-slate-900">{selectedInvoice.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tổng hóa đơn:</span>
                  <span className="font-semibold text-slate-800">{formatVND(selectedInvoice.totalAmountVnd)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Còn nợ:</span>
                  <span className="font-bold text-rose-700">{formatVND(selectedInvoice.remainingAmountVnd)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Số tiền thu đợt này (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1000"
                  max={selectedInvoice.remainingAmountVnd}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full text-base font-bold border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Ghi chú thanh toán</label>
                <textarea
                  rows={2}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Ủy nhiệm chi số, ngân hàng..."
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              {paymentError && <p className="text-xs text-rose-600 font-medium">{paymentError}</p>}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Xác nhận Thu tiền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE EXPENSE MODAL */}
      {showCreateExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Tạo Đề xuất Chi phí Doanh nghiệp</h3>
              <button
                type="button"
                onClick={() => setShowCreateExpenseModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Hạng mục chi phí *</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                >
                  <option value="FUEL_OIL">Xăng dầu xe múc & lò sấy</option>
                  <option value="MAINTENANCE_PARTS">Vật tư bảo trì thay thế</option>
                  <option value="MACHINE_REPAIR">Gia công & Sửa chữa cơ điện</option>
                  <option value="TRANSPORTATION">Cước vận chuyển & xe bốc xếp</option>
                  <option value="OPERATIONAL_OTHER">Chi phí vận hành khác</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Nội dung chi phí chi tiết *</label>
                <input
                  type="text"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="Ví dụ: Đổ 200 lít dầu DO cho xe múc bãi mùn cưa"
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Số tiền (VNĐ) *</label>
                  <input
                    type="number"
                    min="1"
                    step="1000"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2.5 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Đối tác / Nhà cung cấp</label>
                  <input
                    type="text"
                    value={expenseVendor}
                    onChange={(e) => setExpenseVendor(e.target.value)}
                    placeholder="Cửa hàng xăng dầu..."
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <EvidenceUpload
                label="Hóa đơn / Chứng từ chi phí kèm theo"
                currentImageUrl={expenseReceiptImg}
                onImageSelected={setExpenseReceiptImg}
              />

              {expenseError && <p className="text-xs text-rose-600 font-medium">{expenseError}</p>}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateExpenseModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  {currentUser.role === 'O' ? 'Owner Duyệt chi trực tiếp' : 'Gửi đề xuất chi'}
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
          title="Từ chối Duyệt khoản chi phí"
          actionType="REJECT"
          entityCode={rejectExpenseModal.expense.code}
          onConfirm={handleConfirmRejectExpense}
          onClose={() => setRejectExpenseModal({ isOpen: false, expense: null })}
        />
      )}
    </div>
  );
};
