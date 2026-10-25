import React, { useState } from 'react';
import { X, KeyRound, ArrowRight, ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react';
import { auth } from '../../services/auth';
import { showToast } from '../common/Toast';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [username, setUsername] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [targetUserFullName, setTargetUserFullName] = useState('');

  if (!isOpen) return null;

  const handleResetState = () => {
    setStep(1);
    setUsername('');
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setTargetUserFullName('');
    onClose();
  };

  // Step 1: Validate Username
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập');
      return;
    }
    const res = auth.checkUsernameExists(username.trim());
    if (res.success && res.user) {
      setTargetUserFullName(res.user.fullName);
      setStep(2);
    } else {
      setError(res.error || 'Tài khoản không tồn tại trên hệ thống');
    }
  };

  // Step 2: Validate OTP
  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otpCode.trim()) {
      setError('Vui lòng nhập mã OTP đã nhận');
      return;
    }
    const res = auth.verifyOtp(username.trim(), otpCode.trim());
    if (res.success) {
      setStep(3);
    } else {
      setError(res.error || 'Mã xác thực OTP không chính xác');
    }
  };

  // Step 3: Set New Password
  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newPassword || newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu không trùng khớp');
      return;
    }

    const res = auth.resetPasswordWithOtp(username.trim(), otpCode.trim(), newPassword);
    if (res.success) {
      showToast('success', 'Đặt lại mật khẩu thành công', 'Bạn có thể đăng nhập bằng mật khẩu mới');
      handleResetState();
      onSuccess();
    } else {
      setError(res.error || 'Đã có lỗi xảy ra khi cập nhật mật khẩu');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <KeyRound className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Khôi phục Mật khẩu</h3>
              <p className="text-[11px] text-slate-500">Quy trình 3 bước xác thực an toàn</p>
            </div>
          </div>
          <button
            onClick={handleResetState}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="px-6 pt-4 pb-2 bg-slate-50/30 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-[11px] font-bold ${
                step >= 1 ? 'text-indigo-600' : 'text-slate-400'
              }`}
            >
              1. Tài khoản
            </span>
            <span
              className={`text-[11px] font-bold ${
                step >= 2 ? 'text-indigo-600' : 'text-slate-400'
              }`}
            >
              2. Mã OTP
            </span>
            <span
              className={`text-[11px] font-bold ${
                step >= 3 ? 'text-indigo-600' : 'text-slate-400'
              }`}
            >
              3. Mật khẩu mới
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* STEP 1: Enter Username */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tên tài khoản người dùng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ví dụ: owner_batt, manager_sx, kho_01..."
                  className="w-full text-xs font-mono border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  autoFocus
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Hệ thống sẽ kiểm tra tài khoản và gửi mã xác thực OTP về số điện thoại/email đăng ký.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={handleResetState}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <span>Tiếp tục</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Enter OTP Code */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900">
                Xác thực cho tài khoản: <strong className="font-bold">{username}</strong> ({targetUserFullName})
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mã xác thực OTP (6 số) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Nhập mã OTP..."
                  className="w-full text-base font-mono tracking-widest text-center border border-slate-300 rounded-xl p-3 text-slate-900 font-bold focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  autoFocus
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1.5 text-center">
                  Mã xác thực gồm 6 chữ số có hiệu lực trong 5 phút.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep(1);
                  }}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại</span>
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <span>Xác thực OTP</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Enter New Password */}
          {step === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-4">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>OTP hợp lệ. Vui lòng thiết lập mật khẩu mới cho tài khoản.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự..."
                  className="w-full text-xs border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại chính xác mật khẩu mới..."
                  className="w-full text-xs border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep(2);
                  }}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại</span>
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Lưu mật khẩu mới</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
