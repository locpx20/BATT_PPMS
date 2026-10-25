import React, { useState } from 'react';
import { Building2, Plus, Phone, MapPin, User, Search, X, Eye, Edit3, Power, DollarSign, History } from 'lucide-react';
import { User as UserType, Supplier, Customer } from '../../types';
import { db } from '../../services/db';
import { Permissions } from '../../services/rbac';
import { StatusBadge } from '../common/StatusBadge';
import { showToast } from '../common/Toast';
import { formatVND, formatNumberVN } from '../../utils/formatters';

interface PartnerViewProps {
  currentUser: UserType;
}

export const PartnerView: React.FC<PartnerViewProps> = ({ currentUser }) => {
  const snapshot = db.getSnapshot();
  const suppliers = snapshot.suppliers;
  const customers = snapshot.customers;
  const purchases = snapshot.purchases;
  const outboundProposals = snapshot.outboundProposals;
  const invoices = snapshot.saleInvoices;

  const canManage = Permissions.canManagePartners(currentUser.role); // Only Owner
  const canViewCust = Permissions.canViewCustomers(currentUser.role); // Owner and Manager only, NOT Purchasing Staff

  const [activeTab, setActiveTab] = useState<'SUPPLIERS' | 'CUSTOMERS'>('SUPPLIERS');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [detailPartner, setDetailPartner] = useState<{
    type: 'SUPPLIER' | 'CUSTOMER';
    data: Supplier | Customer;
  } | null>(null);

  const [editPartner, setEditPartner] = useState<{
    type: 'SUPPLIER' | 'CUSTOMER';
    data: Supplier | Customer;
  } | null>(null);

  // Supplier Add Form
  const [supCode, setSupCode] = useState('');
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supNotes, setSupNotes] = useState('');

  // Customer Add Form
  const [cusCode, setCusCode] = useState('');
  const [cusName, setCusName] = useState('');
  const [cusPhone, setCusPhone] = useState('');
  const [cusAddress, setCusAddress] = useState('');
  const [cusContact, setCusContact] = useState('');
  const [cusPayment, setCusPayment] = useState('Chuyển khoản theo thỏa thuận hợp đồng');

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editExtra, setEditExtra] = useState('');

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supCode.trim() || !supName.trim()) return;

    const res = db.addSupplier(
      {
        code: supCode.trim().toUpperCase(),
        name: supName.trim(),
        phone: supPhone.trim(),
        address: supAddress.trim(),
        contactPerson: supContact.trim(),
        notes: supNotes.trim() || undefined,
        status: 'ACTIVE',
      },
      currentUser
    );

    if (res.success) {
      showToast('success', 'Tạo Nhà cung cấp thành công', `Đã thêm NCC ${supCode}`);
      setShowAddSupplierModal(false);
      setSupCode('');
      setSupName('');
      setSupPhone('');
      setSupAddress('');
      setSupContact('');
      setSupNotes('');
    } else {
      showToast('error', 'Lỗi', res.error);
    }
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cusCode.trim() || !cusName.trim()) return;

    const res = db.addCustomer(
      {
        code: cusCode.trim().toUpperCase(),
        name: cusName.trim(),
        phone: cusPhone.trim(),
        address: cusAddress.trim(),
        contactPerson: cusContact.trim(),
        paymentTerms: cusPayment.trim(),
        status: 'ACTIVE',
      },
      currentUser
    );

    if (res.success) {
      showToast('success', 'Tạo Khách hàng thành công', `Đã thêm KH ${cusCode}`);
      setShowAddCustomerModal(false);
      setCusCode('');
      setCusName('');
      setCusPhone('');
      setCusAddress('');
      setCusContact('');
    } else {
      showToast('error', 'Lỗi', res.error);
    }
  };

  const handleOpenEdit = (type: 'SUPPLIER' | 'CUSTOMER', partner: Supplier | Customer) => {
    setEditPartner({ type, data: partner });
    setEditName(partner.name);
    setEditPhone(partner.phone);
    setEditAddress(partner.address);
    setEditContact(partner.contactPerson);
    setEditExtra(type === 'SUPPLIER' ? (partner as Supplier).notes || '' : (partner as Customer).paymentTerms || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPartner) return;

    if (editPartner.type === 'SUPPLIER') {
      const res = db.updateSupplier(
        editPartner.data.id,
        {
          name: editName,
          phone: editPhone,
          address: editAddress,
          contactPerson: editContact,
          notes: editExtra,
        },
        currentUser
      );
      if (res.success) {
        showToast('success', 'Cập nhật thành công', `Đã lưu thay đổi cho NCC ${editPartner.data.code}`);
      } else {
        showToast('error', 'Lỗi', res.error);
      }
    } else {
      const res = db.updateCustomer(
        editPartner.data.id,
        {
          name: editName,
          phone: editPhone,
          address: editAddress,
          contactPerson: editContact,
          paymentTerms: editExtra,
        },
        currentUser
      );
      if (res.success) {
        showToast('success', 'Cập nhật thành công', `Đã lưu thay đổi cho Khách hàng ${editPartner.data.code}`);
      } else {
        showToast('error', 'Lỗi', res.error);
      }
    }
    setEditPartner(null);
  };

  const handleToggleDeactivate = (type: 'SUPPLIER' | 'CUSTOMER', partner: Supplier | Customer) => {
    if (!canManage) {
      showToast('error', 'Từ chối quyền', 'Chỉ Giám đốc (Owner) mới có quyền ngừng sử dụng hoặc kích hoạt lại');
      return;
    }
    const isDeactivating = partner.status === 'ACTIVE';
    const actionLabel = isDeactivating ? 'ngừng sử dụng' : 'kích hoạt lại';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionLabel} đối tác "${partner.name}" (${partner.code})?`)) {
      return;
    }

    if (type === 'SUPPLIER') {
      const res = db.deactivateSupplier(partner.id, currentUser);
      if (res.success) {
        showToast('success', 'Thao tác thành công', `Đã ${actionLabel} NCC ${partner.code}`);
      } else {
        showToast('error', 'Lỗi', res.error);
      }
    } else {
      const res = db.deactivateCustomer(partner.id, currentUser);
      if (res.success) {
        showToast('success', 'Thao tác thành công', `Đã ${actionLabel} Khách hàng ${partner.code}`);
      } else {
        showToast('error', 'Lỗi', res.error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Đối tác Cung ứng & Khách hàng</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý nhà cung cấp nguyên vật liệu và khách hàng tiêu thụ viên nén gỗ (Chỉ Giám đốc toàn quyền tạo/sửa)
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            {activeTab === 'SUPPLIERS' ? (
              <button
                type="button"
                onClick={() => {
                  setSupCode(`NCC-${String(suppliers.length + 1).padStart(2, '0')}`);
                  setShowAddSupplierModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Thêm Nhà cung cấp
              </button>
            ) : (
              canViewCust && (
                <button
                  type="button"
                  onClick={() => {
                    setCusCode(`KH-${String(customers.length + 1).padStart(2, '0')}`);
                    setShowAddCustomerModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Thêm Khách hàng
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('SUPPLIERS')}
            className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'SUPPLIERS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Nhà cung cấp NVL ({suppliers.length})
          </button>

          {canViewCust && (
            <button
              type="button"
              onClick={() => setActiveTab('CUSTOMERS')}
              className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                activeTab === 'CUSTOMERS'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Khách hàng thu mua ({customers.length})
            </button>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên, mã, người liên hệ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* TAB 1: SUPPLIERS */}
      {activeTab === 'SUPPLIERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((sup) => {
            const partnerPurchases = purchases.filter((p) => p.supplierId === sup.id);
            const totalKg = partnerPurchases.reduce((sum, p) => sum + (p.weighedQuantityKg || 0), 0);
            const totalPaid = partnerPurchases.reduce((sum, p) => sum + (p.totalAmountVnd || 0), 0);

            return (
              <div
                key={sup.id}
                className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {sup.code}
                    </span>
                    <StatusBadge status={sup.status} size="sm" />
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 mb-1 leading-snug line-clamp-2">{sup.name}</h3>

                  <div className="space-y-1.5 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-start gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="font-medium text-slate-800">{sup.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{sup.phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-[11px] text-slate-500 line-clamp-2">{sup.address}</span>
                    </div>
                  </div>

                  <div className="mt-3 p-2.5 rounded-lg bg-slate-50 text-[11px] space-y-1 text-slate-600 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span>Mặt hàng cung cấp:</span>
                      <span className="font-semibold text-slate-800">Nguyên vật liệu</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Tổng khối lượng đã mua:</span>
                      <span className="font-bold text-indigo-700">{formatNumberVN(totalKg)} kg</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Tổng giá trị giao dịch:</span>
                      <span className="font-bold text-slate-900">{formatVND(totalPaid)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setDetailPartner({ type: 'SUPPLIER', data: sup })}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lịch sử thu mua</span>
                  </button>

                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit('SUPPLIER', sup)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title="Chỉnh sửa thông tin"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleDeactivate('SUPPLIER', sup)}
                        className={`p-1 rounded-md cursor-pointer transition-colors ${
                          sup.status === 'ACTIVE'
                            ? 'text-rose-400 hover:text-rose-700 hover:bg-rose-50'
                            : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title={sup.status === 'ACTIVE' ? 'Ngừng sử dụng NCC' : 'Kích hoạt lại NCC'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: CUSTOMERS */}
      {activeTab === 'CUSTOMERS' && canViewCust && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cus) => {
            const partnerOutbounds = outboundProposals.filter((o) => o.customerId === cus.id);
            const partnerInvoices = invoices.filter((i) => i.customerId === cus.id);
            const totalDispatchedKg = partnerOutbounds
              .filter((o) => o.isDispatched)
              .reduce((sum, o) => sum + (o.requestedQuantityKg || 0), 0);
            const totalReceivable = partnerInvoices.reduce((sum, i) => sum + i.remainingAmountVnd, 0);
            const totalRevenue = partnerInvoices.reduce((sum, i) => sum + i.totalAmountVnd, 0);

            return (
              <div
                key={cus.id}
                className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {cus.code}
                    </span>
                    <StatusBadge status={cus.status} size="sm" />
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 mb-1 leading-snug line-clamp-2">{cus.name}</h3>

                  <div className="space-y-1.5 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-start gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="font-medium text-slate-800">{cus.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{cus.phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-[11px] text-slate-500 line-clamp-2">{cus.address}</span>
                    </div>
                  </div>

                  <div className="mt-3 p-2.5 rounded-lg bg-slate-50 text-[11px] space-y-1 text-slate-600 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span>Đã xuất xưởng:</span>
                      <span className="font-bold text-indigo-700">{formatNumberVN(totalDispatchedKg)} kg</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Tổng doanh số:</span>
                      <span className="font-semibold text-slate-800">{formatVND(totalRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Công nợ còn lại:</span>
                      <span className={`font-bold ${totalReceivable > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {formatVND(totalReceivable)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setDetailPartner({ type: 'CUSTOMER', data: cus })}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lịch sử xuất hàng</span>
                  </button>

                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit('CUSTOMER', cus)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title="Chỉnh sửa thông tin"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleDeactivate('CUSTOMER', cus)}
                        className={`p-1 rounded-md cursor-pointer transition-colors ${
                          cus.status === 'ACTIVE'
                            ? 'text-rose-400 hover:text-rose-700 hover:bg-rose-50'
                            : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title={cus.status === 'ACTIVE' ? 'Ngừng sử dụng KH' : 'Kích hoạt lại KH'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL WITH TRANSACTION HISTORY */}
      {detailPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 mr-2">
                  {detailPartner.data.code}
                </span>
                <span className="font-bold text-slate-900 text-base">{detailPartner.data.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setDetailPartner(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block mb-0.5">Người liên hệ:</span>
                  <span className="font-bold text-slate-800 text-sm">{detailPartner.data.contactPerson}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Số điện thoại:</span>
                  <span className="font-bold text-slate-800 text-sm">{detailPartner.data.phone}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block mb-0.5">Địa chỉ trụ sở / Xưởng:</span>
                  <span className="font-medium text-slate-700">{detailPartner.data.address}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Trạng thái:</span>
                  <StatusBadge status={detailPartner.data.status} size="sm" />
                </div>
                {detailPartner.type === 'CUSTOMER' && (
                  <div>
                    <span className="text-slate-400 block mb-0.5">Điều khoản thanh toán:</span>
                    <span className="font-semibold text-slate-800">
                      {(detailPartner.data as Customer).paymentTerms || 'Chuyển khoản đối soát'}
                    </span>
                  </div>
                )}
              </div>

              {/* Transactions List */}
              {detailPartner.type === 'SUPPLIER' ? (
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-indigo-600" />
                    Lịch sử các phiếu thu mua nguyên vật liệu ({purchases.filter((p) => p.supplierId === detailPartner.data.id).length})
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Mã phiếu</th>
                          <th className="py-2.5 px-3">Ngày giao việc</th>
                          <th className="py-2.5 px-3 text-right">Khối lượng cân</th>
                          <th className="py-2.5 px-3 text-right">Đơn giá</th>
                          <th className="py-2.5 px-3 text-right">Thành tiền</th>
                          <th className="py-2.5 px-3">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {purchases
                          .filter((p) => p.supplierId === detailPartner.data.id)
                          .map((p) => (
                            <tr key={p.id}>
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{p.code}</td>
                              <td className="py-2.5 px-3">{p.plannedDate}</td>
                              <td className="py-2.5 px-3 text-right font-semibold">
                                {p.weighedQuantityKg ? `${formatNumberVN(p.weighedQuantityKg)} kg` : '—'}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {p.unitPriceVnd ? `${formatNumberVN(p.unitPriceVnd)} đ/kg` : '—'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                                {p.totalAmountVnd ? formatVND(p.totalAmountVnd) : '—'}
                              </td>
                              <td className="py-2.5 px-3">
                                <StatusBadge status={p.status} size="sm" />
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-indigo-600" />
                    Lịch sử các đề xuất xuất hàng & Hóa đơn ({outboundProposals.filter((o) => o.customerId === detailPartner.data.id).length})
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Mã đề xuất</th>
                          <th className="py-2.5 px-3">Kho xuất</th>
                          <th className="py-2.5 px-3 text-right">Khối lượng</th>
                          <th className="py-2.5 px-3 text-right">Đơn giá bán</th>
                          <th className="py-2.5 px-3 text-right">Tổng giá trị</th>
                          <th className="py-2.5 px-3">Trạng thái xuất</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {outboundProposals
                          .filter((o) => o.customerId === detailPartner.data.id)
                          .map((o) => (
                            <tr key={o.id}>
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{o.code}</td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700">
                                  {o.sourceWarehouse === 'KHO_A' ? 'Kho A' : 'Kho B'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-semibold">
                                {formatNumberVN(o.requestedQuantityKg)} kg
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {o.unitPriceVnd ? `${formatNumberVN(o.unitPriceVnd)} đ/kg` : '—'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                                {o.unitPriceVnd ? formatVND(o.requestedQuantityKg * o.unitPriceVnd) : '—'}
                              </td>
                              <td className="py-2.5 px-3">
                                <StatusBadge status={o.status} size="sm" />
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailPartner(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD SUPPLIER MODAL (Owner Only) */}
      {showAddSupplierModal && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Thêm Nhà cung cấp Nguyên vật liệu</h3>
              <button
                type="button"
                onClick={() => setShowAddSupplierModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Mã NCC *</label>
                  <input
                    type="text"
                    value={supCode}
                    onChange={(e) => setSupCode(e.target.value.toUpperCase())}
                    className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Mặt hàng</label>
                  <input
                    type="text"
                    value="Nguyên vật liệu"
                    disabled
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 text-slate-500 bg-slate-100 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tên Nhà cung cấp *</label>
                <input
                  type="text"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  placeholder="Ví dụ: Công ty TNHH Lâm Nghiệp Hàm Thuận"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Người liên hệ</label>
                  <input
                    type="text"
                    value={supContact}
                    onChange={(e) => setSupContact(e.target.value)}
                    placeholder="Ông/Bà..."
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    placeholder="09xx..."
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  placeholder="KCN Hàm Kiệm, Huyện Hàm Thuận Nam, Bình Thuận"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Ghi chú đối tác</label>
                <textarea
                  rows={2}
                  value={supNotes}
                  onChange={(e) => setSupNotes(e.target.value)}
                  placeholder="Ghi chú về nguồn cung, năng lực giao hàng..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
                >
                  Lưu Nhà cung cấp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CUSTOMER MODAL (Owner Only) */}
      {showAddCustomerModal && canManage && canViewCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Thêm Khách hàng Thu mua</h3>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Mã Khách hàng *</label>
                  <input
                    type="text"
                    value={cusCode}
                    onChange={(e) => setCusCode(e.target.value.toUpperCase())}
                    className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Mặt hàng mua</label>
                  <input
                    type="text"
                    value="Viên nén gỗ"
                    disabled
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 text-slate-500 bg-slate-100 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tên Doanh nghiệp / Khách hàng *</label>
                <input
                  type="text"
                  value={cusName}
                  onChange={(e) => setCusName(e.target.value)}
                  placeholder="Ví dụ: Công ty Cổ phần Năng lượng Xanh Châu Á"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Người đại diện / Liên hệ</label>
                  <input
                    type="text"
                    value={cusContact}
                    onChange={(e) => setCusContact(e.target.value)}
                    placeholder="Ông/Bà..."
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={cusPhone}
                    onChange={(e) => setCusPhone(e.target.value)}
                    placeholder="09xx..."
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Địa chỉ giao dịch</label>
                <input
                  type="text"
                  value={cusAddress}
                  onChange={(e) => setCusAddress(e.target.value)}
                  placeholder="Quận 1, TP. Hồ Chí Minh"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Điều khoản thanh toán</label>
                <input
                  type="text"
                  value={cusPayment}
                  onChange={(e) => setCusPayment(e.target.value)}
                  placeholder="Ví dụ: T/T 30 ngày sau khi nhận hàng"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
                >
                  Lưu Khách hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL (Owner Only) */}
      {editPartner && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Chỉnh sửa: {editPartner.data.code} — {editPartner.type === 'SUPPLIER' ? 'Nhà cung cấp' : 'Khách hàng'}
              </h3>
              <button
                type="button"
                onClick={() => setEditPartner(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tên đối tác *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Người liên hệ</label>
                  <input
                    type="text"
                    value={editContact}
                    onChange={(e) => setEditContact(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  {editPartner.type === 'SUPPLIER' ? 'Ghi chú nhà cung cấp' : 'Điều khoản thanh toán'}
                </label>
                <input
                  type="text"
                  value={editExtra}
                  onChange={(e) => setEditExtra(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditPartner(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
