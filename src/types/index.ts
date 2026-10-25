/**
 * BATT PPMS - Domain Types & Data Contracts (Refactored V6.1)
 * CÔNG TY CỔ PHẦN NĂNG LƯỢNG TÁI TẠO BATT
 * Wood Pellet Manufacturing Process Management System
 */

export type RoleCode = 'O' | 'M' | 'PS' | 'WS' | 'S' | 'QC' | 'MS' | 'A';

export interface RoleInfo {
  code: RoleCode;
  name: string;
  vietnameseTitle: string;
  description: string;
}

export const ROLES: Record<RoleCode, RoleInfo> = {
  O: {
    code: 'O',
    name: 'Owner',
    vietnameseTitle: 'Giám đốc / Chủ sở hữu',
    description: 'Toàn quyền quản lý điều hành, phê duyệt xuất hàng, quyết định giá bán, quản trị tài chính và đối tác',
  },
  M: {
    code: 'M',
    name: 'Manager',
    vietnameseTitle: 'Quản lý Sản xuất & Vận hành',
    description: 'Lập kế hoạch, phân công thu mua, điều phối sản xuất, tiếp nhận sự cố máy móc và tạo đề xuất xuất hàng',
  },
  PS: {
    code: 'PS',
    name: 'Purchasing Staff',
    vietnameseTitle: 'Nhân viên Thu mua',
    description: 'Thực hiện phân công thu mua, cân hàng, ghi nhận kết quả và hóa đơn chứng từ',
  },
  WS: {
    code: 'WS',
    name: 'Warehouse Staff',
    vietnameseTitle: 'Nhân viên Thủ kho',
    description: 'Xác nhận/từ chối nhập kho NVL, cấp NVL, nhập kho thành phẩm A/B, tạo đề xuất xuất và xuất kho/từ chối xuất kho',
  },
  S: {
    code: 'S',
    name: 'Production Staff',
    vietnameseTitle: 'Công nhân Sản xuất',
    description: 'Vận hành công đoạn theo ca, ghi nhận sản lượng thực tế và báo cáo sự cố máy móc',
  },
  QC: {
    code: 'QC',
    name: 'QC Staff',
    vietnameseTitle: 'Nhân viên KCS / Quản lý Chất lượng',
    description: 'Thực hiện 3 lần kiểm tra chất lượng LOT, phân loại vào Kho A hoặc Kho B và kiểm tra QC xuất hàng',
  },
  MS: {
    code: 'MS',
    name: 'Maintenance Staff',
    vietnameseTitle: 'Nhân viên Bảo trì Cơ điện',
    description: 'Sửa chữa máy móc sự cố, đề xuất vật tư thay thế, ghi nhận mua vật tư và lập báo cáo hoàn thành',
  },
  A: {
    code: 'A',
    name: 'Admin System',
    vietnameseTitle: 'Quản trị viên Hệ thống',
    description: 'Quản lý tài khoản người dùng, phân quyền truy cập và kiểm toán an toàn hệ thống',
  },
};

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: RoleCode;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  phone: string;
  address: string;
  contactPerson: string;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
  totalPurchasedKg?: number;
  totalPaidVnd?: number;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  address: string;
  contactPerson: string;
  status: 'ACTIVE' | 'INACTIVE';
  paymentTerms?: string;
  totalOrderedKg?: number;
  totalReceivableVnd?: number;
}

export type MachineStatus = 'OPERATIONAL' | 'MAINTENANCE_REQUIRED' | 'UNDER_REPAIR' | 'DECOMMISSIONED';

export type ProductionStage = 
  | 'CLEANING'        // Làm sạch
  | 'CHIPPING'        // Băm
  | 'MILLING'         // Nghiền
  | 'DRYING'          // Sấy
  | 'POST_DRY_CHECK'  // Kiểm tra sau sấy
  | 'PELLETIZING'     // Ép viên
  | 'PACKAGING';      // Đóng bao Jumbo

export const STAGE_NAMES: Record<ProductionStage, string> = {
  CLEANING: '1. Làm sạch',
  CHIPPING: '2. Băm dăm',
  MILLING: '3. Nghiền mùn cưa',
  DRYING: '4. Sấy',
  POST_DRY_CHECK: '5. Kiểm tra sau sấy',
  PELLETIZING: '6. Ép viên',
  PACKAGING: '7. Đóng bao Jumbo',
};

export interface Machine {
  id: string;
  code: string;
  name: string;
  stage: ProductionStage;
  model: string;
  capacity: string;
  status: MachineStatus;
  installationDate: string;
  location: string;
}

