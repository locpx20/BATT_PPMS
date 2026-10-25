import React, { useState } from 'react';
import { Lock, User, ArrowRight, Shield, AlertCircle } from 'lucide-react';
import { auth } from '../../services/auth';
import { db } from '../../services/db';
import { RoleCode, ROLES } from '../../types';
import { ResetPasswordModal } from '../layout/ResetPasswordModal';

export const LoginView: React.FC = () => {
  const [username, setUsername] = useState('owner_batt');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = auth.login(username, password);
    if (!res.success) {
      setError(res.error || 'Đăng nhập không thành công');
    }
  };

  const handleQuickSelect = (roleKey: RoleCode) => {
    const user = db.getSnapshot().users.find((u) => u.role === roleKey);
    if (user) {
      setUsername(user.username);
      setPassword('123456');
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/80 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden">
        {/* Top Brand Banner */}
        <div className="p-6 bg-gradient-to-b from-indigo-50/70 to-white border-b border-slate-100 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 mx-auto flex items-center justify-center text-white font-bold text-2xl shadow-md mb-3">
            B
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-wide">BATT PPMS</h1>
          <p className="text-xs text-slate-600 font-medium mt-1">CÔNG TY CỔ PHẦN NĂNG LƯỢNG TÁI TẠO BATT</p>
          <span className="inline-block mt-2 text-[10px] uppercase font-mono font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            Hệ thống Quản lý Quy trình Sản xuất
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-6 sm:p-8 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên tài khoản
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên tài khoản..."
                className="w-full text-sm pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Mật khẩu
              </label>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
              >
                Quên mật khẩu?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full text-sm pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>Đăng nhập hệ thống</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick Select Actor list for testing */}
          <div className="pt-4 border-t border-slate-100">
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Đăng nhập nhanh theo vai trò:
            </span>
            <div className="grid grid-cols-4 gap-1.5 text-center">
              {(Object.keys(ROLES) as RoleCode[]).map((rKey) => (
                <button
                  key={rKey}
                  type="button"
                  onClick={() => handleQuickSelect(rKey)}
                  className={`px-1.5 py-1 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                    username === db.getSnapshot().users.find((u) => u.role === rKey)?.username
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                  title={ROLES[rKey].vietnameseTitle}
                >
                  {rKey}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      <ResetPasswordModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onSuccess={() => setShowResetModal(false)}
      />
    </div>
  );
};
