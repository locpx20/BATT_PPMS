import React from 'react';
import { CheckCircle, RotateCcw, XCircle, Check } from 'lucide-react';

interface DecisionButtonsProps {
  onApprove?: () => void;
  onReturn?: () => void;
  onReject?: () => void;
  onConfirm?: () => void;
  approveLabel?: string;
  returnLabel?: string;
  rejectLabel?: string;
  confirmLabel?: string;
  disabled?: boolean;
  isProcessing?: boolean;
  size?: 'sm' | 'md';
}

export const DecisionButtons: React.FC<DecisionButtonsProps> = ({
  onApprove,
  onReturn,
  onReject,
  onConfirm,
  approveLabel = 'Phê duyệt',
  returnLabel = 'Trả lại',
  rejectLabel = 'Từ chối',
  confirmLabel = 'Xác nhận',
  disabled = false,
  isProcessing = false,
  size = 'md',
}) => {
  const btnSize = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';

  return (
    <div className="inline-flex items-center gap-2 flex-wrap">
      {onApprove && (
        <button
          type="button"
          onClick={onApprove}
          disabled={disabled || isProcessing}
          className={`inline-flex items-center gap-1.5 font-medium rounded-lg shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer ${btnSize}`}
        >
          <CheckCircle className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          {approveLabel}
        </button>
      )}

      {onConfirm && (
        <button
          type="button"
          onClick={onConfirm}
          disabled={disabled || isProcessing}
          className={`inline-flex items-center gap-1.5 font-medium rounded-lg shadow-xs bg-indigo-600 hover:bg-indigo-700 text-white active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer ${btnSize}`}
        >
          <Check className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          {confirmLabel}
        </button>
      )}

      {onReturn && (
        <button
          type="button"
          onClick={onReturn}
          disabled={disabled || isProcessing}
          className={`inline-flex items-center gap-1.5 font-medium rounded-lg shadow-xs bg-amber-500 hover:bg-amber-600 text-white active:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer ${btnSize}`}
        >
          <RotateCcw className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          {returnLabel}
        </button>
      )}

      {onReject && (
        <button
          type="button"
          onClick={onReject}
          disabled={disabled || isProcessing}
          className={`inline-flex items-center gap-1.5 font-medium rounded-lg shadow-xs bg-rose-600 hover:bg-rose-700 text-white active:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer ${btnSize}`}
        >
          <XCircle className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          {rejectLabel}
        </button>
      )}
    </div>
  );
};