// WF-01 Purchasing Management
export type PurchaseStatus = 
  | 'ASSIGNED'             // Đã phân công, chờ nhân viên đi mua
  | 'SUBMITTED'            // Đã cân và gửi kết quả, chờ duyệt
  | 'APPROVED'             // Quản lý/Owner đã duyệt, chờ thủ kho nhận
  | 'RETURNED'             // Bị trả lại để sửa thông tin
  | 'REJECTED'             // Bị từ chối
  | 'RECEIVED'             // Thủ kho đã xác nhận nhận hàng vào kho
  | 'REJECTED_BY_WAREHOUSE'; // Thủ kho từ chối nhận hàng

export interface PurchaseAssignment {
  id: string;
  code: string; // e.g. PO-2026-001
  supplierId: string;
  supplierName: string;
  rawMaterialType: string; // Fixed to "Nguyên vật liệu"
  plannedQuantityKg: number; // Khối lượng dự kiến (> 0)
  plannedDate: string;
  assignedStaffId: string;
  assignedStaffName: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  status: PurchaseStatus;
  assignmentNotes?: string; // Ghi chú của Owner/Manager khi giao việc (bắt buộc hiển thị cho PS)

  // Actual Purchase Result (filled by Purchasing Staff)
  weighedQuantityKg?: number; // Khối lượng cân thực tế
  unitPriceVnd?: number;      // Đơn giá (VND/kg)
  totalAmountVnd?: number;    // Khối lượng thực tế * Đơn giá
  weighedAt?: string;
  scaleTicketImageUrl?: string;
  invoiceImageUrl?: string;
  purchasingResultNotes?: string; // Ghi chú riêng của nhân viên thu mua
  submittedAt?: string;

  // Approval Information
  approvedById?: string;
  approvedByName?: string;
  approvalDecidedAt?: string;
  rejectionReason?: string;
  returnReason?: string;

  // Warehouse Receipt Information
  receivedQuantityKg?: number; // Khối lượng thực nhận vào kho
  receivedAt?: string;
  receivedById?: string;
  receivedByName?: string;
  warehouseNotes?: string;
  warehouseRejectionReason?: string; // Lý do thủ kho từ chối nhận hàng
}

// WF-02 Production Planning
export type PlanShift = 'CA_1' | 'CA_2' | 'CA_3';

export const SHIFT_NAMES: Record<PlanShift, string> = {
  CA_1: 'Ca 1 (06:00 - 14:00)',
  CA_2: 'Ca 2 (14:00 - 22:00)',
  CA_3: 'Ca 3 (22:00 - 06:00)',
};

export type PlanStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ProductionTaskAssignment {
  id: string;
  stage: ProductionStage;
  machineId: string;
  machineName: string;
  operatorIds: string[]; // Một máy có thể phân công nhiều nhân viên trong cùng ca!
  operatorNames: string[];
  targetQuantityKg: number;
  notes?: string;
}

export interface ProductionPlan {
  id: string;
  code: string; // e.g. PLAN-2026-042
  productionDate: string;
  shift: PlanShift;
  productName: string; // Fixed to "Viên nén gỗ"
  targetQuantityKg: number;
  status: PlanStatus;
  createdById: string;
  createdByName: string;
  createdAt: string;
  notes?: string;
  assignments: ProductionTaskAssignment[];
}

// WF-03 Raw Material Issuing
export interface RawMaterialIssue {
  id: string;
  code: string; // e.g. MAT-ISSUE-001
  planId: string;
  planCode: string;
  rawMaterialType: string;
  issuedQuantityKg: number;
  recipientDepartment: string;
  issuedAt: string;
  issuedById: string;
  issuedByName: string;
  notes?: string;
}

// WF-04 Production Shift Report
export type ShiftReportStatus = 'SUBMITTED' | 'APPROVED' | 'RETURNED' | 'REJECTED';

export interface ShiftReport {
  id: string;
  code: string; // e.g. REP-2026-088
  planId: string;
  planCode: string;
  productionDate: string;
  shift: PlanShift;
  stage: ProductionStage;
  machineId: string;
  machineName: string;
  actualMaterialUsedKg: number;
  actualOutputKg: number;
  status: ShiftReportStatus;
  hasIncident: boolean;
  incidentDescription?: string;
  imageUrl?: string;
  notes?: string;
  reportedById: string;
  reportedByName: string;
  reportedAt: string;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: string;
  returnReason?: string;
  rejectReason?: string;
  lotCodeGenerated?: string; // Generated LOT code when approved
}

// WF-05 Quality Control (QC theo ca phân loại Kho A hoặc Kho B)
export type FinishedWarehouseType = 'KHO_A' | 'KHO_B';

