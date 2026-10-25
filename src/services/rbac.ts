/**
 * BATT PPMS - Strict Role-Based Access Control (RBAC)
 * Enforces business logic permissions, Owner inheritance of Manager,
 * and Admin system isolation from operational business data.
 */

import { RoleCode } from '../types';

export type NavItemKey =
  | 'dashboard'
  | 'finance'
  | 'purchasing'
  | 'raw-inventory'
  | 'production-plan'
  | 'shift-report'
  | 'qc'
  | 'finished-goods'
  | 'outbound'
  | 'maintenance'
  | 'machines'
  | 'partners'
  | 'audit-logs'
  | 'user-admin';

export interface NavItemConfig {
  key: NavItemKey;
  label: string;
  icon: string;
  allowedRoles: RoleCode[];
  group: 'CORE' | 'PRODUCTION' | 'WAREHOUSE_LOGISTICS' | 'EQUIPMENT' | 'ADMINISTRATION';
}

export const NAV_ITEMS: NavItemConfig[] = [
  {
    key: 'dashboard',
    label: 'Tổng quan Điều hành',
    icon: 'LayoutDashboard',
    allowedRoles: ['O', 'M', 'PS', 'WS', 'S', 'QC', 'MS', 'A'],
    group: 'CORE',
  },
  {
    key: 'finance',
    label: 'Tài chính & Doanh thu',
    icon: 'DollarSign',
    allowedRoles: ['O', 'M'],
    group: 'CORE',
  },
  {
    key: 'purchasing',
    label: 'Thu mua Nguyên liệu',
    icon: 'ShoppingBag',
    allowedRoles: ['O', 'M', 'PS'],
    group: 'CORE',
  },
  {
    key: 'raw-inventory',
    label: 'Kho Nguyên liệu',
    icon: 'Boxes',
    allowedRoles: ['O', 'M', 'WS'],
    group: 'WAREHOUSE_LOGISTICS',
  },
  {
    key: 'production-plan',
    label: 'Kế hoạch Sản xuất',
    icon: 'CalendarDays',
    allowedRoles: ['O', 'M', 'S'],
    group: 'PRODUCTION',
  },
  {
    key: 'shift-report',
    label: 'Báo cáo Ca Sản xuất',
    icon: 'ClipboardList',
    allowedRoles: ['O', 'M', 'S'],
    group: 'PRODUCTION',
  },
  {
    key: 'qc',
    label: 'Kiểm tra Chất lượng (KCS)',
    icon: 'CheckCircle2',
    allowedRoles: ['O', 'M', 'QC'],
    group: 'PRODUCTION',
  },
  {
    key: 'finished-goods',
    label: 'Kho Thành phẩm & LOT',
    icon: 'PackageCheck',
    allowedRoles: ['O', 'M', 'WS'],
    group: 'WAREHOUSE_LOGISTICS',
  },
  {
    key: 'outbound',
    label: 'Xuất xưởng & Bàn giao',
    icon: 'Truck',
    allowedRoles: ['O', 'M', 'WS', 'QC'],
    group: 'WAREHOUSE_LOGISTICS',
  },
  {
    key: 'maintenance',
    label: 'Sự cố & Bảo trì Cơ điện',
    icon: 'Wrench',
    allowedRoles: ['O', 'M', 'S', 'MS'],
    group: 'EQUIPMENT',
  },
  {
    key: 'machines',
    label: 'Danh mục Máy móc',
    icon: 'Cpu',
    allowedRoles: ['O', 'M', 'MS'],
    group: 'EQUIPMENT',
  },
  {
    key: 'partners',
    label: 'Đối tác Cung ứng & Khách hàng',
    icon: 'Building2',
    allowedRoles: ['O', 'M'],
    group: 'CORE',
  },
  {
    key: 'audit-logs',
    label: 'Nhật ký Kiểm toán Hệ thống',
    icon: 'History',
    allowedRoles: ['O', 'M', 'A'],
    group: 'ADMINISTRATION',
  },
  {
    key: 'user-admin',
    label: 'Quản trị Tài khoản & Phân quyền',
    icon: 'ShieldAlert',
    allowedRoles: ['A'], // STRICT ISOLATION: Admin only
    group: 'ADMINISTRATION',
  },
];

