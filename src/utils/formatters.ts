/**
 * BATT PPMS - Unified Formatting & Vietnamese Localization Utilities
 * Enforces strict vi-VN currency formatting and 100% Vietnamese business terminology
 */

export function formatVND(amount: number | null | undefined): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 VNĐ';
  return `${Math.round(amount).toLocaleString('vi-VN')} VNĐ`;
}

export function formatNumberVN(val: number | null | undefined): string {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return Number(val).toLocaleString('vi-VN');
}

export function formatKg(val: number | null | undefined): string {
  if (val === undefined || val === null || isNaN(val)) return '0 kg';
  return `${Number(val).toLocaleString('vi-VN')} kg`;
}

export interface StatusStyle {
  label: string;
  bg: string;
  dotColor?: string;
}

/**
 * Universal Vietnamese Status Dictionary
 * Prevents raw technical English codes from leaking onto any user-facing screen.
 */
export const STATUS_DICTIONARY: Record<string, StatusStyle> = {
  // General & Workflow
  PENDING: { label: 'Chờ xử lý', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  SUBMITTED: { label: 'Chờ duyệt', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  APPROVED: { label: 'Đã duyệt', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  RETURNED: { label: 'Đã trả lại', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
  REJECTED: { label: 'Đã từ chối', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  IN_PROGRESS: { label: 'Đang thực hiện', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
  COMPLETED: { label: 'Hoàn thành', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELLED: { label: 'Đã hủy', bg: 'bg-slate-100 text-slate-600 border-slate-200' },
  ASSIGNED: { label: 'Đã phân công', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  SCHEDULED: { label: 'Đã lên lịch', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  PLANNED: { label: 'Đã lập kế hoạch', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  RECEIVED: { label: 'Đã nhập kho', bg: 'bg-teal-50 text-teal-700 border-teal-200' },

  // Warehouse & Outbound
  REJECTED_BY_WAREHOUSE: { label: 'Kho từ chối', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  PENDING_VERIFICATION: { label: 'Chờ xác minh', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  PENDING_OWNER_APPROVAL: { label: 'Chờ duyệt', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  PENDING_MANAGER_REVIEW: { label: 'Chờ quản lý xem', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  DISPATCHED: { label: 'Đã xuất kho', bg: 'bg-slate-100 text-slate-800 border-slate-300' },
  READY_FOR_DISPATCH: { label: 'Chờ xuất kho', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  DISCREPANCY_PENDING: { label: 'Chênh lệch chờ xử lý', bg: 'bg-purple-50 text-purple-700 border-purple-200' },

  // Quality Control
  IN_TESTING: { label: 'Đang kiểm tra', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  QC_COMPLETED: { label: 'Hoàn thành', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  QC_PASSED: { label: 'Đạt chuẩn (3/3)', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  RE_DRY_REQUIRED: { label: 'Yêu cầu sấy lại', bg: 'bg-rose-50 text-rose-700 border-rose-200' },

  // Maintenance & Failure
  REPORTED: { label: 'Chờ phân công', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  UNDER_REPAIR: { label: 'Đang sửa chữa', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  WAITING_FOR_MATERIALS: { label: 'Chờ mua vật tư', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  WAITING_SUPPLY: { label: 'Chờ duyệt vật tư', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  SUPPLYING: { label: 'Chờ bổ sung vật tư', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
  ENOUGH_MATERIALS: { label: 'Đã đủ vật tư', bg: 'bg-teal-50 text-teal-700 border-teal-200' },
  SUPPLIED: { label: 'Đã cấp vật tư', bg: 'bg-teal-50 text-teal-700 border-teal-200' },
  PENDING_CONFIRMATION: { label: 'Chờ xác nhận hoàn thành', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },

  // Equipment Status
  OPERATIONAL: { label: 'Đang hoạt động', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  MAINTENANCE_REQUIRED: { label: 'Cần bảo trì', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  DECOMMISSIONED: { label: 'Ngừng sử dụng', bg: 'bg-zinc-100 text-zinc-600 border-zinc-200' },

  // Financial & Payment Statuses
  UNPAID: { label: 'Chưa thanh toán', bg: 'bg-amber-50 text-amber-800 border-amber-300' },
  PARTIALLY_PAID: { label: 'Thanh toán một phần', bg: 'bg-sky-50 text-sky-800 border-sky-300' },
  PAID: { label: 'Đã thanh toán', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  OVERDUE: { label: 'Quá hạn', bg: 'bg-rose-50 text-rose-800 border-rose-300' },
  PENDING_APPROVAL: { label: 'Chờ duyệt chi', bg: 'bg-amber-50 text-amber-700 border-amber-200' },

  // Partner & User Status
  ACTIVE: { label: 'Đang hoạt động', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  INACTIVE: { label: 'Ngừng sử dụng', bg: 'bg-zinc-100 text-zinc-600 border-zinc-200' },

  // Warehouses
  KHO_A: { label: 'Kho A', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  KHO_B: { label: 'Kho B', bg: 'bg-blue-50 text-blue-800 border-blue-300' },
};

/**
 * Get display info for any status with contextual fallback
 */
export function getStatusInfo(status: string, context?: 'QC' | 'MAINTENANCE' | 'OUTBOUND' | 'FINANCE'): StatusStyle {
  if (!status) {
    return { label: 'Chưa xác định', bg: 'bg-slate-100 text-slate-600 border-slate-200' };
  }

  // Context-specific overrides
  if (context === 'QC') {
    if (status === 'PENDING') return { label: 'Chưa bắt đầu', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (status === 'IN_TESTING') return { label: 'Đang kiểm tra', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (status === 'QC_COMPLETED' || status === 'COMPLETED') return { label: 'Hoàn thành', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }

  if (context === 'MAINTENANCE') {
    if (status === 'REPORTED') return { label: 'Chờ phân công', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (status === 'UNDER_REPAIR') return { label: 'Đang sửa chữa', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
    if (status === 'WAITING_FOR_MATERIALS') return { label: 'Chờ mua vật tư', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
  }

  if (context === 'OUTBOUND') {
    if (status === 'APPROVED') return { label: 'Chờ xuất kho', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    if (status === 'PENDING_OWNER_APPROVAL') return { label: 'Chờ duyệt xuất', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
  }

  if (STATUS_DICTIONARY[status]) {
    return STATUS_DICTIONARY[status];
  }

  // Graceful fallback converting snake/screaming case to title case Vietnamese without technical codes
  return {
    label: status.replace(/_/g, ' ').toLowerCase(),
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
  };
}
