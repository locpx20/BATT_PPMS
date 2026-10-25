import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeConfig = (st: string) => {
    switch (st) {
      case 'ASSIGNED':
        return { label: 'Đã phân công', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'SUBMITTED':
        return { label: 'Chờ phê duyệt', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'APPROVED':
        return { label: 'Đã phê duyệt', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'RETURNED':
        return { label: 'Bị trả lại', bg: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'REJECTED':
        return { label: 'Từ chối', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'RECEIVED':
        return { label: 'Đã nhập kho', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'DISCREPANCY_PENDING':
        return { label: 'Chênh lệch chờ xử lý', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'PLANNED':
        return { label: 'Đã lập kế hoạch', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'IN_PROGRESS':
        return { label: 'Đang thực hiện', bg: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'COMPLETED':
        return { label: 'Hoàn thành', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'PENDING':
        return { label: 'Chờ kiểm tra', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'IN_TESTING':
        return { label: 'Đang kiểm tra', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'QC_PASSED':
        return { label: 'Đạt chuẩn KCS (3/3)', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'RE_DRY_REQUIRED':
        return { label: 'Yêu cầu sấy lại', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'GRADE_A':
        return { label: 'Hạng A (ENplus-A1)', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold' };
      case 'GRADE_B':
        return { label: 'Hạng B (Công nghiệp)', bg: 'bg-blue-50 text-blue-800 border-blue-300 font-semibold' };
      case 'PENDING_MANAGER_REVIEW':
        return { label: 'Chờ Quản lý duyệt', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'PENDING_OWNER_APPROVAL':
        return { label: 'Chờ Owner phê duyệt', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'DISPATCHED':
        return { label: 'Đã xuất kho', bg: 'bg-slate-100 text-slate-800 border-slate-300' };
      case 'OPERATIONAL':
        return { label: 'Đang hoạt động', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'MAINTENANCE_REQUIRED':
        return { label: 'Cần bảo trì', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'UNDER_REPAIR':
        return { label: 'Đang sửa chữa', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'DECOMMISSIONED':
        return { label: 'Ngừng sử dụng', bg: 'bg-zinc-100 text-zinc-600 border-zinc-200' };
      case 'REPORTED':
        return { label: 'Đã báo sự cố', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'ACTIVE':
        return { label: 'Đang hoạt động', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'INACTIVE':
        return { label: 'Đã khóa / Tạm ngưng', bg: 'bg-zinc-100 text-zinc-600 border-zinc-200' };
      case 'WAITING_SUPPLY':
        return { label: 'Chờ cấp vật tư', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'SUPPLIED':
        return { label: 'Đã cấp vật tư', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
      default:
        return { label: st, bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const { label, bg } = getBadgeConfig(status);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${bg} ${sizeClasses} tracking-tight whitespace-nowrap`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      {label}
    </span>
  );
};