export interface SingleQcTest {
  testNumber: 1 | 2 | 3;
  testedAt: string;
  testedById: string;
  testedByName: string;
  moisturePercent: number;    // Độ ẩm (%) (chuẩn: 6-10%)
  ashPercent: number;         // Độ tro (%)
  impuritiesPercent: number;  // Tạp chất (%)
  calorificValueKcalKg?: number; // Nhiệt trị (kcal/kg)
  imageUrl?: string;
  notes?: string;
}

export type LotQcStatus = 'PENDING' | 'IN_TESTING' | 'QC_COMPLETED';

export interface LotItem {
  id: string;
  lotCode: string; // e.g. LOT-20261024-01
  planId: string;
  planCode: string;
  shiftReportId: string;
  productionDate: string;
  productName: string; // Fixed to "Viên nén gỗ"
  quantityKg: number;
  jumboBagsCount: number;
  targetWarehouse?: FinishedWarehouseType; // Kho A hoặc Kho B sau khi QC
  qcStatus: LotQcStatus;
  tests: SingleQcTest[]; // Exactly 3 independent tests
  isReceivedInWarehouse: boolean;
  receivedAt?: string;
  receivedById?: string;
  receivedByName?: string;
  availableQuantityKg: number; // Remaining inventory for dispatch
  createdAt: string;
}

// WF-07 Outbound Proposal (Warehouse Staff and Manager both send directly to Owner)
export type OutboundProposalStatus = 
  | 'PENDING_OWNER_APPROVAL' 
  | 'APPROVED' 
  | 'RETURNED' 
  | 'REJECTED' 
  | 'DISPATCHED'
  | 'REJECTED_BY_WAREHOUSE'; // Thủ kho từ chối xuất kho

export interface OutboundProposal {
  id: string;
  code: string; // e.g. OUT-PROP-2026-015
  creatorRole: 'WS' | 'M' | 'O';
  sourceWarehouse: FinishedWarehouseType; // Kho A hoặc Kho B
  customerId: string;
  customerName: string;
  originalCustomerId?: string; // If Owner changed customer, record original
  originalCustomerName?: string;
  productName: string; // "Viên nén gỗ"
  lotId: string;
  lotCode: string;
  requestedQuantityKg: number;
  
  // Selling Price is decided exclusively by Owner!
  unitPriceVnd?: number;
  totalValueVnd?: number;
  
  status: OutboundProposalStatus;
  notes?: string;

  createdById: string;
  createdByName: string;
  createdAt: string;

  ownerDecidedById?: string;
  ownerDecidedByName?: string;
  ownerDecidedAt?: string;
  returnReason?: string;
  rejectionReason?: string;

  // WF-08 Outbound QC
  outboundQcTested: boolean;
  outboundQcMoisture?: number;
  outboundQcAsh?: number;
  outboundQcImpurities?: number;
  outboundQcTestedById?: string;
  outboundQcTestedByName?: string;
  outboundQcTestedAt?: string;
  outboundQcMismatchDetected?: boolean;
  ownerMismatchDecision?: 'APPROVED_DISPATCH' | 'REQUIRE_RETEST' | 'REJECTED_DISPATCH';
  ownerMismatchDecisionNotes?: string;

  // WF-09 Recipient Pickup Info
  recipientName?: string;
  recipientPhone?: string;
  truckLicensePlate?: string;
  pickupTimeScheduled?: string;
  recipientRecordedById?: string;
  recipientRecordedByName?: string;
  recipientRecordedAt?: string;

  // Dispatch Execution
  isDispatched: boolean;
  actualDispatchedKg?: number;
  dispatchedAt?: string;
  dispatchedById?: string;
  dispatchedByName?: string;
  dispatchEvidenceImageUrl?: string;
  dispatchMismatchFlag?: boolean;
  dispatchRejectionReason?: string;
}

// WF-10 Machine Failure Reporting & WF-11 Maintenance
export type FailureSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type FailureStatus = 'REPORTED' | 'ASSIGNED' | 'UNDER_REPAIR' | 'COMPLETED' | 'REJECTED';

export interface MachineFailureReport {
  id: string;
  code: string; // e.g. INC-2026-031
  machineId: string;
  machineName: string;
  failureTime: string;
  symptoms: string;
  severity: FailureSeverity;
  imageUrl?: string;
  reportedById: string;
  reportedByName: string;
  reportedAt: string;
  status: FailureStatus;
  rejectionReason?: string;

  // Assigned in same single action by Owner/Manager
  assignedMaintenanceStaffId?: string;
  assignedMaintenanceStaffName?: string;
  assignedAt?: string;
  assignedById?: string;
  assignedByName?: string;
}

export interface MaintenanceReport {
  id: string;
  failureReportId: string;
  machineId: string;
  machineName: string;
  maintenanceStaffId: string;
  maintenanceStaffName: string;
  rootCause: string;
  actionsTaken: string;
  materialsUsedText: string;
  repairResult: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  submittedAt: string;
  isManagerApproved: boolean;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: string;
  returnReason?: string;
}

