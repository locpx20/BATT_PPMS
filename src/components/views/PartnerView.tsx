import React, { useState } from 'react';
import { Building2, Plus, Phone, MapPin, User, Search, X, Eye, Edit3, History, DollarSign } from 'lucide-react';
import { User as UserType, Supplier, Customer } from '../../types';
import { db } from '../../services/db';
import { Permissions } from '../../services/rbac';
import { StatusBadge } from '../common/StatusBadge';
import { showToast } from '../common/Toast';

interface PartnerViewProps {
  currentUser: UserType;
}

export const PartnerView: React.FC<PartnerViewProps> = ({ currentUser }) => {
  const snapshot = db.getSnapshot();
  const suppliers = snapshot.suppliers;
  const customers = snapshot.customers;
  const purchases = snapshot.purchases;
  const outboundProposals = snapshot.outboundProposals;

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
  const [supMaterials, setSupMaterials] = useState('Nguyên vật liệu');

  // Customer Add Form
  const [cusCode, setCusCode] = useState('');
  const [cusName, setCusName] = useState('');
  const [cusPhone, setCusPhone] = useState('');
  const [cusAddress, setCusAddress] = useState('');
  const [cusContact, setCusContact] = useState('');
  const [cusPayment, setCusPayment] = useState('T/T chuyển khoản sau khi đối soát');

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
        status: 'ACTIVE',
      },
      currentUser
    );

    if (res.success) {
      showToast('success', 'Thêm Nhà cung cấp thành công', supName);
      setShowAddSupplierModal(false);
      setSupCode('');
      setSupName('');
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
        status: 'ACTIVE',
        paymentTerms: cusPayment.trim(),
      },
      currentUser
    );

    if (res.success) {
      showToast('success', 'Thêm Khách hàng thành công', cusName);
      setShowAddCustomerModal(false);
      setCusCode('');
      setCusName('');
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
      const sup = editPartner.data as Supplier;
      sup.name = editName;
      sup.phone = editPhone;
      sup.address = editAddress;
      sup.contactPerson = editContact;
      showToast('success', 'Cập nhật thành công', `Đã lưu thay đổi cho NCC ${sup.code}`);
    } else {
      const cus = editPartner.data as Customer;
      cus.name = editName;
      cus.phone = editPhone;
      cus.address = editAddress;
      cus.contactPerson = editContact;
      cus.paymentTerms = editExtra;
      showToast('success', 'Cập nhật thành công', `Đã lưu thay đổi cho Khách hàng ${cus.code}`);
    }
    setEditPartner(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Đối tác Cung ứng & Khách hàng</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Danh mục nhà cung cấp nguyên vật liệu và khách hàng thu mua viên nén gỗ trong & ngoài nước
          </p>
        </div>

        {Permissions.canManagePartners(currentUser.role) && (
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

                  <div className="mt-3 p-2 rounded-lg bg-slate-50 text-[11px] flex items-center justify-between text-slate-600">
                    <span>Đã cung ứng:</span>
                    <span className="font-bold text-indigo-700">{totalKg.toLocaleString('vi-VN')} kg ({partnerPurchases.length} chuyến)</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setDetailPartner({ type: 'SUPPLIER', data: sup })}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lịch sử giao dịch</span>
                  </button>

                  {Permissions.canManagePartners(currentUser.role) && (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit('SUPPLIER', sup)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                      title="Sửa thông tin"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: CUSTOMERS */}
      {activeTab === 'CUSTOMERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cus) => {
            const partnerOutbounds = outboundProposals.filter((o) => o.customerId === cus.id);
            const totalDispatchedKg = partnerOutbounds
              .filter((o) => o.isDispatched)
              .reduce((sum, o) => sum + (o.requestedQuantityKg || 0), 0);

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

                  <h3 className="font-bold text-sm text-slate-900 mb-1 leading-snug">{cus.name}</h3>

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

                  {cus.paymentTerms && (
                    <div className="mt-2 text-[11px] text-slate-500 italic">
                      ĐK: {cus.paymentTerms}
                    </div>
                  )}

                  <div className="mt-3 p-2 rounded-lg bg-emerald-50/60 text-[11px] flex items-center justify-between text-emerald-900">
                    <span>Đã xuất xưởng:</span>
                    <span className="font-bold">{totalDispatchedKg.toLocaleString('vi-VN')} kg ({partnerOutbounds.length} đơn)</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setDetailPartner({ type: 'CUSTOMER', data: cus })}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lịch sử mua hàng</span>
                  </button>

                  {Permissions.canManagePartners(currentUser.role) && (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit('CUSTOMER', cus)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                      title="Sửa thông tin"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
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
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-mono font-bold text-xs">
                  {detailPartner.data.code}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{detailPartner.data.name}</h3>
                  <p className="text-[11px] text-slate-500">
                    {detailPartner.type === 'SUPPLIER' ? 'Lịch sử Cung ứng Nguyên vật liệu' : 'Lịch sử Thu mua & Đơn hàng'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailPartner(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Partner Overview Info */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block">Đại diện liên hệ:</span>
                  <span className="font-semibold text-slate-800">{detailPartner.data.contactPerson}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Điện thoại:</span>
                  <span className="font-semibold text-slate-800">{detailPartner.data.phone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">Địa chỉ:</span>
                  <span className="text-slate-700">{detailPartner.data.address}</span>
                </div>
              </div>

              {/* Transactions List */}
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pt-2">
                {detailPartner.type === 'SUPPLIER' ? 'Các lô hàng cung ứng gần nhất' : 'Các đơn xuất hàng gần nhất'}
              </h4>

              {detailPartner.type === 'SUPPLIER' ? (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {purchases.filter((p) => p.supplierId === detailPartner.data.id).length === 0 ? (
                    <div className="p-6 text-center text-slate-400">Chưa có giao dịch cung ứng nào</div>
                  ) : (
                    purchases
                      .filter((p) => p.supplierId === detailPartner.data.id)
                      .map((p) => (
                        <div key={p.id} className="p-3 hover:bg-slate-50 flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-indigo-700 block">{p.code}</span>
                            <span className="text-[11px] text-slate-500">
                              Ngày cân: {p.plannedDate} • NVL: {p.rawMaterialType}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 block">
                              {(p.weighedQuantityKg || p.plannedQuantityKg).toLocaleString('vi-VN')} kg
                            </span>
                            <StatusBadge status={p.status} size="sm" />
                          </div>
                        </div>
                      ))
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {outboundProposals.filter((o) => o.customerId === detailPartner.data.id).length === 0 ? (
                    <div className="p-6 text-center text-slate-400">Chưa có đơn xuất hàng nào</div>
                  ) : (
                    outboundProposals
                      .filter((o) => o.customerId === detailPartner.data.id)
                      .map((o) => (
                        <div key={o.id} className="p-3 hover:bg-slate-50 flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-indigo-700 block">{o.code}</span>
                            <span className="text-[11px] text-slate-500">
                              Lô: {o.lotCode} • Đơn giá: {o.unitPriceVnd ? `${o.unitPriceVnd.toLocaleString('vi-VN')} đ` : 'Chưa chốt'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 block">
                              {o.requestedQuantityKg.toLocaleString('vi-VN')} kg
                            </span>
                            <StatusBadge status={o.status} size="sm" />
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailPartner(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PARTNER MODAL */}
      {editPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <h3 className="font-bold text-slate-900 text-sm">
                Chỉnh sửa Thông tin {editPartner.type === 'SUPPLIER' ? 'Nhà cung cấp' : 'Khách hàng'}
              </h3>
              <button
                onClick={() => setEditPartner(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tên {editPartner.type === 'SUPPLIER' ? 'Nhà cung cấp' : 'Doanh nghiệp'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Người đại diện liên hệ
                  </label>
                  <input
                    type="text"
                    value={editContact}
                    onChange={(e) => setEditContact(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {editPartner.type === 'CUSTOMER' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Điều khoản thương mại &amp; thanh toán
                  </label>
                  <input
                    type="text"
                    value={editExtra}
                    onChange={(e) => setEditExtra(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setEditPartner(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SUPPLIER MODAL */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <h3 className="font-bold text-slate-900 text-sm">Thêm Nhà Cung cấp Mới</h3>
              <button
                onClick={() => setShowAddSupplierModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mã NCC <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={supCode}
                    onChange={(e) => setSupCode(e.target.value)}
                    className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    placeholder="0252.xxx.xxxx"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tên Nhà cung cấp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  placeholder="Công ty TNHH Lâm Nghiệp..."
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Người đại diện / liên hệ
                </label>
                <input
                  type="text"
                  value={supContact}
                  onChange={(e) => setSupContact(e.target.value)}
                  placeholder="Ông/Bà..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Địa chỉ xưởng / nguồn hàng
                </label>
                <input
                  type="text"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  placeholder="Huyện Hàm Thuận Bắc, Bình Thuận..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Lưu Nhà cung cấp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <h3 className="font-bold text-slate-900 text-sm">Thêm Khách Hàng Mới</h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mã KH <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cusCode}
                    onChange={(e) => setCusCode(e.target.value)}
                    className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={cusPhone}
                    onChange={(e) => setCusPhone(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tên Khách hàng / Doanh nghiệp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={cusName}
                  onChange={(e) => setCusName(e.target.value)}
                  placeholder="Sumitomo, Doosan, Nhiệt điện..."
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Người phụ trách hợp đồng
                </label>
                <input
                  type="text"
                  value={cusContact}
                  onChange={(e) => setCusContact(e.target.value)}
                  placeholder="Mr. Sato / Bà Nguyễn..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Địa chỉ cảng nhận / trụ sở
                </label>
                <input
                  type="text"
                  value={cusAddress}
                  onChange={(e) => setCusAddress(e.target.value)}
                  placeholder="Cảng Cái Mép, Vũng Tàu..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Điều khoản thanh toán & giao hàng
                </label>
                <input
                  type="text"
                  value={cusPayment}
                  onChange={(e) => setCusPayment(e.target.value)}
                  placeholder="LC At Sight, T/T..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Lưu Khách hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