export const NAV_GROUPS: Record<
  NavItemConfig['group'],
  { title: string; defaultOpen?: boolean }
> = {
  CORE: { title: 'Quản trị & Thu mua', defaultOpen: true },
  PRODUCTION: { title: 'Quy trình Sản xuất', defaultOpen: false },
  WAREHOUSE_LOGISTICS: { title: 'Kho vận & Xuất xưởng', defaultOpen: false },
  EQUIPMENT: { title: 'Máy móc & Cơ điện', defaultOpen: false },
  ADMINISTRATION: { title: 'Hệ thống & Kiểm toán', defaultOpen: false },
};

/**
 * Granular Permission Matrix for Action Buttons
 */
export const Permissions = {
  // Purchasing Actions
  canCreatePurchaseAssignment: (role: RoleCode) => role === 'O' || role === 'M',
  canRecordPurchaseResult: (role: RoleCode, assignedStaffId?: string, currentUserId?: string) =>
    role === 'PS' && (!assignedStaffId || !currentUserId || assignedStaffId === currentUserId),
  canDecidePurchase: (role: RoleCode) => role === 'O' || role === 'M',
  canReceiveRawMaterial: (role: RoleCode) => role === 'WS', // Specialist physical action: Warehouse Staff only!

  // Production Planning
  canCreateProductionPlan: (role: RoleCode) => role === 'O' || role === 'M',
  canIssueRawMaterial: (role: RoleCode) => role === 'WS', // Specialist physical action
  canSubmitShiftReport: (role: RoleCode) => role === 'S', // Specialist operational action
  canDecideShiftReport: (role: RoleCode) => role === 'O' || role === 'M',

  // Quality Control
  canPerformQcTest: (role: RoleCode) => role === 'QC', // Specialist quality action
  canReceiveFinishedGoods: (role: RoleCode) => role === 'WS', // Specialist physical action

  // Outbound & Dispatch
  canCreateOutboundProposalFlowA: (role: RoleCode) => role === 'WS',
  canCreateOutboundProposalFlowB: (role: RoleCode) => role === 'O' || role === 'M',
  canManagerReviewOutbound: (role: RoleCode) => role === 'M',
  canOwnerDecideOutbound: (role: RoleCode) => role === 'O', // Owner exclusive!
  canOwnerOverrideCustomerOrPrice: (role: RoleCode) => role === 'O', // Owner exclusive!
  canRecordOutboundQc: (role: RoleCode) => role === 'QC',
  canOwnerDecideQcMismatch: (role: RoleCode) => role === 'O', // Owner exclusive!
  canRecordRecipientInfo: (role: RoleCode) => role === 'O' || role === 'M',
  canConfirmDispatch: (role: RoleCode) => role === 'WS', // Specialist physical action

  // Maintenance
  canReportMachineFailure: (role: RoleCode) => role === 'S' || role === 'O' || role === 'M',
  canAssignMaintenance: (role: RoleCode) => role === 'O' || role === 'M',
  canRequestMaintenanceMaterials: (role: RoleCode) => role === 'MS',
  canDecideMaintenanceMaterialItem: (role: RoleCode) => role === 'O' || role === 'M',
  canSubmitMaintenanceReport: (role: RoleCode) => role === 'MS',
  canApproveMaintenanceReport: (role: RoleCode) => role === 'O' || role === 'M',

  // Finance & Expense
  canManageFinance: (role: RoleCode) => role === 'O' || role === 'M',
  canApproveExpense: (role: RoleCode) => role === 'O', // Owner exclusive
  canProposeExpense: (role: RoleCode) => role === 'O' || role === 'M',
  canRecordMaterialPurchaseActual: (role: RoleCode) => role === 'MS' || role === 'M' || role === 'O',

  // Master Data
  canManageMachines: (role: RoleCode) => role === 'O' || role === 'M',
  canManagePartners: (role: RoleCode) => role === 'O' || role === 'M',

  // Admin Isolation
  canManageUsers: (role: RoleCode) => role === 'A',
  canViewBusinessData: (role: RoleCode) => role !== 'A', // Admin CANNOT view operational business data
};