// WF-12 Maintenance Material Request & Actual Purchase Record
export type MaterialItemStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface MaintenanceMaterialItem {
  id: string;
  materialName: string;
  requestedQuantity: number;
  unit: string;
  reason: string;
  status: MaterialItemStatus;
  rejectionReason?: string;
  decidedById?: string;
  decidedByName?: string;
  decidedAt?: string;

  // Actual Purchase Record (Sec 29)
  isPurchased?: boolean;
  actualPurchasedQuantity?: number;
  actualUnitPriceVnd?: number;
  actualTotalAmountVnd?: number;
  purchasedAt?: string;
  supplierName?: string;
  invoiceUrl?: string;
  purchasedById?: string;
  purchasedByName?: string;
  purchaseNotes?: string;
}

export interface MaintenanceMaterialRequest {
  id: string;
  code: string; // e.g. MAT-REQ-2026-009
  failureReportId: string;
  machineName: string;
  maintenanceStaffId: string;
  maintenanceStaffName: string;
  createdAt: string;
  items: MaintenanceMaterialItem[];
}

// WF-14 & XIV: FINANCIAL MANAGEMENT (New Major Feature)
export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';

export interface SaleInvoice {
  id: string;
  code: string; // e.g. INV-2026-001
  proposalId: string;
  proposalCode: string;
  customerId: string;
  customerName: string;
  warehouseType: FinishedWarehouseType; // Kho A hoặc Kho B
  productName: string; // "Viên nén gỗ"
  dispatchedQuantityKg: number;
  unitPriceVnd: number;
  totalAmountVnd: number;
  paidAmountVnd: number;
  remainingAmountVnd: number;
  paymentStatus: PaymentStatus;
  invoiceDate: string;
  paymentHistory: {
    amount: number;
    paidAt: string;
    recordedByName: string;
    notes?: string;
  }[];
}

export type ExpenseCategory = 
  | 'FUEL_OIL'            // Xăng dầu vận hành
  | 'MAINTENANCE_PARTS'   // Mua vật tư bảo trì
  | 'MACHINE_REPAIR'      // Sửa chữa máy móc
  | 'TRANSPORTATION'      // Vận chuyển, logistics
  | 'OPERATIONAL_OTHER';  // Chi phí vận hành khác

export const EXPENSE_CATEGORY_NAMES: Record<ExpenseCategory, string> = {
  FUEL_OIL: 'Xăng dầu lò đốt & xe xúc',
  MAINTENANCE_PARTS: 'Vật tư bảo trì thay thế',
  MACHINE_REPAIR: 'Gia công & Sửa chữa cơ điện',
  TRANSPORTATION: 'Cước vận chuyển & Xe bốc xếp',
  OPERATIONAL_OTHER: 'Chi phí vận hành khác',
};

export type ExpenseStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'PAID' | 'REJECTED';

export interface ExpenseRecord {
  id: string;
  code: string; // e.g. EXP-2026-01
  expenseDate: string;
  category: ExpenseCategory;
  title: string;
  amountVnd: number;
  status: ExpenseStatus;
  linkedEntityId?: string; // e.g. material request id or machine id
  linkedEntityCode?: string;
  recipientOrVendor: string;
  receiptImageUrl?: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: string;
  paidAt?: string;
  paidById?: string;
  paidByName?: string;
  rejectionReason?: string;
}

// WF-18 Audit Logs & Stock Movements
export interface StockMovement {
  id: string;
  timestamp: string;
  materialCategory: 'RAW_MATERIAL' | 'FINISHED_GOODS';
  materialName: string;
  warehouseType?: FinishedWarehouseType; // Kho A hoặc Kho B
  movementType: 'IN' | 'OUT';
  quantityKg: number;
  referenceDocumentType: 'PURCHASE_RECEIPT' | 'RAW_MATERIAL_ISSUE' | 'FINISHED_GOODS_RECEIPT' | 'CUSTOMER_DISPATCH';
  referenceDocumentCode: string;
  lotCode?: string;
  confirmedById: string;
  confirmedByName: string;
  balanceAfterKg: number;
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: RoleCode;
  action: string;
  entityType: string;
  entityId: string;
  entityCode?: string;
  previousState?: string;
  newState?: string;
  reason?: string;
  details?: string;
}

export interface InternalNotification {
  id: string;
  recipientRole?: RoleCode;
  recipientUserId?: string;
  title: string;
  message: string;
  entityType: string;
  entityId: string;
  targetView: string;
  createdAt: string;
  isRead: boolean;
}
