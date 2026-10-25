import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ReasonModalProps {
  isOpen: boolean;
  title: string;
  actionType: 'RETURN' | 'REJECT';
  entityName?: string;
  entityCode?: string;
  onClose: () => void;
  onSubmit?: (reason: string) => void;
  onConfirm?: (reason: string) => void;
}

export const ReasonModal: React.FC<ReasonModalProps> = ({
  isOpen,
  title,
  actionType,
  entityName,
  entityCode,
  onClose,
  onSubmit,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do cụ thể trước khi xác nhận');
      return;
    }
    if (onSubmit) onSubmit(reason.trim());
    if (onConfirm) onConfirm(reason.trim());
    setReason('');
    setError('');
  };

  const isReject = actionType === 'REJECT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span
              className={`p-1.5 rounded-lg ${
                isReject ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
              }`}
            >
              <AlertCircle className="w-5 h-5" />
            </span>
            <h3 className="font-semibold text-slate-800 text-base">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          {(entityName || entityCode) && (
            <p className="text-xs font-medium text-slate-500 mb-2">
              Đối tượng xử lý: <span className="font-semibold text-slate-800">{entityCode || entityName}</span>
            </p>
          )}

          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Lý do {isReject ? 'từ chối' : 'trả lại'} <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            placeholder={
              isReject
                ? 'Nhập lý do từ chối hồ sơ (bắt buộc)...'
                : 'Nhập nội dung cần nhân viên sửa đổi, bổ sung (bắt buộc)...'
            }
            className="w-full text-sm border border-slate-300 rounded-lg p-3 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            autoFocus
          />

          {error && <p className="text-xs text-rose-600 font-medium mt-1.5">{error}</p>}

          <div className="flex items-center justify-end gap-2.5 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-xs transition-colors cursor-pointer ${
                isReject ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-500 hover:bg-amber-600'
              }`}
            >
              Xác nhận {isReject ? 'từ chối' : 'trả lại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
