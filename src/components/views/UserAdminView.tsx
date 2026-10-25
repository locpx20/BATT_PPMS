import React, { useState } from 'react';
import { Shield, Plus, Lock, Unlock, UserCheck, AlertCircle, History, X } from 'lucide-react';
import { User, RoleCode, ROLES } from '../../types';
import { db } from '../../services/db';
import { Permissions } from '../../services/rbac';
import { StatusBadge } from '../common/StatusBadge';
import { showToast } from '../common/Toast';

interface UserAdminViewProps {
  currentUser: User;
}

export const UserAdminView: React.FC<UserAdminViewProps> = ({ currentUser }) => {
  if (!Permissions.canManageUsers(currentUser.role)) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="font-bold text-slate-800 text-sm">Truy cập bị từ chối</h3>
        <p className="text-xs text-slate-500 mt-1">
          Chỉ Quản trị viên Hệ thống (Admin) mới có quyền truy cập vào mô-đun quản trị tài khoản.
        </p>
      </div>
    );
  }

  const snapshot = db.getSnapshot();
  const users = snapshot.users;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleCode>('PS');
  const [error, setError] = useState('');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim() || !email.trim()) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }

    const res = db.createUserAccount(
      {
        username: username.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role: selectedRole,
      },
      currentUser
    );

    if (res.success) {
      showToast('success', 'Tạo tài khoản thành công', `Tài khoản ${username} đã được cấp quyền ${selectedRole}`);
      setShowCreateModal(false);
      setUsername('');
      setFullName('');
      setEmail('');
      setPhone('');
    } else {
      setError(res.error || 'Lỗi khi tạo tài khoản');
    }
  };

  const handleToggleLock = (targetUser: User) => {
    const res = db.toggleUserLock(targetUser.id, currentUser);
    if (res.success) {
      showToast(
        'info',
        targetUser.isActive ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản',
        `${targetUser.fullName} (${targetUser.username})`
      );
    } else {
      showToast('error', 'Lỗi', res.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Quản trị Tài khoản & Phân quyền</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý tài khoản 8 vai trò hệ thống, chính sách bảo mật và trạng thái khóa/mở khóa
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError('');
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tạo tài khoản người dùng
        </button>
      </div>

      {/* Security Note Banner */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-start gap-3">
        <Shield className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-900">Chính sách Cách ly Quản trị (Admin Isolation):</p>
          <p className="text-slate-500 mt-0.5 leading-relaxed">
            Admin chỉ quản trị tài khoản người dùng và kiểm tra tính toàn vẹn hệ thống. Quyền Admin không bao gồm xem
            dữ liệu tài chính, doanh thu, giá bán hoặc thao tác phê duyệt nghiệp vụ sản xuất.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Tài khoản</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Số điện thoại</th>
                <th className="py-3 px-4">Vai trò nghiệp vụ</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">{u.username}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{u.fullName}</td>
                  <td className="py-3 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3 px-4">{u.phone}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-indigo-700">{ROLES[u.role]?.name}</span>
                    <span className="block text-[11px] text-slate-400">{ROLES[u.role]?.vietnameseTitle}</span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={u.isActive ? 'ACTIVE' : 'INACTIVE'} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-center">
                    {u.role !== 'O' && u.id !== currentUser.id ? (
                      <button
                        type="button"
                        onClick={() => handleToggleLock(u)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                          u.isActive
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {u.isActive ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            Khóa tài khoản
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            Mở khóa
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">Bảo vệ</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Cấp Tài khoản Người dùng Mới</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tên đăng nhập <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="nguyenvana"
                    className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Vai trò được cấp <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as RoleCode)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 bg-white font-semibold focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="M">Manager (Quản lý Vận hành)</option>
                    <option value="PS">Purchasing Staff (Thu mua)</option>
                    <option value="WS">Warehouse Staff (Thủ kho)</option>
                    <option value="S">Production Staff (Sản xuất)</option>
                    <option value="QC">QC Staff (Kiểm tra KCS)</option>
                    <option value="MS">Maintenance Staff (Bảo trì Cơ điện)</option>
                    <option value="A">Admin System (Quản trị hệ thống)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Họ và tên nhân viên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email công ty <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="an.nv@battenergy.vn"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09xx.xxx.xxx"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                Mật khẩu khởi tạo ban đầu là <code className="font-bold text-slate-800">123456</code>. Người dùng có
                thể tự thay đổi mật khẩu trong mục Hồ sơ cá nhân sau khi đăng nhập.
              </p>

              {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

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
                  Xác nhận Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
