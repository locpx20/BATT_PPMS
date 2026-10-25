import React from 'react';
import { X, History, User, Clock } from 'lucide-react';
import { AuditLog } from '../../types';

interface AuditHistoryModalProps {
  isOpen: boolean;
  title?: string;
  entityCode?: string;
  logs: AuditLog[];
  onClose: () => void;
}

export const AuditHistoryModal: React.FC<AuditHistoryModalProps> = ({
  isOpen,
  title = 'Lịch sử xử lý & Kiểm toán',
  entityCode,
  logs,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <History className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm sm:text-base">{title}</h3>
              {entityCode && <p className="text-xs text-slate-500 font-mono">Mã hồ sơ: {entityCode}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">Chưa có nhật ký ghi nhận</div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {logs.map((log) => (
                <div key={log.id} className="relative group">
                  {/* Dot */}
                  <div className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white bg-indigo-600 shadow-xs"></div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                      <span className="text-xs font-semibold text-slate-900">{log.action}</span>
                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.timestamp).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-800">{log.actorName}</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-semibold">
                        {log.actorRole}
                      </span>
                    </div>

                    {log.details && <p className="text-xs text-slate-600 leading-relaxed mb-1">{log.details}</p>}

                    {log.reason && (
                      <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                        <span className="font-semibold">Lý do: </span>
                        {log.reason}
                      </div>
                    )}

                    {(log.previousState || log.newState) && (
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                        <span>Trạng thái:</span>
                        {log.previousState && (
                          <span className="px-2 py-0.5 rounded bg-slate-200 font-mono text-slate-700">
                            {log.previousState}
                          </span>
                        )}
                        {log.previousState && log.newState && <span>→</span>}
                        {log.newState && (
                          <span className="px-2 py-0.5 rounded bg-indigo-100 font-mono text-indigo-800 font-medium">
                            {log.newState}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
