/**
 * BATT PPMS - Relational Data Store & Business Transaction Engine (V6.1 Refactored)
 * CÔNG TY CỔ PHẦN NĂNG LƯỢNG TÁI TẠO BATT
 * Implements Single NVL, Kho A/B Finished Goods, Finance, Multi-Staff Machine, and Rejection Workflows
 */

import {
  User,
  Supplier,
  Customer,
  Machine,
  PurchaseAssignment,
  ProductionPlan,
  RawMaterialIssue,
  ShiftReport,
  LotItem,
  OutboundProposal,
  MachineFailureReport,
  MaintenanceReport,
  MaintenanceMaterialRequest,
  SaleInvoice,
  ExpenseRecord,
  StockMovement,
  AuditLog,
  InternalNotification,
  RoleCode,
  FinishedWarehouseType,
  ExpenseCategory,
} from '../types';

const STORAGE_KEY = 'batt_ppms_database_v6_1';

export const INITIAL_USERS: User[] = [
  {
    id: 'u-owner-01',
    username: 'owner_batt',
    fullName: 'Nguyễn Văn Thành (Giám đốc)',
    email: 'thanh.nv@battenergy.vn',
    phone: '0912.888.999',
    role: 'O',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'u-mgr-01',
    username: 'manager_sx',
    fullName: 'Trần Quốc Bảo (Trưởng phòng Vận hành)',
    email: 'bao.tq@battenergy.vn',
    phone: '0913.777.666',
    role: 'M',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'u-purchasing-01',
    username: 'muahang_quang',
    fullName: 'Lê Văn Quang (Thu mua)',
    email: 'quang.lv@battenergy.vn',
    phone: '0988.111.222',
    role: 'PS',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'u-wh-01',
    username: 'thukho_thao',
    fullName: 'Phạm Thị Phương Thảo (Thủ kho)',
    email: 'thao.ptp@battenergy.vn',
    phone: '0977.333.444',
    role: 'WS',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'u-prod-01',
    username: 'congnhan_hung',
    fullName: 'Hoàng Văn Hùng (Tổ trưởng Sản xuất)',
    email: 'hung.hv@battenergy.vn',
    phone: '0966.555.777',
    role: 'S',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'u-prod-02',
    username: 'congnhan_minh',
    fullName: 'Đặng Nhật Minh (Công nhân)',
    email: 'minh.dn@battenergy.vn',
    phone: '0966.333.222',
    role: 'S',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'u-qc-01',
    username: 'kcs_lan',
    fullName: 'Đỗ Thị Ngọc Lan (Trưởng nhóm KCS)',
    email: 'lan.dtn@battenergy.vn',
    phone: '0933.222.111',
    role: 'QC',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'u-maint-01',
    username: 'baotri_dung',
    fullName: 'Vũ Tiến Dũng (Kỹ sư Cơ điện)',
    email: 'dung.vt@battenergy.vn',
    phone: '0909.444.888',
    role: 'MS',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    createdAt: '2026-01-20T08:00:00Z',
  },
  {
    id: 'u-admin-01',
    username: 'admin_sys',
    fullName: 'Ngô Quang Khải (Quản trị Hệ thống)',
    email: 'admin@battenergy.vn',
    phone: '0901.000.001',
    role: 'A',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-01',
    code: 'NCC-01',
    name: 'Công ty TNHH Lâm Nghiệp Hàm Thuận',
    phone: '0252.386.1111',
    address: 'KCN Hàm Kiệm, Huyện Hàm Thuận Nam, Bình Thuận',
    contactPerson: 'Ông Nguyễn Đức Thắng',
    status: 'ACTIVE',
    notes: 'Đối tác chiến lược cung cấp nguyên vật liệu dăm & mùn cưa',
    totalPurchasedKg: 49550,
    totalPaidVnd: 37162500,
  },
  {
    id: 'sup-02',
    code: 'NCC-02',
    name: 'Xưởng Chế biến Gỗ Minh Phú',
    phone: '0252.399.2222',
    address: 'Thị trấn Ma Lâm, Hàm Thuận Bắc, Bình Thuận',
    contactPerson: 'Bà Lê Thị Mỹ',
    status: 'ACTIVE',
    totalPurchasedKg: 17850,
    totalPaidVnd: 14637000,
  },
  {
    id: 'sup-03',
    code: 'NCC-03',
    name: 'Hợp tác xã Gỗ Rừng Trồng Tánh Linh',
    phone: '0252.377.3333',
    address: 'Xã Đức Thuận, Huyện Tánh Linh, Bình Thuận',
    contactPerson: 'Ông Trần Văn Ba',
    status: 'ACTIVE',
    totalPurchasedKg: 29500,
    totalPaidVnd: 23010000,
  },
  {
    id: 'sup-04',
    code: 'NCC-04',
    name: 'Công ty Cổ phần Nông Lâm Sản Đức Linh',
    phone: '0252.366.4444',
    address: 'Võ Xu, Đức Linh, Bình Thuận',
    contactPerson: 'Ông Vũ Hoàng Nam',
    status: 'ACTIVE',
    totalPurchasedKg: 14900,
    totalPaidVnd: 10728000,
  },
  {
    id: 'sup-05',
    code: 'NCC-05',
    name: 'Doanh nghiệp Tư nhân Gỗ Nam Thành',
    phone: '0251.355.5555',
    address: 'KCN Sông Mây, Trảng Bom, Đồng Nai',
    contactPerson: 'Bà Hoàng Kim Oanh',
    status: 'ACTIVE',
  },
  {
    id: 'sup-06',
    code: 'NCC-06',
    name: 'Lâm trường Xuyên Mộc',
    phone: '0254.388.6666',
    address: 'Bông Trang, Xuyên Mộc, Bà Rịa - Vũng Tàu',
    contactPerson: 'Ông Đặng Quốc Dũng',
    status: 'ACTIVE',
  },
  {
    id: 'sup-07',
    code: 'NCC-07',
    name: 'Công ty TNHH Đại Việt',
    phone: '0274.377.7777',
    address: 'Tân Uyên, Bình Dương',
    contactPerson: 'Bà Mai Phương Thúy',
    status: 'ACTIVE',
  },
  {
    id: 'sup-08',
    code: 'NCC-08',
    name: 'Cơ sở Thu gom Sông Phan',
    phone: '0252.344.8888',
    address: 'Sông Phan, Hàm Tân, Bình Thuận',
    contactPerson: 'Ông Lê Hùng',
    status: 'ACTIVE',
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cus-01',
    code: 'KH-01',
    name: 'Sumitomo Forestry Co., Ltd (Japan)',
    phone: '+81.3.3286.7000',
    address: 'Chiyoda-ku, Tokyo, Japan / Chi nhánh TP.HCM',
    contactPerson: 'Mr. Kenji Sato / Trần Anh Tuấn',
    status: 'ACTIVE',
    paymentTerms: 'LC At Sight, kiểm hàng ENplus-A1 tại cảng Cái Mép',
    totalOrderedKg: 10000,
    totalReceivableVnd: 38500000,
  },
  {
    id: 'cus-02',
    code: 'KH-02',
    name: 'Doosan Heavy Industries & Construction (Korea)',
    phone: '+82.55.278.6114',
    address: 'Changwon, Gyeongnam, Korea',
    contactPerson: 'Mr. Park Ji Sung / Vũ Linh',
    status: 'ACTIVE',
    paymentTerms: 'T/T 30% trước, 70% sau khi nhận Bill of Lading',
  },
  {
    id: 'cus-03',
    code: 'KH-03',
    name: 'Nhà máy Nhiệt điện Sinh khối Duyên Hải',
    phone: '0294.388.1234',
    address: 'Dân Thành, Thị xã Duyên Hải, Trà Vinh',
    contactPerson: 'Kỹ sư trưởng Lê Thanh Phong',
    status: 'ACTIVE',
    paymentTerms: 'Thanh toán chuyển khoản sau 15 ngày đối soát khối lượng',
    totalOrderedKg: 5000,
    totalReceivableVnd: 18000000,
  },
  {
    id: 'cus-04',
    code: 'KH-04',
    name: 'Công ty Cổ phần Năng lượng Xanh IHI Vietnam',
    phone: '028.3822.4567',
    address: 'Quận 1, TP. Hồ Chí Minh',
    contactPerson: 'Bà Nguyễn Thu Trang',
    status: 'ACTIVE',
    paymentTerms: 'Hợp đồng nguyên tắc cấp 5.000 tấn/tháng',
  },
  {
    id: 'cus-05',
    code: 'KH-05',
    name: 'Tập đoàn Dệt may Phong Phú (Lò hơi công nghiệp)',
    phone: '028.3896.3533',
    address: 'Tăng Nhơn Phú B, TP. Thủ Đức, TP.HCM',
    contactPerson: 'Ông Đỗ Quốc Cường',
    status: 'ACTIVE',
    paymentTerms: 'Giao hàng tận nơi bằng xe tải thùng 30 tấn',
  },
  {
    id: 'cus-06',
    code: 'KH-06',
    name: 'Công ty TNHH Giấy Kraft Vina',
    phone: '0274.356.7890',
    address: 'KCN Mỹ Phước 3, Bến Cát, Bình Dương',
    contactPerson: 'Ông Phạm Văn Bình',
    status: 'ACTIVE',
    paymentTerms: 'Hạn mức thanh toán 30 ngày',
  },
];

export const INITIAL_MACHINES: Machine[] = [
  {
    id: 'm-01',
    code: 'M-CLEAN-01',
    name: 'Máy sàng làm sạch tạp chất và tách kim loại',
    stage: 'CLEANING',
    model: 'Rotary Screen BATT-50T',
    capacity: '35 tấn/giờ',
    status: 'OPERATIONAL',
    installationDate: '2024-03-15',
    location: 'Khu tiếp nhận NVL',
  },
  {
    id: 'm-02',
    code: 'M-CHIP-01',
    name: 'Máy băm dăm gỗ đĩa tròn công suất cao',
    stage: 'CHIPPING',
    model: 'Drum Chipper DC-1200',
    capacity: '25 tấn/giờ',
    status: 'OPERATIONAL',
    installationDate: '2024-03-20',
    location: 'Xưởng băm gỗ sơ bộ',
  },
  {
    id: 'm-03',
    code: 'M-MILL-01',
    name: 'Hệ thống máy nghiền búa siêu mịn',
    stage: 'MILLING',
    model: 'Hammer Mill HM-800',
    capacity: '20 tấn/giờ',
    status: 'OPERATIONAL',
    installationDate: '2024-04-01',
    location: 'Nhà nghiền bột gỗ',
  },
  {
    id: 'm-04',
    code: 'M-DRY-01',
    name: 'Hệ thống lò sấy thùng quay 3 pass',
    stage: 'DRYING',
    model: 'Rotary Drum Dryer Triple-Pass 3.2x24m',
    capacity: '15 tấn ẩm/giờ',
    status: 'OPERATIONAL',
    installationDate: '2024-04-10',
    location: 'Khu vực lò sấy sinh khối',
  },
  {
    id: 'm-05',
    code: 'M-CHECK-01',
    name: 'Băng tải kiểm tra độ ẩm hồng ngoại online',
    stage: 'POST_DRY_CHECK',
    model: 'NIR Moisture Sensor Conveyor',
    capacity: '25 tấn/giờ',
    status: 'OPERATIONAL',
    installationDate: '2024-04-15',
    location: 'Sau cửa xả lò sấy',
  },
  {
    id: 'm-06',
    code: 'M-PELLET-01',
    name: 'Máy ép viên nén khuôn vòng đứng CPM-1',
    stage: 'PELLETIZING',
    model: 'CPM Pellet Mill 7936-8',
    capacity: '4.5 tấn/giờ',
    status: 'OPERATIONAL',
    installationDate: '2024-05-01',
    location: 'Xưởng ép viên trung tâm',
  },
  {
    id: 'm-07',
    code: 'M-PELLET-02',
    name: 'Máy ép viên nén khuôn vòng đứng CPM-2',
    stage: 'PELLETIZING',
    model: 'CPM Pellet Mill 7936-8',
    capacity: '4.5 tấn/giờ',
    status: 'MAINTENANCE_REQUIRED',
    installationDate: '2024-05-01',
    location: 'Xưởng ép viên trung tâm',
  },
  {
    id: 'm-08',
    code: 'M-PACK-01',
    name: 'Trạm cân đóng bao Jumbo 1 tấn bán tự động',
    stage: 'PACKAGING',
    model: 'Jumbo Bagging Station JBS-1000',
    capacity: '15 bao/giờ',
    status: 'OPERATIONAL',
    installationDate: '2024-05-10',
    location: 'Kho thành phẩm',
  },
];

export interface AppDatabase {
  users: User[];
  suppliers: Supplier[];
  customers: Customer[];
  machines: Machine[];
  purchases: PurchaseAssignment[];
  productionPlans: ProductionPlan[];
  materialIssues: RawMaterialIssue[];
  shiftReports: ShiftReport[];
  lots: LotItem[];
  outboundProposals: OutboundProposal[];
  failures: MachineFailureReport[];
  maintenanceReports: MaintenanceReport[];
  materialRequests: MaintenanceMaterialRequest[];
  saleInvoices: SaleInvoice[];
  expenseRecords: ExpenseRecord[];
  stockMovements: StockMovement[];
  auditLogs: AuditLog[];
  notifications: InternalNotification[];
  rawInventoryBalanceKg: number; // Tồn kho NVL duy nhất (kg)
  finishedInventoryWarehouseA_Kg: number; // Kho A (kg)
  finishedInventoryWarehouseB_Kg: number; // Kho B (kg)
}

function getInitialDatabase(): AppDatabase {
  const purchases: PurchaseAssignment[] = [
    {
      id: 'po-01',
      code: 'PO-2026-001',
      supplierId: 'sup-01',
      supplierName: 'Công ty TNHH Lâm Nghiệp Hàm Thuận',
      rawMaterialType: 'Nguyên vật liệu',
      plannedQuantityKg: 25000,
      plannedDate: '2026-10-24',
      assignedStaffId: 'u-purchasing-01',
      assignedStaffName: 'Lê Văn Quang (Thu mua)',
      createdById: 'u-mgr-01',
      createdByName: 'Trần Quốc Bảo (Trưởng phòng Vận hành)',
      createdAt: '2026-10-24T08:00:00Z',
      status: 'RECEIVED',
      assignmentNotes: 'Cân tại trạm cân ngã tư Ma Lâm, lưu ý kiểm tra độ ẩm sơ bộ < 45%',
      weighedQuantityKg: 24800,
      unitPriceVnd: 750,
      totalAmountVnd: 18600000,
      weighedAt: '2026-10-24T10:15:00Z',
      scaleTicketImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600',
      invoiceImageUrl: 'https://images.unsplash.com/photo-1554415707-9e42acb69990?w=600',
      purchasingResultNotes: 'Xe chở 1 chuyến xe ben 3 chân, hao hụt bốc dỡ 200kg',
      submittedAt: '2026-10-24T10:30:00Z',
      approvedById: 'u-mgr-01',
      approvedByName: 'Trần Quốc Bảo (Trưởng phòng Vận hành)',
      approvalDecidedAt: '2026-10-24T11:00:00Z',
      receivedQuantityKg: 24750,
      receivedAt: '2026-10-24T11:30:00Z',
      receivedById: 'u-wh-01',
      receivedByName: 'Phạm Thị Phương Thảo (Thủ kho)',
      warehouseNotes: 'Đã nhận đủ và đổ vào bãi NVL số 1',
    },
    {
      id: 'po-02',
      code: 'PO-2026-002',
      supplierId: 'sup-02',
      supplierName: 'Xưởng Chế biến Gỗ Minh Phú',
      rawMaterialType: 'Nguyên vật liệu',
      plannedQuantityKg: 18000,
      plannedDate: '2026-10-24',
      assignedStaffId: 'u-purchasing-01',
      assignedStaffName: 'Lê Văn Quang (Thu mua)',
      createdById: 'u-owner-01',
      createdByName: 'Nguyễn Văn Thành (Giám đốc)',
      createdAt: '2026-10-24T09:00:00Z',
      status: 'APPROVED',
      assignmentNotes: 'Dăm bào khô chất lượng tốt cần cân nhập gấp trong ngày',
      weighedQuantityKg: 17850,
      unitPriceVnd: 820,
      totalAmountVnd: 14637000,
      weighedAt: '2026-10-24T13:45:00Z',
      scaleTicketImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600',
      purchasingResultNotes: 'Phiếu cân số 4821 Trạm cân ngã tư Ma Lâm',
      submittedAt: '2026-10-24T14:00:00Z',
      approvedById: 'u-owner-01',
      approvedByName: 'Nguyễn Văn Thành (Giám đốc)',
      approvalDecidedAt: '2026-10-24T14:30:00Z',
    },
    {
      id: 'po-03',
      code: 'PO-2026-003',
      supplierId: 'sup-03',
      supplierName: 'Hợp tác xã Gỗ Rừng Trồng Tánh Linh',
      rawMaterialType: 'Nguyên vật liệu',
      plannedQuantityKg: 30000,
      plannedDate: '2026-10-25',
      assignedStaffId: 'u-purchasing-01',
      assignedStaffName: 'Lê Văn Quang (Thu mua)',
      createdById: 'u-mgr-01',
      createdByName: 'Trần Quốc Bảo (Trưởng phòng Vận hành)',
      createdAt: '2026-10-24T15:00:00Z',
      status: 'SUBMITTED',
      assignmentNotes: 'Chờ duyệt kết quả cân thực tế từ Tánh Linh về',
      weighedQuantityKg: 29500,
      unitPriceVnd: 780,
      totalAmountVnd: 23010000,
      weighedAt: '2026-10-24T16:30:00Z',
      scaleTicketImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600',
      invoiceImageUrl: 'https://images.unsplash.com/photo-1554415707-9e42acb69990?w=600',
      purchasingResultNotes: 'Đã kèm biên bản cân điện tử trạm cầu Hàm Tân',
      submittedAt: '2026-10-24T16:45:00Z',
    },
    {
      id: 'po-04',
      code: 'PO-2026-004',
      supplierId: 'sup-04',
      supplierName: 'Công ty Cổ phần Nông Lâm Sản Đức Linh',
      rawMaterialType: 'Nguyên vật liệu',
      plannedQuantityKg: 15000,
      plannedDate: '2026-10-25',
      assignedStaffId: 'u-purchasing-01',
      assignedStaffName: 'Lê Văn Quang (Thu mua)',
      createdById: 'u-mgr-01',
      createdByName: 'Trần Quốc Bảo (Trưởng phòng Vận hành)',
      createdAt: '2026-10-24T10:00:00Z',
      status: 'RETURNED',
      assignmentNotes: 'Hàng vụ hè thu, cần gửi kèm hóa đơn VAT',
      weighedQuantityKg: 14900,
      unitPriceVnd: 720,
      totalAmountVnd: 10728000,
      weighedAt: '2026-10-24T11:00:00Z',
      returnReason: 'Hình chụp phiếu cân bị nhòe số seri và thiếu ảnh hóa đơn VAT của nhà cung cấp Đức Linh. Vui lòng chụp lại rõ nét.',
      submittedAt: '2026-10-24T11:15:00Z',
    },
    {
      id: 'po-05',
      code: 'PO-2026-005',
      supplierId: 'sup-05',
      supplierName: 'Doanh nghiệp Tư nhân Gỗ Nam Thành',
      rawMaterialType: 'Nguyên vật liệu',
      plannedQuantityKg: 20000,
      plannedDate: '2026-10-26',
      assignedStaffId: 'u-purchasing-01',
      assignedStaffName: 'Lê Văn Quang (Thu mua)',
      createdById: 'u-mgr-01',
      createdByName: 'Trần Quốc Bảo (Trưởng phòng Vận hành)',
      createdAt: '2026-10-24T16:00:00Z',
      status: 'ASSIGNED',
      assignmentNotes: 'Phân công đi cân nhận ngày 26/10, liên hệ trước bà Oanh',
    },
  ];

  const productionPlans: ProductionPlan[] = [
    {
      id: 'plan-01',
      code: 'PLAN-2026-042',
      productionDate: '2026-10-24',
      shift: 'CA_1',
      productName: 'Viên nén gỗ',
      targetQuantityKg: 20000,
      status: 'COMPLETED',
      createdById: 'u-mgr-01',
      createdByName: 'Trần Quốc Bảo (Trưởng phòng Vận hành)',
      createdAt: '2026-10-23T15:00:00Z',
      notes: 'Ưu tiên ép máy M-PELLET-01, kiểm soát độ ẩm lò sấy < 10%',
      assignments: [
        {
          id: 'tsk-01',
          stage: 'CLEANING',
          machineId: 'm-01',
          machineName: 'Máy sàng làm sạch tạp chất (M-CLEAN-01)',
          operatorIds: ['u-prod-01', 'u-prod-02'],
          operatorNames: ['Hoàng Văn Hùng', 'Đặng Nhật Minh'],
          targetQuantityKg: 24000,
        },
        {
          id: 'tsk-02',
          stage: 'DRYING',
          machineId: 'm-04',
          machineName: 'Hệ thống lò sấy thùng quay (M-DRY-01)',
          operatorIds: ['u-prod-01'],
          operatorNames: ['Hoàng Văn Hùng'],
          targetQuantityKg: 22000,
        },
        {
          id: 'tsk-03',
          stage: 'PELLETIZING',
          machineId: 'm-06',
          machineName: 'Máy ép viên nén CPM-1 (M-PELLET-01)',
          operatorIds: ['u-prod-01', 'u-prod-02'],
          operatorNames: ['Hoàng Văn Hùng', 'Đặng Nhật Minh'],
          targetQuantityKg: 20000,
        },
        {
          id: 'tsk-04',
          stage: 'PACKAGING',
          machineId: 'm-08',
          machineName: 'Trạm cân đóng bao Jumbo 1 tấn (M-PACK-01)',
          operatorIds: ['u-prod-01'],
          operatorNames: ['Hoàng Văn Hùng'],
          targetQuantityKg: 20000,
        },
      ],
    },
    {
      id: 'plan-02',
      code: 'PLAN-2026-043',
      productionDate: '2026-10-24',
      shift: 'CA_2',
      productName: 'Viên nén gỗ',
      targetQuantityKg: 18000,
      status: 'IN_PROGRESS',
      createdById: 'u-owner-01',
      createdByName: 'Nguyễn Văn Thành (Giám đốc)',
      createdAt: '2026-10-24T07:30:00Z',
      notes: 'Sản xuất liên tục, giữ nhiệt độ buồng sấy 85-90°C',
      assignments: [
        {
          id: 'tsk-05',
          stage: 'MILLING',
          machineId: 'm-03',
          machineName: 'Hệ thống máy nghiền búa (M-MILL-01)',
          operatorIds: ['u-prod-01', 'u-prod-02'],
          operatorNames: ['Hoàng Văn Hùng', 'Đặng Nhật Minh'],
          targetQuantityKg: 20000,
        },
        {
          id: 'tsk-06',
          stage: 'PELLETIZING',
          machineId: 'm-06',
          machineName: 'Máy ép viên nén CPM-1 (M-PELLET-01)',
          operatorIds: ['u-prod-01'],
          operatorNames: ['Hoàng Văn Hùng'],
          targetQuantityKg: 18000,
        },
      ],
    },
  ];

  const materialIssues: RawMaterialIssue[] = [
    {
      id: 'mat-iss-01',
      code: 'MAT-ISS-001',
      planId: 'plan-01',
      planCode: 'PLAN-2026-042',
      rawMaterialType: 'Nguyên vật liệu',
      issuedQuantityKg: 22500,
      recipientDepartment: 'Tổ Vận hành Lò Sấy & Ép Viên',
      issuedAt: '2026-10-24T06:15:00Z',
      issuedById: 'u-wh-01',
      issuedByName: 'Phạm Thị Phương Thảo (Thủ kho)',
      notes: 'Cấp đủ cho ca 1 sản xuất',
    },
  ];

  const shiftReports: ShiftReport[] = [
    {
      id: 'rep-01',
      code: 'REP-2026-088',
      planId: 'plan-01',
      planCode: 'PLAN-2026-042',
      productionDate: '2026-10-24',
      shift: 'CA_1',
      stage: 'PACKAGING',
      machineId: 'm-08',
      machineName: 'Trạm cân đóng bao Jumbo 1 tấn (M-PACK-01)',
      actualMaterialUsedKg: 21800,
      actualOutputKg: 20000,
      status: 'APPROVED',
      hasIncident: false,
      notes: 'Máy ép chạy êm, viên bóng đều, đóng đủ 20 bao Jumbo',
      reportedById: 'u-prod-01',
      reportedByName: 'Hoàng Văn Hùng (Tổ trưởng Sản xuất)',
      reportedAt: '2026-10-24T14:10:00Z',
      approvedById: 'u-mgr-01',
      approvedByName: 'Trần Quốc Bảo (Trưởng phòng Vận hành)',
      approvedAt: '2026-10-24T14:30:00Z',
      lotCodeGenerated: 'LOT-20261024-01',
    },
    {
      id: 'rep-02',
      code: 'REP-2026-089',
      planId: 'plan-02',
      planCode: 'PLAN-2026-043',
      productionDate: '2026-10-24',
      shift: 'CA_2',
      stage: 'PELLETIZING',
      machineId: 'm-06',
      machineName: 'Máy ép viên nén CPM-1 (M-PELLET-01)',
      actualMaterialUsedKg: 10500,
      actualOutputKg: 9500,
      status: 'SUBMITTED',
      hasIncident: false,
      notes: 'Đang tiếp tục ca, tạm báo cáo sản lượng nửa ca đầu',
      reportedById: 'u-prod-01',
      reportedByName: 'Hoàng Văn Hùng (Tổ trưởng Sản xuất)',
      reportedAt: '2026-10-24T18:00:00Z',
    },
  ];

  const lots: LotItem[] = [
    {
      id: 'lot-01',
      lotCode: 'LOT-20261024-01',
      planId: 'plan-01',
      planCode: 'PLAN-2026-042',
      shiftReportId: 'rep-01',
      productionDate: '2026-10-24',
      productName: 'Viên nén gỗ',
      quantityKg: 20000,
      jumboBagsCount: 20,
      targetWarehouse: 'KHO_A', // Phân loại vào Kho A sau khi QC
      qcStatus: 'QC_COMPLETED',
      isReceivedInWarehouse: true,
      receivedAt: '2026-10-24T15:00:00Z',
      receivedById: 'u-wh-01',
      receivedByName: 'Phạm Thị Phương Thảo (Thủ kho)',
      availableQuantityKg: 10000, // 10,000 đã xuất, 10,000 còn lại
      createdAt: '2026-10-24T14:30:00Z',
      tests: [
        {
          testNumber: 1,
          testedAt: '2026-10-24T08:30:00Z',
          testedById: 'u-qc-01',
          testedByName: 'Đỗ Thị Ngọc Lan (Trưởng nhóm KCS)',
          moisturePercent: 7.8,
          ashPercent: 0.65,
          impuritiesPercent: 0.12,
          calorificValueKcalKg: 4620,
          notes: 'Mẫu đầu ca 1: Đạt chuẩn xuất khẩu ENplus-A1',
        },
        {
          testNumber: 2,
          testedAt: '2026-10-24T11:00:00Z',
          testedById: 'u-qc-01',
          testedByName: 'Đỗ Thị Ngọc Lan (Trưởng nhóm KCS)',
          moisturePercent: 8.1,
          ashPercent: 0.70,
          impuritiesPercent: 0.15,
          calorificValueKcalKg: 4600,
          notes: 'Mẫu giữa ca: Độ ẩm ổn định, độ bền cơ học cao',
        },
        {
          testNumber: 3,
          testedAt: '2026-10-24T13:45:00Z',
          testedById: 'u-qc-01',
          testedByName: 'Đỗ Thị Ngọc Lan (Trưởng nhóm KCS)',
          moisturePercent: 7.9,
          ashPercent: 0.68,
          impuritiesPercent: 0.11,
          calorificValueKcalKg: 4635,
          notes: 'Mẫu cuối ca: Đạt 3/3 lần kiểm tra, xác nhận phân vào Kho A',
        },
      ],
    },
    {
      id: 'lot-02',
      lotCode: 'LOT-20261024-02',
      planId: 'plan-02',
      planCode: 'PLAN-2026-043',
      shiftReportId: 'rep-02',
      productionDate: '2026-10-24',
      productName: 'Viên nén gỗ',
      quantityKg: 18000,
      jumboBagsCount: 18,
      targetWarehouse: 'KHO_B', // Phân loại vào Kho B sau khi QC
      qcStatus: 'IN_TESTING',
      isReceivedInWarehouse: false,
      availableQuantityKg: 18000,
      createdAt: '2026-10-24T18:00:00Z',
      tests: [
        {
          testNumber: 1,
          testedAt: '2026-10-24T18:30:00Z',
          testedById: 'u-qc-01',
          testedByName: 'Đỗ Thị Ngọc Lan (Trưởng nhóm KCS)',
          moisturePercent: 9.4,
          ashPercent: 1.25,
          impuritiesPercent: 0.35,
          calorificValueKcalKg: 4410,
          notes: 'Kiểm tra lần 1: Đạt tiêu chuẩn phân loại Kho B (Công nghiệp)',
        },
      ],
    },
  ];

  const outboundProposals: OutboundProposal[] = [
    {
      id: 'out-01',
      code: 'OUT-PROP-2026-015',
      creatorRole: 'M',
      sourceWarehouse: 'KHO_A',
      customerId: 'cus-01',
      customerName: 'Sumitomo Forestry Co., Ltd (Japan)',
      productName: 'Viên nén gỗ',
      lotId: 'lot-01',
      lotCode: 'LOT-20261024-01',
      requestedQuantityKg: 10000,
      unitPriceVnd: 3850,
      totalValueVnd: 38500000,
      status: 'DISPATCHED',
      notes: 'Đơn hàng xuất xưởng 10 bao Jumbo giao cảng Cái Mép',
      createdById: 'u-mgr-01',
      createdByName: 'Trần Quốc Bảo (Trưởng phòng Vận hành)',
      createdAt: '2026-10-24T15:15:00Z',
      ownerDecidedById: 'u-owner-01',
      ownerDecidedByName: 'Nguyễn Văn Thành (Giám đốc)',
      ownerDecidedAt: '2026-10-24T15:30:00Z',
      outboundQcTested: true,
      outboundQcMoisture: 8.0,
      outboundQcAsh: 0.69,
      outboundQcImpurities: 0.12,
      outboundQcTestedById: 'u-qc-01',
      outboundQcTestedByName: 'Đỗ Thị Ngọc Lan (Trưởng nhóm KCS)',
      outboundQcTestedAt: '2026-10-24T15:45:00Z',
      recipientName: 'Đặng Tuấn Kiệt',
      recipientPhone: '0908.123.456',
      truckLicensePlate: '72C-184.92',
      pickupTimeScheduled: '2026-10-24T16:00:00Z',
      recipientRecordedById: 'u-mgr-01',
      recipientRecordedByName: 'Trần Quốc Bảo (Trưởng phòng Vận hành)',
      recipientRecordedAt: '2026-10-24T15:50:00Z',
      isDispatched: true,
      actualDispatchedKg: 10000,
      dispatchedAt: '2026-10-24T16:30:00Z',
      dispatchedById: 'u-wh-01',
      dispatchedByName: 'Phạm Thị Phương Thảo (Thủ kho)',
      dispatchEvidenceImageUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600',
    },
    {
      id: 'out-02',
      code: 'OUT-PROP-2026-016',
      creatorRole: 'WS',
      sourceWarehouse: 'KHO_A',
      customerId: 'cus-03',
      customerName: 'Nhà máy Nhiệt điện Sinh khối Duyên Hải',
      productName: 'Viên nén gỗ',
      lotId: 'lot-01',
      lotCode: 'LOT-20261024-01',
      requestedQuantityKg: 5000,
      status: 'PENDING_OWNER_APPROVAL',
      notes: 'Thủ kho đề xuất xuất 5 bao Jumbo còn lại trong Kho A',
      createdById: 'u-wh-01',
      createdByName: 'Phạm Thị Phương Thảo (Thủ kho)',
      createdAt: '2026-10-24T16:45:00Z',
      outboundQcTested: true,
      outboundQcMoisture: 7.9,
      outboundQcAsh: 0.67,
      outboundQcImpurities: 0.13,
      outboundQcTestedById: 'u-qc-01',
      outboundQcTestedByName: 'Đỗ Thị Ngọc Lan (Trưởng nhóm KCS)',
      outboundQcTestedAt: '2026-10-24T17:15:00Z',
      recipientName: 'Võ Minh Tâm',
      recipientPhone: '0918.456.789',
      truckLicensePlate: '86C-235.88',
      pickupTimeScheduled: '2026-10-25T08:30:00Z',
      recipientRecordedById: 'u-mgr-01',
      recipientRecordedByName: 'Trần Quốc Bảo (Trưởng phòng Vận hành)',
      recipientRecordedAt: '2026-10-24T17:20:00Z',
      isDispatched: false,
    },
  ];

  const failures: MachineFailureReport[] = [
    {
      id: 'inc-01',
      code: 'INC-2026-031',
      machineId: 'm-07',
      machineName: 'Máy ép viên nén CPM-2 (M-PELLET-02)',
      failureTime: '2026-10-24T09:30:00Z',
      symptoms: 'Rung lắc mạnh ổ bi chính, nhiệt độ gối đỡ tăng quá 85°C',
      severity: 'HIGH',
      reportedById: 'u-prod-01',
      reportedByName: 'Hoàng Văn Hùng (Tổ trưởng Sản xuất)',
      reportedAt: '2026-10-24T09:40:00Z',
      status: 'ASSIGNED',
      assignedMaintenanceStaffId: 'u-maint-01',
      assignedMaintenanceStaffName: 'Vũ Tiến Dũng (Kỹ sư Cơ điện)',
      assignedAt: '2026-10-24T09:50:00Z',
      assignedById: 'u-mgr-01',
      assignedByName: 'Trần Quốc Bảo (Trưởng phòng Vận hành)',
    },
  ];

  const materialRequests: MaintenanceMaterialRequest[] = [
    {
      id: 'mat-req-01',
      code: 'MAT-REQ-2026-009',
      failureReportId: 'inc-01',
      machineName: 'Máy ép viên nén CPM-2 (M-PELLET-02)',
      maintenanceStaffId: 'u-maint-01',
      maintenanceStaffName: 'Vũ Tiến Dũng (Kỹ sư Cơ điện)',
      createdAt: '2026-10-24T10:15:00Z',
      items: [
        {
          id: 'item-01',
          materialName: 'Vòng bi tự lựa SKF 22328 CC/W33',
          requestedQuantity: 2,
          unit: 'Cái',
          reason: 'Vòng bi cũ bị mòn rãnh lăn và cháy rọ đồng do quá nhiệt',
          status: 'APPROVED',
          decidedById: 'u-mgr-01',
          decidedByName: 'Trần Quốc Bảo (Trưởng phòng Vận hành)',
          decidedAt: '2026-10-24T10:30:00Z',
          isPurchased: true,
          actualPurchasedQuantity: 2,
          actualUnitPriceVnd: 4200000,
          actualTotalAmountVnd: 8400000,
          purchasedAt: '2026-10-24T11:00:00Z',
          supplierName: 'Đại lý Vòng bi SKF Bình Thuận',
          purchasedById: 'u-maint-01',
          purchasedByName: 'Vũ Tiến Dũng (Kỹ sư Cơ điện)',
        },
        {
          id: 'item-02',
          materialName: 'Mỡ bò chịu nhiệt Mobilith SHC 220',
          requestedQuantity: 5,
          unit: 'Tuýp 400g',
          reason: 'Bơm bôi trơn cụm gối đỡ trục chính máy ép',
          status: 'APPROVED',
          decidedById: 'u-mgr-01',
          decidedByName: 'Trần Quốc Bảo (Trưởng phòng Vận hành)',
          decidedAt: '2026-10-24T10:30:00Z',
          isPurchased: true,
          actualPurchasedQuantity: 5,
          actualUnitPriceVnd: 380000,
          actualTotalAmountVnd: 1900000,
          purchasedAt: '2026-10-24T11:00:00Z',
          supplierName: 'Nhà phân phối dầu mỡ nhờn Tân Phát',
          purchasedById: 'u-maint-01',
          purchasedByName: 'Vũ Tiến Dũng (Kỹ sư Cơ điện)',
        },
        {
          id: 'item-03',
          materialName: 'Dây curoa Gates 8V-2500',
          requestedQuantity: 8,
          unit: 'Sợi',
          reason: 'Dự phòng bộ truyền động motor chính',
          status: 'REJECTED',
          rejectionReason: 'Dây curoa hiện tại kiểm tra vẫn còn tốt, chỉ duyệt vòng bi và mỡ bôi trơn để sửa dứt điểm sự cố.',
          decidedById: 'u-mgr-01',
          decidedByName: 'Trần Quốc Bảo (Trưởng phòng Vận hành)',
          decidedAt: '2026-10-24T10:30:00Z',
        },
      ],
    },
  ];

  const maintenanceReports: MaintenanceReport[] = [];

  // Financial Initial Records
  const saleInvoices: SaleInvoice[] = [
    {
      id: 'inv-01',
      code: 'INV-2026-001',
      proposalId: 'out-01',
      proposalCode: 'OUT-PROP-2026-015',
      customerId: 'cus-01',
      customerName: 'Sumitomo Forestry Co., Ltd (Japan)',
      warehouseType: 'KHO_A',
      productName: 'Viên nén gỗ',
      dispatchedQuantityKg: 10000,
      unitPriceVnd: 3850,
      totalAmountVnd: 38500000,
      paidAmountVnd: 20000000,
      remainingAmountVnd: 18500000,
      paymentStatus: 'PARTIALLY_PAID',
      invoiceDate: '2026-10-24',
      paymentHistory: [
        {
          amount: 20000000,
          paidAt: '2026-10-24T17:00:00Z',
          recordedByName: 'Nguyễn Văn Thành (Giám đốc)',
          notes: 'Tạm ứng đợt 1 qua LC ngân hàng Vietcombank',
        },
      ],
    },
  ];

  const expenseRecords: ExpenseRecord[] = [
    {
      id: 'exp-01',
      code: 'EXP-2026-001',
      expenseDate: '2026-10-24',
      category: 'MAINTENANCE_PARTS',
      title: 'Mua vòng bi SKF & mỡ bôi trơn máy ép CPM-2',
      amountVnd: 10300000, // 8.4M + 1.9M
      status: 'PAID',
      linkedEntityId: 'mat-req-01',
      linkedEntityCode: 'MAT-REQ-2026-009',
      recipientOrVendor: 'Đại lý Vòng bi SKF & Dầu nhớt Tân Phát',
      createdById: 'u-maint-01',
      createdByName: 'Vũ Tiến Dũng (Kỹ sư Cơ điện)',
      createdAt: '2026-10-24T11:00:00Z',
      approvedById: 'u-owner-01',
      approvedByName: 'Nguyễn Văn Thành (Giám đốc)',
      approvedAt: '2026-10-24T11:15:00Z',
      paidAt: '2026-10-24T11:30:00Z',
      paidById: 'u-owner-01',
      paidByName: 'Nguyễn Văn Thành (Giám đốc)',
    },
    {
      id: 'exp-02',
      code: 'EXP-2026-002',
      expenseDate: '2026-10-24',
      category: 'FUEL_OIL',
      title: 'Đổ dầu DO cho 2 xe xúc lật cấp mùn cưa và lò sấy',
      amountVnd: 12500000,
      status: 'PAID',
      recipientOrVendor: 'Cửa hàng Xăng dầu Petrolimex Hàm Kiệm',
      createdById: 'u-mgr-01',
      createdByName: 'Trần Quốc Bảo (Trưởng phòng Vận hành)',
      createdAt: '2026-10-24T08:00:00Z',
      approvedById: 'u-owner-01',
      approvedByName: 'Nguyễn Văn Thành (Giám đốc)',
      approvedAt: '2026-10-24T08:30:00Z',
      paidAt: '2026-10-24T09:00:00Z',
      paidById: 'u-owner-01',
      paidByName: 'Nguyễn Văn Thành (Giám đốc)',
    },
  ];

  const stockMovements: StockMovement[] = [
    {
      id: 'sm-01',
      timestamp: '2026-10-24T11:30:00Z',
      materialCategory: 'RAW_MATERIAL',
      materialName: 'Nguyên vật liệu',
      movementType: 'IN',
      quantityKg: 24750,
      referenceDocumentType: 'PURCHASE_RECEIPT',
      referenceDocumentCode: 'PO-2026-001',
      confirmedById: 'u-wh-01',
      confirmedByName: 'Phạm Thị Phương Thảo (Thủ kho)',
      balanceAfterKg: 44500,
      notes: 'Nhập kho thực tế từ xe cân PO-2026-001',
    },
    {
      id: 'sm-02',
      timestamp: '2026-10-24T06:15:00Z',
      materialCategory: 'RAW_MATERIAL',
      materialName: 'Nguyên vật liệu',
      movementType: 'OUT',
      quantityKg: 22500,
      referenceDocumentType: 'RAW_MATERIAL_ISSUE',
      referenceDocumentCode: 'MAT-ISS-001',
      confirmedById: 'u-wh-01',
      confirmedByName: 'Phạm Thị Phương Thảo (Thủ kho)',
      balanceAfterKg: 22000,
      notes: 'Cấp NVL cho Kế hoạch sản xuất PLAN-2026-042',
    },
    {
      id: 'sm-03',
      timestamp: '2026-10-24T15:00:00Z',
      materialCategory: 'FINISHED_GOODS',
      materialName: 'Viên nén gỗ',
      warehouseType: 'KHO_A',
      movementType: 'IN',
      quantityKg: 20000,
      referenceDocumentType: 'FINISHED_GOODS_RECEIPT',
      referenceDocumentCode: 'LOT-20261024-01',
      lotCode: 'LOT-20261024-01',
      confirmedById: 'u-wh-01',
      confirmedByName: 'Phạm Thị Phương Thảo (Thủ kho)',
      balanceAfterKg: 20000,
      notes: 'Nhập 20 bao Jumbo LOT-20261024-01 vào Kho A',
    },
    {
      id: 'sm-04',
      timestamp: '2026-10-24T16:30:00Z',
      materialCategory: 'FINISHED_GOODS',
      materialName: 'Viên nén gỗ',
      warehouseType: 'KHO_A',
      movementType: 'OUT',
      quantityKg: 10000,
      referenceDocumentType: 'CUSTOMER_DISPATCH',
      referenceDocumentCode: 'OUT-PROP-2026-015',
      lotCode: 'LOT-20261024-01',
      confirmedById: 'u-wh-01',
      confirmedByName: 'Phạm Thị Phương Thảo (Thủ kho)',
      balanceAfterKg: 10000,
      notes: 'Xuất kho từ Kho A giao khách hàng Sumitomo (Xe 72C-184.92)',
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'aud-01',
      timestamp: '2026-10-24T08:00:00Z',
      actorId: 'u-mgr-01',
      actorName: 'Trần Quốc Bảo',
      actorRole: 'M',
      action: 'Tạo phân công thu mua',
      entityType: 'PURCHASE_ASSIGNMENT',
      entityId: 'po-01',
      entityCode: 'PO-2026-001',
      newState: 'ASSIGNED',
      details: 'Phân công Lê Văn Quang thu mua 25.000 kg Nguyên vật liệu từ NCC Hàm Thuận',
    },
    {
      id: 'aud-02',
      timestamp: '2026-10-24T10:30:00Z',
      actorId: 'u-purchasing-01',
      actorName: 'Lê Văn Quang',
      actorRole: 'PS',
      action: 'Ghi kết quả thu mua',
      entityType: 'PURCHASE_ASSIGNMENT',
      entityId: 'po-01',
      entityCode: 'PO-2026-001',
      previousState: 'ASSIGNED',
      newState: 'SUBMITTED',
      details: 'Cân thực tế 24.800 kg, đơn giá 750 VND/kg, tổng 18.600.000 VND',
    },
    {
      id: 'aud-03',
      timestamp: '2026-10-24T11:00:00Z',
      actorId: 'u-mgr-01',
      actorName: 'Trần Quốc Bảo',
      actorRole: 'M',
      action: 'Phê duyệt hồ sơ thu mua',
      entityType: 'PURCHASE_ASSIGNMENT',
      entityId: 'po-01',
      entityCode: 'PO-2026-001',
      previousState: 'SUBMITTED',
      newState: 'APPROVED',
      details: 'Quản lý duyệt hồ sơ chuyển bước chờ nhập kho',
    },
  ];

  const notifications: InternalNotification[] = [
    {
      id: 'notif-01',
      recipientRole: 'O',
      title: 'Đề xuất xuất hàng chờ Owner quyết định',
      message: 'Đề xuất OUT-PROP-2026-016 (5.000 kg từ Kho A) đang chờ quyết định giá bán và duyệt xuất',
      entityType: 'OUTBOUND_PROPOSAL',
      entityId: 'out-02',
      targetView: 'outbound',
      createdAt: '2026-10-24T17:00:00Z',
      isRead: false,
    },
    {
      id: 'notif-02',
      recipientRole: 'WS',
      title: 'NVL đã duyệt chờ nhập kho',
      message: 'Phiếu thu mua PO-2026-002 (17.850 kg) đã được duyệt, sẵn sàng tiếp nhận hoặc từ chối',
      entityType: 'PURCHASE_ASSIGNMENT',
      entityId: 'po-02',
      targetView: 'raw-inventory',
      createdAt: '2026-10-24T14:30:00Z',
      isRead: false,
    },
  ];

  return {
    users: INITIAL_USERS,
    suppliers: INITIAL_SUPPLIERS,
    customers: INITIAL_CUSTOMERS,
    machines: INITIAL_MACHINES,
    purchases,
    productionPlans,
    materialIssues,
    shiftReports,
    lots,
    outboundProposals,
    failures,
    maintenanceReports,
    materialRequests,
    saleInvoices,
    expenseRecords,
    stockMovements,
    auditLogs,
    notifications,
    rawInventoryBalanceKg: 22000 + 24750, // 46,750 kg
    finishedInventoryWarehouseA_Kg: 10000, // 10,000 kg Kho A
    finishedInventoryWarehouseB_Kg: 0,     // 0 kg Kho B
  };
}

class DatabaseService {
  private data: AppDatabase;
  private listeners: (() => void)[] = [];

  constructor() {
    this.data = this.load();
  }

  private load(): AppDatabase {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.users && parsed.purchases && parsed.saleInvoices) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    const initial = getInitialDatabase();
    this.persist(initial);
    return initial;
  }

  private persist(newData: AppDatabase) {
    this.data = newData;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch {
      // ignore
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public getSnapshot(): AppDatabase {
    return this.data;
  }

  public resetToDefault() {
    const initial = getInitialDatabase();
    this.persist(initial);
  }

  // --- Audit Logging ---
  public addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const log: AuditLog = {
      ...entry,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    this.persist({ ...this.data });
  }

  // --- Notification ---
  public addNotification(notif: Omit<InternalNotification, 'id' | 'createdAt' | 'isRead'>) {
    const notification: InternalNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    this.data.notifications.unshift(notification);
    this.persist({ ...this.data });
  }

  public markNotificationAsRead(id: string) {
    const notifs = this.data.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    this.persist({ ...this.data, notifications: notifs });
  }

  public markAllNotificationsAsRead(role?: RoleCode) {
    const notifs = this.data.notifications.map((n) => {
      if (!role || n.recipientRole === role) {
        return { ...n, isRead: true };
      }
      return n;
    });
    this.persist({ ...this.data, notifications: notifs });
  }

  // ==========================================
  // WF-01 PURCHASING MANAGEMENT
  // ==========================================
  public createPurchaseAssignment(params: {
    supplierId: string;
    plannedQuantityKg: number;
    plannedDate: string;
    assignedStaffId: string;
    notes?: string;
    creator: User;
  }): { success: boolean; error?: string; assignment?: PurchaseAssignment } {
    if (params.plannedQuantityKg <= 0) {
      return { success: false, error: 'Khối lượng dự kiến phải lớn hơn 0 kg' };
    }
    const supplier = this.data.suppliers.find((s) => s.id === params.supplierId);
    if (!supplier) {
      return { success: false, error: 'Nhà cung cấp không hợp lệ' };
    }
    const staff = this.data.users.find((u) => u.id === params.assignedStaffId);
    if (!staff) {
      return { success: false, error: 'Nhân viên thu mua không hợp lệ' };
    }

    const nextNumber = this.data.purchases.length + 1;
    const code = `PO-2026-${String(nextNumber).padStart(3, '0')}`;
    const id = `po-${Date.now()}`;

    const assignment: PurchaseAssignment = {
      id,
      code,
      supplierId: supplier.id,
      supplierName: supplier.name,
      rawMaterialType: 'Nguyên vật liệu', // Single unified material group!
      plannedQuantityKg: params.plannedQuantityKg,
      plannedDate: params.plannedDate,
      assignedStaffId: staff.id,
      assignedStaffName: staff.fullName,
      createdById: params.creator.id,
      createdByName: params.creator.fullName,
      createdAt: new Date().toISOString(),
      status: 'ASSIGNED',
      assignmentNotes: params.notes,
    };

    this.data.purchases.unshift(assignment);
    this.addAuditLog({
      actorId: params.creator.id,
      actorName: params.creator.fullName,
      actorRole: params.creator.role,
      action: 'Tạo phân công thu mua',
      entityType: 'PURCHASE_ASSIGNMENT',
      entityId: id,
      entityCode: code,
      newState: 'ASSIGNED',
      details: `Giao ${staff.fullName} thu mua ${params.plannedQuantityKg.toLocaleString('vi-VN')} kg từ ${supplier.name}`,
    });

    this.addNotification({
      recipientUserId: staff.id,
      recipientRole: 'PS',
      title: 'Phân công thu mua mới',
      message: `Bạn được phân công thu mua ${params.plannedQuantityKg.toLocaleString('vi-VN')} kg (${code})`,
      entityType: 'PURCHASE_ASSIGNMENT',
      entityId: id,
      targetView: 'purchasing',
    });

    this.persist({ ...this.data });
    return { success: true, assignment };
  }

  public recordPurchaseResult(params: {
    assignmentId: string;
    weighedQuantityKg: number;
    unitPriceVnd: number;
    scaleTicketImageUrl?: string;
    invoiceImageUrl?: string;
    purchasingResultNotes?: string;
    user: User;
  }): { success: boolean; error?: string } {
    const p = this.data.purchases.find((x) => x.id === params.assignmentId);
    if (!p) return { success: false, error: 'Không tìm thấy hồ sơ thu mua' };
    if (p.status !== 'ASSIGNED' && p.status !== 'RETURNED') {
      return { success: false, error: 'Hồ sơ không ở trạng thái cho phép ghi kết quả' };
    }
    if (params.weighedQuantityKg <= 0 || params.unitPriceVnd <= 0) {
      return { success: false, error: 'Khối lượng và đơn giá phải lớn hơn 0' };
    }

    const previousState = p.status;
    p.weighedQuantityKg = params.weighedQuantityKg;
    p.unitPriceVnd = params.unitPriceVnd;
    p.totalAmountVnd = params.weighedQuantityKg * params.unitPriceVnd;
    p.weighedAt = new Date().toISOString();
    p.submittedAt = new Date().toISOString();
    p.scaleTicketImageUrl = params.scaleTicketImageUrl || p.scaleTicketImageUrl;
    p.invoiceImageUrl = params.invoiceImageUrl || p.invoiceImageUrl;
    p.purchasingResultNotes = params.purchasingResultNotes;
    p.status = 'SUBMITTED';

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: previousState === 'RETURNED' ? 'Cập nhật lại kết quả thu mua' : 'Ghi kết quả thu mua',
      entityType: 'PURCHASE_ASSIGNMENT',
      entityId: p.id,
      entityCode: p.code,
      previousState,
      newState: 'SUBMITTED',
      details: `Khối lượng cân: ${params.weighedQuantityKg.toLocaleString('vi-VN')} kg, Đơn giá: ${params.unitPriceVnd.toLocaleString('vi-VN')} VND/kg, Thành tiền: ${p.totalAmountVnd.toLocaleString('vi-VN')} VND`,
    });

    this.addNotification({
      recipientRole: 'M',
      title: 'Hồ sơ thu mua chờ duyệt',
      message: `${p.code} (${p.supplierName}) đã cân ${params.weighedQuantityKg.toLocaleString('vi-VN')} kg`,
      entityType: 'PURCHASE_ASSIGNMENT',
      entityId: p.id,
      targetView: 'purchasing',
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  public decidePurchaseApproval(params: {
    assignmentId: string;
    decision: 'APPROVE' | 'RETURN' | 'REJECT';
    reason?: string;
    user: User;
  }): { success: boolean; error?: string } {
    const p = this.data.purchases.find((x) => x.id === params.assignmentId);
    if (!p) return { success: false, error: 'Không tìm thấy hồ sơ' };
    if (p.status !== 'SUBMITTED') {
      return { success: false, error: 'Hồ sơ chưa được gửi hoặc đã được quyết định' };
    }

    if ((params.decision === 'RETURN' || params.decision === 'REJECT') && (!params.reason || !params.reason.trim())) {
      return { success: false, error: 'Bắt buộc nhập lý do khi Trả lại hoặc Từ chối hồ sơ' };
    }

    p.approvedById = params.user.id;
    p.approvedByName = params.user.fullName;
    p.approvalDecidedAt = new Date().toISOString();

    if (params.decision === 'APPROVE') {
      p.status = 'APPROVED';
      this.addAuditLog({
        actorId: params.user.id,
        actorName: params.user.fullName,
        actorRole: params.user.role,
        action: 'Phê duyệt hồ sơ thu mua',
        entityType: 'PURCHASE_ASSIGNMENT',
        entityId: p.id,
        entityCode: p.code,
        previousState: 'SUBMITTED',
        newState: 'APPROVED',
      });

      this.addNotification({
        recipientRole: 'WS',
        title: 'Hồ sơ thu mua đã duyệt chờ nhận kho',
        message: `${p.code} (${p.supplierName} - ${p.weighedQuantityKg?.toLocaleString('vi-VN')} kg) đã duyệt`,
        entityType: 'PURCHASE_ASSIGNMENT',
        entityId: p.id,
        targetView: 'raw-inventory',
      });
    } else if (params.decision === 'RETURN') {
      p.status = 'RETURNED';
      p.returnReason = params.reason;
      this.addAuditLog({
        actorId: params.user.id,
        actorName: params.user.fullName,
        actorRole: params.user.role,
        action: 'Trả lại hồ sơ thu mua',
        entityType: 'PURCHASE_ASSIGNMENT',
        entityId: p.id,
        entityCode: p.code,
        previousState: 'SUBMITTED',
        newState: 'RETURNED',
        reason: params.reason,
      });

      this.addNotification({
        recipientUserId: p.assignedStaffId,
        recipientRole: 'PS',
        title: 'Hồ sơ thu mua bị trả lại',
        message: `${p.code} bị trả lại: "${params.reason}"`,
        entityType: 'PURCHASE_ASSIGNMENT',
        entityId: p.id,
        targetView: 'purchasing',
      });
    } else {
      p.status = 'REJECTED';
      p.rejectionReason = params.reason;
      this.addAuditLog({
        actorId: params.user.id,
        actorName: params.user.fullName,
        actorRole: params.user.role,
        action: 'Từ chối hồ sơ thu mua',
        entityType: 'PURCHASE_ASSIGNMENT',
        entityId: p.id,
        entityCode: p.code,
        previousState: 'SUBMITTED',
        newState: 'REJECTED',
        reason: params.reason,
      });
    }

    this.persist({ ...this.data });
    return { success: true };
  }

  // WF-01.4 Warehouse Staff: Nhập kho HOẶC Từ chối (Sec 9)
  public receiveRawMaterialIntoWarehouse(params: {
    assignmentId: string;
    receivedQuantityKg: number;
    warehouseNotes?: string;
    user: User;
  }): { success: boolean; error?: string } {
    const p = this.data.purchases.find((x) => x.id === params.assignmentId);
    if (!p) return { success: false, error: 'Không tìm thấy hồ sơ' };
    if (p.status !== 'APPROVED') {
      return { success: false, error: 'Chỉ được tiếp nhận hồ sơ thu mua đã phê duyệt (APPROVED)' };
    }
    if (params.receivedQuantityKg <= 0) {
      return { success: false, error: 'Khối lượng thực nhận phải lớn hơn 0' };
    }

    p.receivedQuantityKg = params.receivedQuantityKg;
    p.receivedAt = new Date().toISOString();
    p.receivedById = params.user.id;
    p.receivedByName = params.user.fullName;
    p.warehouseNotes = params.warehouseNotes;
    p.status = 'RECEIVED';

    this.data.rawInventoryBalanceKg += params.receivedQuantityKg;

    // Track total in supplier record
    const sup = this.data.suppliers.find((s) => s.id === p.supplierId);
    if (sup) {
      sup.totalPurchasedKg = (sup.totalPurchasedKg || 0) + params.receivedQuantityKg;
      sup.totalPaidVnd = (sup.totalPaidVnd || 0) + (p.totalAmountVnd || 0);
    }

    const sm: StockMovement = {
      id: `sm-${Date.now()}`,
      timestamp: new Date().toISOString(),
      materialCategory: 'RAW_MATERIAL',
      materialName: 'Nguyên vật liệu',
      movementType: 'IN',
      quantityKg: params.receivedQuantityKg,
      referenceDocumentType: 'PURCHASE_RECEIPT',
      referenceDocumentCode: p.code,
      confirmedById: params.user.id,
      confirmedByName: params.user.fullName,
      balanceAfterKg: this.data.rawInventoryBalanceKg,
      notes: `Nhập kho từ hồ sơ ${p.code} (${p.supplierName})`,
    };
    this.data.stockMovements.unshift(sm);

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: 'Nhập kho',
      entityType: 'PURCHASE_ASSIGNMENT',
      entityId: p.id,
      entityCode: p.code,
      previousState: 'APPROVED',
      newState: 'RECEIVED',
      details: `Thực nhận ${params.receivedQuantityKg.toLocaleString('vi-VN')} kg, tăng tồn kho NVL`,
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  public rejectRawMaterialReceipt(params: {
    assignmentId: string;
    reason: string;
    user: User;
  }): { success: boolean; error?: string } {
    const p = this.data.purchases.find((x) => x.id === params.assignmentId);
    if (!p) return { success: false, error: 'Không tìm thấy hồ sơ' };
    if (!params.reason || !params.reason.trim()) {
      return { success: false, error: 'Bắt buộc nhập lý do từ chối nhận hàng' };
    }

    p.status = 'REJECTED_BY_WAREHOUSE';
    p.warehouseRejectionReason = params.reason.trim();
    p.receivedById = params.user.id;
    p.receivedByName = params.user.fullName;
    p.receivedAt = new Date().toISOString();

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: 'Thủ kho từ chối nhận hàng',
      entityType: 'PURCHASE_ASSIGNMENT',
      entityId: p.id,
      entityCode: p.code,
      previousState: 'APPROVED',
      newState: 'REJECTED_BY_WAREHOUSE',
      reason: params.reason,
      details: 'Không tăng tồn kho. Hồ sơ chuyển sang danh sách cần xử lý lại.',
    });

    this.addNotification({
      recipientRole: 'M',
      title: 'Thủ kho từ chối nhận lô hàng',
      message: `${p.code} (${p.supplierName}) bị từ chối: "${params.reason}"`,
      entityType: 'PURCHASE_ASSIGNMENT',
      entityId: p.id,
      targetView: 'purchasing',
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  // ==========================================
  // WF-02 PRODUCTION PLANNING (Multi-staff per machine!)
  // ==========================================
  public createProductionPlan(params: {
    productionDate: string;
    shift: 'CA_1' | 'CA_2' | 'CA_3';
    targetQuantityKg: number;
    assignments: {
      stage: any;
      machineId: string;
      operatorIds: string[];
      targetQuantityKg: number;
      notes?: string;
    }[];
    notes?: string;
    creator: User;
  }): { success: boolean; error?: string; plan?: ProductionPlan } {
    if (params.targetQuantityKg <= 0) {
      return { success: false, error: 'Sản lượng mục tiêu phải lớn hơn 0' };
    }

    const nextNum = this.data.productionPlans.length + 42;
    const code = `PLAN-2026-${String(nextNum).padStart(3, '0')}`;
    const id = `plan-${Date.now()}`;

    const formattedAssignments = params.assignments.map((a, idx) => {
      const machine = this.data.machines.find((m) => m.id === a.machineId);
      const opNames = a.operatorIds.map(
        (opId) => this.data.users.find((u) => u.id === opId)?.fullName || 'Công nhân'
      );
      return {
        id: `tsk-${id}-${idx}`,
        stage: a.stage,
        machineId: a.machineId,
        machineName: machine ? machine.name : 'Máy sản xuất',
        operatorIds: a.operatorIds,
        operatorNames: opNames,
        targetQuantityKg: a.targetQuantityKg,
        notes: a.notes,
      };
    });

    const plan: ProductionPlan = {
      id,
      code,
      productionDate: params.productionDate,
      shift: params.shift,
      productName: 'Viên nén gỗ', // Fixed single product
      targetQuantityKg: params.targetQuantityKg,
      status: 'PLANNED',
      createdById: params.creator.id,
      createdByName: params.creator.fullName,
      createdAt: new Date().toISOString(),
      notes: params.notes,
      assignments: formattedAssignments,
    };

    this.data.productionPlans.unshift(plan);

    this.addAuditLog({
      actorId: params.creator.id,
      actorName: params.creator.fullName,
      actorRole: params.creator.role,
      action: 'Lập kế hoạch sản xuất',
      entityType: 'PRODUCTION_PLAN',
      entityId: id,
      entityCode: code,
      newState: 'PLANNED',
      details: `${code}: Ngày ${params.productionDate}, Ca ${params.shift}, Mục tiêu ${params.targetQuantityKg.toLocaleString('vi-VN')} kg`,
    });

    // Notify all assigned operators
    const allOpIds = new Set<string>();
    formattedAssignments.forEach((a) => a.operatorIds.forEach((id) => allOpIds.add(id)));
    allOpIds.forEach((opId) => {
      this.addNotification({
        recipientUserId: opId,
        recipientRole: 'S',
        title: 'Phân công kế hoạch sản xuất mới',
        message: `Bạn được phân công trong ${code}`,
        entityType: 'PRODUCTION_PLAN',
        entityId: id,
        targetView: 'shift-report',
      });
    });

    this.persist({ ...this.data });
    return { success: true, plan };
  }

  // ==========================================
  // WF-03 RAW MATERIAL ISSUING
  // ==========================================
  public issueRawMaterial(params: {
    planId: string;
    issuedQuantityKg: number;
    recipientDepartment: string;
    notes?: string;
    user: User;
  }): { success: boolean; error?: string } {
    const plan = this.data.productionPlans.find((p) => p.id === params.planId);
    if (!plan) return { success: false, error: 'Không tìm thấy kế hoạch sản xuất' };

    if (params.issuedQuantityKg <= 0) {
      return { success: false, error: 'Lượng cấp phải lớn hơn 0 kg' };
    }
    if (params.issuedQuantityKg > this.data.rawInventoryBalanceKg) {
      return {
        success: false,
        error: `Không đủ tồn kho khả dụng. Tồn hiện tại: ${this.data.rawInventoryBalanceKg.toLocaleString('vi-VN')} kg`,
      };
    }

    const nextNum = this.data.materialIssues.length + 1;
    const code = `MAT-ISS-${String(nextNum).padStart(3, '0')}`;
    const id = `mat-iss-${Date.now()}`;

    const issue: RawMaterialIssue = {
      id,
      code,
      planId: plan.id,
      planCode: plan.code,
      rawMaterialType: 'Nguyên vật liệu',
      issuedQuantityKg: params.issuedQuantityKg,
      recipientDepartment: params.recipientDepartment,
      issuedAt: new Date().toISOString(),
      issuedById: params.user.id,
      issuedByName: params.user.fullName,
      notes: params.notes,
    };

    this.data.materialIssues.unshift(issue);
    this.data.rawInventoryBalanceKg -= params.issuedQuantityKg;

    const sm: StockMovement = {
      id: `sm-${Date.now()}`,
      timestamp: new Date().toISOString(),
      materialCategory: 'RAW_MATERIAL',
      materialName: 'Nguyên vật liệu',
      movementType: 'OUT',
      quantityKg: params.issuedQuantityKg,
      referenceDocumentType: 'RAW_MATERIAL_ISSUE',
      referenceDocumentCode: code,
      confirmedById: params.user.id,
      confirmedByName: params.user.fullName,
      balanceAfterKg: this.data.rawInventoryBalanceKg,
      notes: `Cấp NVL cho kế hoạch ${plan.code}`,
    };
    this.data.stockMovements.unshift(sm);

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: 'Cấp NVL',
      entityType: 'RAW_MATERIAL_ISSUE',
      entityId: id,
      entityCode: code,
      details: `Xuất kho ${params.issuedQuantityKg.toLocaleString('vi-VN')} kg cho ${plan.code}`,
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  // ==========================================
  // WF-04 PRODUCTION SHIFT REPORT
  // ==========================================
  public submitShiftReport(params: {
    planId: string;
    productionDate: string;
    shift: 'CA_1' | 'CA_2' | 'CA_3';
    stage: any;
    machineId: string;
    actualMaterialUsedKg: number;
    actualOutputKg: number;
    hasIncident: boolean;
    incidentDescription?: string;
    imageUrl?: string;
    notes?: string;
    user: User;
  }): { success: boolean; error?: string } {
    const plan = this.data.productionPlans.find((p) => p.id === params.planId);
    if (!plan) return { success: false, error: 'Không tìm thấy kế hoạch sản xuất' };
    const machine = this.data.machines.find((m) => m.id === params.machineId);
    if (!machine) return { success: false, error: 'Máy móc không hợp lệ' };

    if (params.actualOutputKg <= 0 || params.actualMaterialUsedKg <= 0) {
      return { success: false, error: 'Sản lượng và lượng NVL thực dùng phải lớn hơn 0' };
    }

    const nextNum = this.data.shiftReports.length + 88;
    const code = `REP-2026-${String(nextNum).padStart(3, '0')}`;
    const id = `rep-${Date.now()}`;

    const report: ShiftReport = {
      id,
      code,
      planId: plan.id,
      planCode: plan.code,
      productionDate: params.productionDate,
      shift: params.shift,
      stage: params.stage,
      machineId: machine.id,
      machineName: machine.name,
      actualMaterialUsedKg: params.actualMaterialUsedKg,
      actualOutputKg: params.actualOutputKg,
      status: 'SUBMITTED',
      hasIncident: params.hasIncident,
      incidentDescription: params.incidentDescription,
      imageUrl: params.imageUrl,
      notes: params.notes,
      reportedById: params.user.id,
      reportedByName: params.user.fullName,
      reportedAt: new Date().toISOString(),
    };

    this.data.shiftReports.unshift(report);

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: 'Gửi báo cáo ca',
      entityType: 'SHIFT_REPORT',
      entityId: id,
      entityCode: code,
      newState: 'SUBMITTED',
      details: `${code}: Sản lượng ${params.actualOutputKg.toLocaleString('vi-VN')} kg`,
    });

    this.addNotification({
      recipientRole: 'M',
      title: 'Báo cáo ca chờ duyệt',
      message: `${params.user.fullName} đã gửi ${code} (${params.actualOutputKg.toLocaleString('vi-VN')} kg)`,
      entityType: 'SHIFT_REPORT',
      entityId: id,
      targetView: 'shift-report',
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  public decideShiftReportApproval(params: {
    reportId: string;
    decision: 'APPROVE' | 'RETURN' | 'REJECT';
    reason?: string;
    user: User;
  }): { success: boolean; error?: string } {
    const report = this.data.shiftReports.find((r) => r.id === params.reportId);
    if (!report) return { success: false, error: 'Không tìm thấy báo cáo ca' };
    if (report.status !== 'SUBMITTED') {
      return { success: false, error: 'Báo cáo không ở trạng thái chờ duyệt' };
    }

    if ((params.decision === 'RETURN' || params.decision === 'REJECT') && (!params.reason || !params.reason.trim())) {
      return { success: false, error: 'Bắt buộc nhập lý do khi Trả lại hoặc Từ chối báo cáo' };
    }

    report.approvedById = params.user.id;
    report.approvedByName = params.user.fullName;
    report.approvedAt = new Date().toISOString();

    if (params.decision === 'APPROVE') {
      report.status = 'APPROVED';

      // Generate a new LOT in PENDING QC status (Not in warehouse yet!)
      const lotNumber = this.data.lots.length + 1;
      const datePart = report.productionDate.replace(/-/g, '');
      const lotCode = `LOT-${datePart}-${String(lotNumber).padStart(2, '0')}`;
      const lotId = `lot-${Date.now()}`;
      report.lotCodeGenerated = lotCode;

      const newLot: LotItem = {
        id: lotId,
        lotCode,
        planId: report.planId,
        planCode: report.planCode,
        shiftReportId: report.id,
        productionDate: report.productionDate,
        productName: 'Viên nén gỗ',
        quantityKg: report.actualOutputKg,
        jumboBagsCount: Math.ceil(report.actualOutputKg / 1000),
        qcStatus: 'PENDING',
        tests: [],
        isReceivedInWarehouse: false,
        availableQuantityKg: report.actualOutputKg,
        createdAt: new Date().toISOString(),
      };
      this.data.lots.unshift(newLot);

      this.addAuditLog({
        actorId: params.user.id,
        actorName: params.user.fullName,
        actorRole: params.user.role,
        action: 'Phê duyệt',
        entityType: 'SHIFT_REPORT',
        entityId: report.id,
        entityCode: report.code,
        previousState: 'SUBMITTED',
        newState: 'APPROVED',
        details: `Duyệt báo cáo ${report.code}. Đã tạo lô hàng ${lotCode} chờ kiểm tra QC`,
      });

      this.addNotification({
        recipientRole: 'QC',
        title: 'Lô hàng mới cần kiểm tra QC',
        message: `${lotCode} (${report.actualOutputKg.toLocaleString('vi-VN')} kg) sẵn sàng cho 3 lần kiểm tra KCS`,
        entityType: 'LOT',
        entityId: lotId,
        targetView: 'qc',
      });
    } else if (params.decision === 'RETURN') {
      report.status = 'RETURNED';
      report.returnReason = params.reason;
      this.addAuditLog({
        actorId: params.user.id,
        actorName: params.user.fullName,
        actorRole: params.user.role,
        action: 'Trả lại',
        entityType: 'SHIFT_REPORT',
        entityId: report.id,
        entityCode: report.code,
        previousState: 'SUBMITTED',
        newState: 'RETURNED',
        reason: params.reason,
      });

      this.addNotification({
        recipientUserId: report.reportedById,
        recipientRole: 'S',
        title: 'Báo cáo ca bị trả lại',
        message: `${report.code} bị trả lại: "${params.reason}"`,
        entityType: 'SHIFT_REPORT',
        entityId: report.id,
        targetView: 'shift-report',
      });
    } else {
      report.status = 'REJECTED';
      report.rejectReason = params.reason;
      this.addAuditLog({
        actorId: params.user.id,
        actorName: params.user.fullName,
        actorRole: params.user.role,
        action: 'Từ chối',
        entityType: 'SHIFT_REPORT',
        entityId: report.id,
        entityCode: report.code,
        previousState: 'SUBMITTED',
        newState: 'REJECTED',
        reason: params.reason,
      });
    }

    this.persist({ ...this.data });
    return { success: true };
  }

  // ==========================================
  // WF-05 QUALITY CONTROL (3 tests & Kho A / Kho B classification)
  // ==========================================
  public addQcTest(params: {
    lotId: string;
    moisturePercent: number;
    ashPercent: number;
    impuritiesPercent: number;
    calorificValueKcalKg?: number;
    imageUrl?: string;
    notes?: string;
    user: User;
  }): { success: boolean; error?: string } {
    const lot = this.data.lots.find((l) => l.id === params.lotId);
    if (!lot) return { success: false, error: 'Không tìm thấy LOT' };

    if (lot.tests.length >= 3) {
      return { success: false, error: 'LOT này đã hoàn thành đủ 3 lần kiểm tra QC' };
    }

    const testNum = (lot.tests.length + 1) as 1 | 2 | 3;
    const newTest = {
      testNumber: testNum,
      testedAt: new Date().toISOString(),
      testedById: params.user.id,
      testedByName: params.user.fullName,
      moisturePercent: params.moisturePercent,
      ashPercent: params.ashPercent,
      impuritiesPercent: params.impuritiesPercent,
      calorificValueKcalKg: params.calorificValueKcalKg,
      imageUrl: params.imageUrl,
      notes: params.notes,
    };

    lot.tests.push(newTest);

    if (lot.tests.length === 3) {
      lot.qcStatus = 'QC_COMPLETED';
      // Automatically suggest target warehouse based on average ash and moisture:
      // Ash <= 0.8% and Moisture <= 10% -> Kho A, otherwise Kho B (all sellable)
      const avgAsh = lot.tests.reduce((acc, t) => acc + t.ashPercent, 0) / 3;
      lot.targetWarehouse = avgAsh <= 0.8 ? 'KHO_A' : 'KHO_B';

      this.addNotification({
        recipientRole: 'WS',
        title: 'Lô hàng đã hoàn tất QC chờ nhập kho',
        message: `${lot.lotCode} (${lot.quantityKg.toLocaleString('vi-VN')} kg) đã xếp vào ${lot.targetWarehouse}`,
        entityType: 'LOT',
        entityId: lot.id,
        targetView: 'finished-goods',
      });
    } else {
      lot.qcStatus = 'IN_TESTING';
    }

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: `Thực hiện QC lần ${testNum}`,
      entityType: 'LOT',
      entityId: lot.id,
      entityCode: lot.lotCode,
      details: `Lần ${testNum}/3: Độ ẩm ${params.moisturePercent}%, Độ tro ${params.ashPercent}%`,
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  public setLotWarehouseClassification(lotId: string, warehouseType: FinishedWarehouseType, user: User) {
    const lot = this.data.lots.find((l) => l.id === lotId);
    if (!lot) return;
    lot.targetWarehouse = warehouseType;
    this.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: 'Chỉ định phân loại kho thành phẩm',
      entityType: 'LOT',
      entityId: lot.id,
      entityCode: lot.lotCode,
      details: `Chỉ định lưu trữ vào ${warehouseType}`,
    });
    this.persist({ ...this.data });
  }

  // ==========================================
  // WF-06 FINISHED GOODS INVENTORY RECEIPT (Kho A / Kho B)
  // ==========================================
  public receiveFinishedGoods(params: { lotId: string; user: User }): { success: boolean; error?: string } {
    const lot = this.data.lots.find((l) => l.id === params.lotId);
    if (!lot) return { success: false, error: 'Không tìm thấy LOT' };
    if (lot.qcStatus !== 'QC_COMPLETED') {
      return { success: false, error: 'Chỉ nhận vào kho các LOT đã qua đủ 3 lần QC (QC_COMPLETED)' };
    }
    if (lot.isReceivedInWarehouse) {
      return { success: false, error: 'LOT này đã được nhận vào kho trước đó' };
    }

    const warehouse = lot.targetWarehouse || 'KHO_A';
    lot.isReceivedInWarehouse = true;
    lot.receivedAt = new Date().toISOString();
    lot.receivedById = params.user.id;
    lot.receivedByName = params.user.fullName;

    if (warehouse === 'KHO_A') {
      this.data.finishedInventoryWarehouseA_Kg += lot.quantityKg;
    } else {
      this.data.finishedInventoryWarehouseB_Kg += lot.quantityKg;
    }

    const sm: StockMovement = {
      id: `sm-${Date.now()}`,
      timestamp: new Date().toISOString(),
      materialCategory: 'FINISHED_GOODS',
      materialName: 'Viên nén gỗ',
      warehouseType: warehouse,
      movementType: 'IN',
      quantityKg: lot.quantityKg,
      referenceDocumentType: 'FINISHED_GOODS_RECEIPT',
      referenceDocumentCode: lot.lotCode,
      lotCode: lot.lotCode,
      confirmedById: params.user.id,
      confirmedByName: params.user.fullName,
      balanceAfterKg:
        warehouse === 'KHO_A'
          ? this.data.finishedInventoryWarehouseA_Kg
          : this.data.finishedInventoryWarehouseB_Kg,
      notes: `Nhập ${lot.jumboBagsCount} bao Jumbo vào ${warehouse}`,
    };
    this.data.stockMovements.unshift(sm);

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: 'Nhập kho',
      entityType: 'LOT',
      entityId: lot.id,
      entityCode: lot.lotCode,
      details: `Nhập kho ${lot.quantityKg.toLocaleString('vi-VN')} kg vào ${warehouse}`,
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  // ==========================================
  // WF-07 OUTBOUND PROPOSAL (WS and M both send directly to Owner! Only Owner decides price)
  // ==========================================
  public createOutboundProposal(params: {
    sourceWarehouse: FinishedWarehouseType;
    customerId: string;
    lotId: string;
    requestedQuantityKg: number;
    notes?: string;
    user: User;
  }): { success: boolean; error?: string } {
    const customer = this.data.customers.find((c) => c.id === params.customerId);
    if (!customer) return { success: false, error: 'Khách hàng không hợp lệ' };
    const lot = this.data.lots.find((l) => l.id === params.lotId);
    if (!lot) return { success: false, error: 'Không tìm thấy LOT' };

    if (!lot.isReceivedInWarehouse) {
      return { success: false, error: 'Chỉ được tạo đề xuất từ LOT đã nhập kho thành phẩm' };
    }
    if (params.requestedQuantityKg <= 0) {
      return { success: false, error: 'Khối lượng yêu cầu xuất phải lớn hơn 0' };
    }
    if (params.requestedQuantityKg > lot.availableQuantityKg) {
      return {
        success: false,
        error: `Khối lượng vượt tồn khả dụng của lô ${lot.lotCode} (${lot.availableQuantityKg.toLocaleString('vi-VN')} kg)`,
      };
    }

    const nextNum = this.data.outboundProposals.length + 15;
    const code = `OUT-PROP-2026-${String(nextNum).padStart(3, '0')}`;
    const id = `out-${Date.now()}`;

    // Both WS and M create proposals that go DIRECTLY to Owner!
    // If Owner is the creator, the proposal is registered directly without self-approval loop.
    const isOwnerCreator = params.user.role === 'O';
    const initialStatus = isOwnerCreator ? 'APPROVED' : 'PENDING_OWNER_APPROVAL';

    const proposal: OutboundProposal = {
      id,
      code,
      creatorRole: params.user.role as any,
      sourceWarehouse: params.sourceWarehouse,
      customerId: customer.id,
      customerName: customer.name,
      productName: 'Viên nén gỗ',
      lotId: lot.id,
      lotCode: lot.lotCode,
      requestedQuantityKg: params.requestedQuantityKg,
      // No price input for WS/M! Only Owner sets price!
      status: initialStatus,
      notes: params.notes,
      createdById: params.user.id,
      createdByName: params.user.fullName,
      createdAt: new Date().toISOString(),
      ownerDecidedById: isOwnerCreator ? params.user.id : undefined,
      ownerDecidedByName: isOwnerCreator ? params.user.fullName : undefined,
      ownerDecidedAt: isOwnerCreator ? new Date().toISOString() : undefined,
      outboundQcTested: false,
      isDispatched: false,
    };

    this.data.outboundProposals.unshift(proposal);

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: 'Tạo đề xuất xuất hàng',
      entityType: 'OUTBOUND_PROPOSAL',
      entityId: id,
      entityCode: code,
      newState: initialStatus,
      details: `${code}: Đề xuất xuất ${params.requestedQuantityKg.toLocaleString('vi-VN')} kg từ ${params.sourceWarehouse} cho ${customer.name}`,
    });

    if (!isOwnerCreator) {
      this.addNotification({
        recipientRole: 'O',
        title: 'Đề xuất xuất hàng chờ Owner quyết định',
        message: `${params.user.fullName} đã gửi ${code} (${customer.name})`,
        entityType: 'OUTBOUND_PROPOSAL',
        entityId: id,
        targetView: 'outbound',
      });
    }

    this.persist({ ...this.data });
    return { success: true };
  }

  // Owner exclusive decision: sets price, can override customer, approves/returns/rejects
  public ownerDecideOutboundProposal(params: {
    proposalId: string;
    decision: 'APPROVE' | 'RETURN' | 'REJECT';
    reason?: string;
    newCustomerId?: string;
    decidedPriceVnd?: number;
    user: User;
  }): { success: boolean; error?: string } {
    const prop = this.data.outboundProposals.find((p) => p.id === params.proposalId);
    if (!prop) return { success: false, error: 'Không tìm thấy đề xuất' };
    if (prop.status !== 'PENDING_OWNER_APPROVAL') {
      return { success: false, error: 'Đề xuất không ở trạng thái chờ Owner quyết định' };
    }

    if (params.decision === 'APPROVE' && (!params.decidedPriceVnd || params.decidedPriceVnd <= 0)) {
      return { success: false, error: 'Chỉ Owner có quyền quyết định giá bán. Vui lòng nhập đơn giá bán chốt.' };
    }

    // Owner override customer
    if (params.newCustomerId && params.newCustomerId !== prop.customerId) {
      const newCust = this.data.customers.find((c) => c.id === params.newCustomerId);
      if (newCust) {
        prop.originalCustomerId = prop.customerId;
        prop.originalCustomerName = prop.customerName;
        prop.customerId = newCust.id;
        prop.customerName = newCust.name;
        this.addAuditLog({
          actorId: params.user.id,
          actorName: params.user.fullName,
          actorRole: params.user.role,
          action: 'Owner điều chỉnh đối tác mua hàng',
          entityType: 'OUTBOUND_PROPOSAL',
          entityId: prop.id,
          entityCode: prop.code,
          details: `Thay đổi từ ${prop.originalCustomerName} sang ${newCust.name}`,
        });
      }
    }

    if (params.decidedPriceVnd) {
      prop.unitPriceVnd = params.decidedPriceVnd;
      prop.totalValueVnd = params.decidedPriceVnd * prop.requestedQuantityKg;
    }
    prop.ownerDecidedById = params.user.id;
    prop.ownerDecidedByName = params.user.fullName;
    prop.ownerDecidedAt = new Date().toISOString();

    if (params.decision === 'APPROVE') {
      prop.status = 'APPROVED';
      this.addAuditLog({
        actorId: params.user.id,
        actorName: params.user.fullName,
        actorRole: params.user.role,
        action: 'Phê duyệt',
        entityType: 'OUTBOUND_PROPOSAL',
        entityId: prop.id,
        entityCode: prop.code,
        previousState: 'PENDING_OWNER_APPROVAL',
        newState: 'APPROVED',
        details: `Duyệt giá ${(params.decidedPriceVnd || 0).toLocaleString('vi-VN')} VND/kg cho ${prop.customerName}`,
      });

      this.addNotification({
        recipientRole: 'M',
        title: 'Đề xuất xuất hàng đã duyệt',
        message: `${prop.code} đã được duyệt giá ${(params.decidedPriceVnd || 0).toLocaleString('vi-VN')} VND/kg`,
        entityType: 'OUTBOUND_PROPOSAL',
        entityId: prop.id,
        targetView: 'outbound',
      });
    } else if (params.decision === 'RETURN') {
      if (!params.reason?.trim()) return { success: false, error: 'Bắt buộc nhập lý do khi Trả lại' };
      prop.status = 'RETURNED';
      prop.returnReason = params.reason;
      this.addAuditLog({
        actorId: params.user.id,
        actorName: params.user.fullName,
        actorRole: params.user.role,
        action: 'Trả lại',
        entityType: 'OUTBOUND_PROPOSAL',
        entityId: prop.id,
        entityCode: prop.code,
        previousState: 'PENDING_OWNER_APPROVAL',
        newState: 'RETURNED',
        reason: params.reason,
      });
    } else {
      if (!params.reason?.trim()) return { success: false, error: 'Bắt buộc nhập lý do khi Từ chối' };
      prop.status = 'REJECTED';
      prop.rejectionReason = params.reason;
      this.addAuditLog({
        actorId: params.user.id,
        actorName: params.user.fullName,
        actorRole: params.user.role,
        action: 'Từ chối',
        entityType: 'OUTBOUND_PROPOSAL',
        entityId: prop.id,
        entityCode: prop.code,
        previousState: 'PENDING_OWNER_APPROVAL',
        newState: 'REJECTED',
        reason: params.reason,
      });
    }

    this.persist({ ...this.data });
    return { success: true };
  }

  // WF-08 Outbound QC
  public recordOutboundQc(params: {
    proposalId: string;
    moisturePercent: number;
    ashPercent: number;
    impuritiesPercent: number;
    user: User;
  }): { success: boolean; error?: string } {
    const prop = this.data.outboundProposals.find((p) => p.id === params.proposalId);
    if (!prop) return { success: false, error: 'Không tìm thấy đề xuất' };

    prop.outboundQcTested = true;
    prop.outboundQcMoisture = params.moisturePercent;
    prop.outboundQcAsh = params.ashPercent;
    prop.outboundQcImpurities = params.impuritiesPercent;
    prop.outboundQcTestedById = params.user.id;
    prop.outboundQcTestedByName = params.user.fullName;
    prop.outboundQcTestedAt = new Date().toISOString();

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: 'Kiểm tra QC xuất hàng',
      entityType: 'OUTBOUND_PROPOSAL',
      entityId: prop.id,
      entityCode: prop.code,
      details: `Độ ẩm: ${params.moisturePercent}%, Độ tro: ${params.ashPercent}%`,
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  // WF-09 Pickup & Dispatch (Warehouse Staff: Xuất kho HOẶC Từ chối)
  public recordRecipientInfo(params: {
    proposalId: string;
    recipientName: string;
    recipientPhone: string;
    truckLicensePlate: string;
    pickupTimeScheduled: string;
    user: User;
  }): { success: boolean; error?: string } {
    const prop = this.data.outboundProposals.find((p) => p.id === params.proposalId);
    if (!prop) return { success: false, error: 'Không tìm thấy đề xuất' };
    if (prop.status !== 'APPROVED') {
      return { success: false, error: 'Chỉ ghi nhận thông tin xe cho đề xuất đã được phê duyệt' };
    }

    prop.recipientName = params.recipientName;
    prop.recipientPhone = params.recipientPhone;
    prop.truckLicensePlate = params.truckLicensePlate;
    prop.pickupTimeScheduled = params.pickupTimeScheduled;
    prop.recipientRecordedById = params.user.id;
    prop.recipientRecordedByName = params.user.fullName;
    prop.recipientRecordedAt = new Date().toISOString();

    this.addNotification({
      recipientRole: 'WS',
      title: 'Thông tin xe nhận hàng đã cập nhật',
      message: `${prop.code}: Xe ${params.truckLicensePlate} dự kiến nhận hàng`,
      entityType: 'OUTBOUND_PROPOSAL',
      entityId: prop.id,
      targetView: 'outbound',
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  public confirmPhysicalDispatch(params: {
    proposalId: string;
    actualDispatchedKg: number;
    truckPlateVerified: string;
    dispatchEvidenceImageUrl?: string;
    user: User;
  }): { success: boolean; error?: string } {
    const prop = this.data.outboundProposals.find((p) => p.id === params.proposalId);
    if (!prop) return { success: false, error: 'Không tìm thấy đề xuất' };
    if (prop.status !== 'APPROVED') {
      return { success: false, error: 'Chỉ xuất kho cho đề xuất đã được phê duyệt' };
    }

    const lot = this.data.lots.find((l) => l.id === prop.lotId);
    if (!lot) return { success: false, error: 'Không tìm thấy LOT xuất kho' };
    if (params.actualDispatchedKg <= 0 || params.actualDispatchedKg > lot.availableQuantityKg) {
      return { success: false, error: 'Khối lượng thực xuất vượt tồn khả dụng' };
    }

    // Atomic execution
    lot.availableQuantityKg -= params.actualDispatchedKg;
    if (prop.sourceWarehouse === 'KHO_A') {
      this.data.finishedInventoryWarehouseA_Kg -= params.actualDispatchedKg;
    } else {
      this.data.finishedInventoryWarehouseB_Kg -= params.actualDispatchedKg;
    }

    prop.isDispatched = true;
    prop.status = 'DISPATCHED';
    prop.actualDispatchedKg = params.actualDispatchedKg;
    prop.dispatchedAt = new Date().toISOString();
    prop.dispatchedById = params.user.id;
    prop.dispatchedByName = params.user.fullName;
    prop.dispatchEvidenceImageUrl = params.dispatchEvidenceImageUrl;

    // Automatic Financial link: Generate Sale Invoice
    const invCode = `INV-2026-${String(this.data.saleInvoices.length + 1).padStart(3, '0')}`;
    const unitPrice = prop.unitPriceVnd || 3850;
    const totalAmount = params.actualDispatchedKg * unitPrice;

    const newInvoice: SaleInvoice = {
      id: `inv-${Date.now()}`,
      code: invCode,
      proposalId: prop.id,
      proposalCode: prop.code,
      customerId: prop.customerId,
      customerName: prop.customerName,
      warehouseType: prop.sourceWarehouse,
      productName: 'Viên nén gỗ',
      dispatchedQuantityKg: params.actualDispatchedKg,
      unitPriceVnd: unitPrice,
      totalAmountVnd: totalAmount,
      paidAmountVnd: 0,
      remainingAmountVnd: totalAmount,
      paymentStatus: 'UNPAID',
      invoiceDate: new Date().toISOString().split('T')[0],
      paymentHistory: [],
    };
    this.data.saleInvoices.unshift(newInvoice);

    // Update customer total
    const cust = this.data.customers.find((c) => c.id === prop.customerId);
    if (cust) {
      cust.totalOrderedKg = (cust.totalOrderedKg || 0) + params.actualDispatchedKg;
      cust.totalReceivableVnd = (cust.totalReceivableVnd || 0) + totalAmount;
    }

    const sm: StockMovement = {
      id: `sm-${Date.now()}`,
      timestamp: new Date().toISOString(),
      materialCategory: 'FINISHED_GOODS',
      materialName: 'Viên nén gỗ',
      warehouseType: prop.sourceWarehouse,
      movementType: 'OUT',
      quantityKg: params.actualDispatchedKg,
      referenceDocumentType: 'CUSTOMER_DISPATCH',
      referenceDocumentCode: prop.code,
      lotCode: lot.lotCode,
      confirmedById: params.user.id,
      confirmedByName: params.user.fullName,
      balanceAfterKg:
        prop.sourceWarehouse === 'KHO_A'
          ? this.data.finishedInventoryWarehouseA_Kg
          : this.data.finishedInventoryWarehouseB_Kg,
      notes: `Xuất kho từ ${prop.sourceWarehouse} cho xe ${params.truckPlateVerified}`,
    };
    this.data.stockMovements.unshift(sm);

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: 'Xuất kho',
      entityType: 'OUTBOUND_PROPOSAL',
      entityId: prop.id,
      entityCode: prop.code,
      previousState: 'APPROVED',
      newState: 'DISPATCHED',
      details: `Đã giao ${params.actualDispatchedKg.toLocaleString('vi-VN')} kg cho ${prop.customerName}. Tạo hóa đơn ${invCode}`,
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  // WF-12 Warehouse Staff: Từ chối xuất kho (Sec 24)
  public rejectDispatch(params: {
    proposalId: string;
    reason: string;
    user: User;
  }): { success: boolean; error?: string } {
    const prop = this.data.outboundProposals.find((p) => p.id === params.proposalId);
    if (!prop) return { success: false, error: 'Không tìm thấy đề xuất' };
    if (!params.reason?.trim()) return { success: false, error: 'Bắt buộc nhập lý do từ chối xuất kho' };

    prop.status = 'REJECTED_BY_WAREHOUSE';
    prop.dispatchRejectionReason = params.reason.trim();

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: 'Thủ kho từ chối xuất kho',
      entityType: 'OUTBOUND_PROPOSAL',
      entityId: prop.id,
      entityCode: prop.code,
      previousState: 'APPROVED',
      newState: 'REJECTED_BY_WAREHOUSE',
      reason: params.reason,
      details: 'Không trừ tồn kho thành phẩm. Đã gửi cảnh báo đến Quản lý và Giám đốc.',
    });

    this.addNotification({
      recipientRole: 'O',
      title: 'Thủ kho từ chối xuất hàng',
      message: `${prop.code} (${prop.customerName}) bị từ chối: "${params.reason}"`,
      entityType: 'OUTBOUND_PROPOSAL',
      entityId: prop.id,
      targetView: 'outbound',
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  // WF-12 Manager: Xử lý đề xuất bị Thủ kho từ chối (Sec 25)
  public resolveOutboundRejection(params: {
    proposalId: string;
    resolutionType: 'UPDATE_RECIPIENT_AND_RESUBMIT' | 'ESCALATE_TO_OWNER';
    recipientName?: string;
    recipientPhone?: string;
    truckLicensePlate?: string;
    newCustomerId?: string;
    newRequestedQuantityKg?: number;
    newUnitPriceVnd?: number;
    explanation: string;
    user: User;
  }): { success: boolean; error?: string } {
    const prop = this.data.outboundProposals.find((p) => p.id === params.proposalId);
    if (!prop) return { success: false, error: 'Không tìm thấy đề xuất' };
    if (prop.status !== 'REJECTED_BY_WAREHOUSE') {
      return { success: false, error: 'Chỉ xử lý các đề xuất bị Thủ kho từ chối' };
    }
    if (!params.explanation?.trim()) {
      return { success: false, error: 'Vui lòng nhập phương án xử lý' };
    }

    if (params.resolutionType === 'UPDATE_RECIPIENT_AND_RESUBMIT') {
      if (params.recipientName) prop.recipientName = params.recipientName.trim();
      if (params.recipientPhone) prop.recipientPhone = params.recipientPhone.trim();
      if (params.truckLicensePlate) prop.truckLicensePlate = params.truckLicensePlate.trim().toUpperCase();
      prop.status = 'APPROVED'; // Ready for Warehouse Staff to inspect again!
      prop.notes = `${prop.notes ? prop.notes + ' | ' : ''}Quản lý xử lý lại sau khi kho từ chối: ${params.explanation}`;

      this.addAuditLog({
        actorId: params.user.id,
        actorName: params.user.fullName,
        actorRole: params.user.role,
        action: 'Quản lý cập nhật xe và gửi lại Thủ kho',
        entityType: 'OUTBOUND_PROPOSAL',
        entityId: prop.id,
        entityCode: prop.code,
        previousState: 'REJECTED_BY_WAREHOUSE',
        newState: 'APPROVED',
        reason: params.explanation,
        details: `Cập nhật thông tin tài xế/xe: ${prop.recipientName} (${prop.truckLicensePlate})`,
      });

      this.addNotification({
        recipientRole: 'WS',
        title: 'Đề xuất xuất kho đã cập nhật xe',
        message: `${prop.code}: Quản lý đã chỉnh sửa thông tin xe và gửi lại kho`,
        entityType: 'OUTBOUND_PROPOSAL',
        entityId: prop.id,
        targetView: 'outbound',
      });
    } else {
      // Escalate to Owner
      if (params.newCustomerId) {
        const cust = this.data.customers.find((c) => c.id === params.newCustomerId);
        if (cust) {
          prop.originalCustomerId = prop.customerId;
          prop.originalCustomerName = prop.customerName;
          prop.customerId = cust.id;
          prop.customerName = cust.name;
        }
      }
      if (params.newRequestedQuantityKg && params.newRequestedQuantityKg > 0) {
        prop.requestedQuantityKg = params.newRequestedQuantityKg;
      }
      if (params.newUnitPriceVnd && params.newUnitPriceVnd > 0) {
        prop.unitPriceVnd = params.newUnitPriceVnd;
        prop.totalValueVnd = prop.requestedQuantityKg * params.newUnitPriceVnd;
      }
      prop.status = 'PENDING_OWNER_APPROVAL';
      prop.notes = `${prop.notes ? prop.notes + ' | ' : ''}Quản lý trình lại Giám đốc sau khi kho từ chối: ${params.explanation}`;

      this.addAuditLog({
        actorId: params.user.id,
        actorName: params.user.fullName,
        actorRole: params.user.role,
        action: 'Quản lý chuyển tiếp Giám đốc duyệt lại',
        entityType: 'OUTBOUND_PROPOSAL',
        entityId: prop.id,
        entityCode: prop.code,
        previousState: 'REJECTED_BY_WAREHOUSE',
        newState: 'PENDING_OWNER_APPROVAL',
        reason: params.explanation,
        details: 'Đã cập nhật lại thông tin thương mại và gửi Giám đốc phê duyệt',
      });

      this.addNotification({
        recipientRole: 'O',
        title: 'Đề xuất xuất kho cần duyệt lại',
        message: `${prop.code}: Quản lý đã trình lại Giám đốc sau khi kho từ chối`,
        entityType: 'OUTBOUND_PROPOSAL',
        entityId: prop.id,
        targetView: 'outbound',
      });
    }

    this.persist({ ...this.data });
    return { success: true };
  }

  // ==========================================
  // WF-10 MACHINE FAILURE REPORTING
  // ==========================================
  public reportMachineFailure(params: {
    machineId: string;
    symptoms: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    imageUrl?: string;
    user: User;
  }): { success: boolean; error?: string } {
    const machine = this.data.machines.find((m) => m.id === params.machineId);
    if (!machine) return { success: false, error: 'Không tìm thấy máy' };

    const nextNum = this.data.failures.length + 31;
    const code = `INC-2026-${String(nextNum).padStart(3, '0')}`;
    const id = `inc-${Date.now()}`;

    const report: MachineFailureReport = {
      id,
      code,
      machineId: machine.id,
      machineName: machine.name,
      failureTime: new Date().toISOString(),
      symptoms: params.symptoms,
      severity: params.severity,
      imageUrl: params.imageUrl,
      reportedById: params.user.id,
      reportedByName: params.user.fullName,
      reportedAt: new Date().toISOString(),
      status: 'REPORTED',
    };

    machine.status = 'MAINTENANCE_REQUIRED';
    this.data.failures.unshift(report);

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: 'Báo sự cố máy',
      entityType: 'MACHINE_FAILURE',
      entityId: id,
      entityCode: code,
      newState: 'REPORTED',
      details: `${code}: ${machine.name} (${params.severity})`,
    });

    this.addNotification({
      recipientRole: 'M',
      title: 'Sự cố máy mới',
      message: `${code}: ${machine.name} gặp sự cố`,
      entityType: 'MACHINE_FAILURE',
      entityId: id,
      targetView: 'maintenance',
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  public assignMaintenanceStaff(params: {
    failureId: string;
    maintenanceStaffId: string;
    decision: 'ASSIGN' | 'REJECT';
    rejectionReason?: string;
    user: User;
  }): { success: boolean; error?: string } {
    const fail = this.data.failures.find((f) => f.id === params.failureId);
    if (!fail) return { success: false, error: 'Không tìm thấy sự cố' };

    if (params.decision === 'REJECT') {
      if (!params.rejectionReason?.trim()) return { success: false, error: 'Bắt buộc nhập lý do từ chối' };
      fail.status = 'REJECTED';
      fail.rejectionReason = params.rejectionReason;
      const machine = this.data.machines.find((m) => m.id === fail.machineId);
      if (machine) machine.status = 'OPERATIONAL';

      this.addAuditLog({
        actorId: params.user.id,
        actorName: params.user.fullName,
        actorRole: params.user.role,
        action: 'Từ chối sự cố',
        entityType: 'MACHINE_FAILURE',
        entityId: fail.id,
        entityCode: fail.code,
        previousState: 'REPORTED',
        newState: 'REJECTED',
        reason: params.rejectionReason,
      });
      this.persist({ ...this.data });
      return { success: true };
    }

    const staff = this.data.users.find((u) => u.id === params.maintenanceStaffId);
    if (!staff) return { success: false, error: 'Không tìm thấy nhân viên bảo trì' };

    fail.status = 'ASSIGNED';
    fail.assignedMaintenanceStaffId = staff.id;
    fail.assignedMaintenanceStaffName = staff.fullName;
    fail.assignedAt = new Date().toISOString();
    fail.assignedById = params.user.id;
    fail.assignedByName = params.user.fullName;

    const machine = this.data.machines.find((m) => m.id === fail.machineId);
    if (machine) machine.status = 'UNDER_REPAIR';

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: 'Tiếp nhận & Phân công',
      entityType: 'MACHINE_FAILURE',
      entityId: fail.id,
      entityCode: fail.code,
      previousState: 'REPORTED',
      newState: 'ASSIGNED',
      details: `Phân công kỹ thuật viên ${staff.fullName}`,
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  // ==========================================
  // WF-12 MAINTENANCE MATERIALS & ACTUAL PURCHASE
  // ==========================================
  public createMaterialRequest(params: {
    failureReportId: string;
    items: { materialName: string; requestedQuantity: number; unit: string; reason: string }[];
    user: User;
  }): { success: boolean; error?: string } {
    if (params.user.role !== 'MS') {
      return { success: false, error: 'Chỉ Nhân viên bảo trì mới có quyền lập đề xuất vật tư' };
    }

    const fail = this.data.failures.find((f) => f.id === params.failureReportId);
    if (!fail) return { success: false, error: 'Không tìm thấy sự cố' };

    const nextNum = this.data.materialRequests.length + 9;
    const code = `MAT-REQ-2026-${String(nextNum).padStart(3, '0')}`;
    const id = `mat-req-${Date.now()}`;

    const formattedItems = params.items.map((it, idx) => ({
      id: `item-${id}-${idx}`,
      materialName: it.materialName,
      requestedQuantity: it.requestedQuantity,
      unit: it.unit,
      reason: it.reason,
      status: 'PENDING' as const,
    }));

    const req: MaintenanceMaterialRequest = {
      id,
      code,
      failureReportId: fail.id,
      machineName: fail.machineName,
      maintenanceStaffId: params.user.id,
      maintenanceStaffName: params.user.fullName,
      createdAt: new Date().toISOString(),
      items: formattedItems,
    };

    fail.status = 'WAITING_SUPPLY'; // Phase 1: Chờ duyệt vật tư
    this.data.materialRequests.unshift(req);

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: 'Đề xuất vật tư bảo trì',
      entityType: 'MAINTENANCE_MATERIAL_REQUEST',
      entityId: id,
      entityCode: code,
      newState: 'WAITING_SUPPLY',
      details: `${code}: Đề xuất ${formattedItems.length} loại vật tư cho ${fail.machineName}`,
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  public decideMaterialItem(params: {
    requestId: string;
    itemId: string;
    decision: 'APPROVE' | 'REJECT';
    rejectionReason?: string;
    user: User;
  }): { success: boolean; error?: string } {
    const req = this.data.materialRequests.find((r) => r.id === params.requestId);
    if (!req) return { success: false, error: 'Không tìm thấy phiếu yêu cầu vật tư' };
    const item = req.items.find((i) => i.id === params.itemId);
    if (!item) return { success: false, error: 'Không tìm thấy dòng vật tư' };

    item.decidedById = params.user.id;
    item.decidedByName = params.user.fullName;
    item.decidedAt = new Date().toISOString();

    if (params.decision === 'APPROVE') {
      item.status = 'APPROVED';
    } else {
      if (!params.rejectionReason?.trim()) return { success: false, error: 'Bắt buộc nhập lý do từ chối' };
      item.status = 'REJECTED';
      item.rejectionReason = params.rejectionReason;
    }

    // Update Failure Status based on items state
    const fail = this.data.failures.find((f) => f.id === req.failureReportId);
    if (fail) {
      const anyApproved = req.items.some((i) => i.status === 'APPROVED');
      const allDecided = req.items.every((i) => i.status === 'APPROVED' || i.status === 'REJECTED');
      if (anyApproved) {
        fail.status = 'WAITING_FOR_MATERIALS'; // Phase 2: Chờ mua vật tư
      } else if (allDecided) {
        fail.status = 'UNDER_REPAIR';
      }
    }

    this.persist({ ...this.data });
    return { success: true };
  }

  // Record Actual Material Purchase and link to Finance Expense! (Sec 29)
  public recordActualMaterialPurchase(params: {
    requestId: string;
    itemId: string;
    actualPurchasedQuantity: number;
    actualUnitPriceVnd: number;
    supplierName?: string;
    invoiceUrl?: string;
    purchaseNotes?: string;
    user: User;
  }): { success: boolean; error?: string } {
    const req = this.data.materialRequests.find((r) => r.id === params.requestId);
    if (!req) return { success: false, error: 'Không tìm thấy yêu cầu' };
    const item = req.items.find((i) => i.id === params.itemId);
    if (!item) return { success: false, error: 'Không tìm thấy vật tư' };
    if (item.status !== 'APPROVED') {
      return { success: false, error: 'Chỉ ghi nhận mua thực tế cho vật tư đã được phê duyệt' };
    }

    const total = params.actualPurchasedQuantity * params.actualUnitPriceVnd;
    item.isPurchased = true;
    item.actualPurchasedQuantity = params.actualPurchasedQuantity;
    item.actualUnitPriceVnd = params.actualUnitPriceVnd;
    item.actualTotalAmountVnd = total;
    item.purchasedAt = new Date().toISOString();
    item.supplierName = params.supplierName;
    item.invoiceUrl = params.invoiceUrl;
    item.purchasedById = params.user.id;
    item.purchasedByName = params.user.fullName;
    item.purchaseNotes = params.purchaseNotes;

    // Register into Finance Expense records!
    const expCode = `EXP-2026-${String(this.data.expenseRecords.length + 1).padStart(3, '0')}`;
    const newExp: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      code: expCode,
      expenseDate: new Date().toISOString().split('T')[0],
      category: 'MAINTENANCE_PARTS',
      title: `Mua ${item.materialName} (${params.actualPurchasedQuantity} ${item.unit})`,
      amountVnd: total,
      status: 'PAID',
      linkedEntityId: req.id,
      linkedEntityCode: req.code,
      recipientOrVendor: params.supplierName || 'Nhà cung ứng phụ tùng',
      receiptImageUrl: params.invoiceUrl,
      createdById: params.user.id,
      createdByName: params.user.fullName,
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
      paidById: params.user.id,
      paidByName: params.user.fullName,
    };
    this.data.expenseRecords.unshift(newExp);

    // Update Failure Status to phase 3 or 4:
    const fail = this.data.failures.find((f) => f.id === req.failureReportId);
    if (fail) {
      const approvedItems = req.items.filter((i) => i.status === 'APPROVED');
      const allPurchased = approvedItems.length > 0 && approvedItems.every((i) => i.isPurchased);
      if (allPurchased) {
        fail.status = 'ENOUGH_MATERIALS'; // Phase 4: Đã đủ vật tư
      } else {
        fail.status = 'SUPPLYING'; // Phase 3: Đang cung ứng / Chờ bổ sung vật tư
      }
    }

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: 'Ghi nhận mua vật tư thực tế',
      entityType: 'MAINTENANCE_MATERIAL_ITEM',
      entityId: item.id,
      details: `Mua ${params.actualPurchasedQuantity} ${item.unit} ${item.materialName} - Thành tiền: ${total.toLocaleString('vi-VN')} VND. Tự động ghi nhận khoản chi ${expCode}`,
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  public submitMaintenanceCompletionReport(params: {
    failureReportId: string;
    rootCause: string;
    actionsTaken: string;
    materialsUsedText: string;
    repairResult: string;
    beforeImageUrl?: string;
    afterImageUrl?: string;
    user: User;
  }): { success: boolean; error?: string } {
    if (params.user.role !== 'MS') {
      return { success: false, error: 'Chỉ Nhân viên bảo trì mới có quyền nộp báo cáo hoàn thành sửa chữa' };
    }

    const fail = this.data.failures.find((f) => f.id === params.failureReportId);
    if (!fail) return { success: false, error: 'Không tìm thấy sự cố' };

    const report: MaintenanceReport = {
      id: `maint-rep-${Date.now()}`,
      failureReportId: fail.id,
      machineId: fail.machineId,
      machineName: fail.machineName,
      maintenanceStaffId: params.user.id,
      maintenanceStaffName: params.user.fullName,
      rootCause: params.rootCause,
      actionsTaken: params.actionsTaken,
      materialsUsedText: params.materialsUsedText,
      repairResult: params.repairResult,
      beforeImageUrl: params.beforeImageUrl,
      afterImageUrl: params.afterImageUrl,
      submittedAt: new Date().toISOString(),
      isManagerApproved: false,
    };

    fail.status = 'PENDING_CONFIRMATION'; // Chờ Quản lý/Owner nghiệm thu
    this.data.maintenanceReports.unshift(report);

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: 'Nộp báo cáo hoàn thành sửa chữa',
      entityType: 'MAINTENANCE_REPORT',
      entityId: report.id,
      entityCode: fail.code,
      previousState: 'UNDER_REPAIR',
      newState: 'PENDING_CONFIRMATION',
      details: `Kỹ thuật viên ${params.user.fullName} báo cáo hoàn thành sửa chữa ${fail.machineName}`,
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  public approveMaintenanceCompletion(params: {
    reportId: string;
    decision: 'APPROVE' | 'RETURN';
    returnReason?: string;
    user: User;
  }): { success: boolean; error?: string } {
    const report = this.data.maintenanceReports.find((r) => r.id === params.reportId);
    if (!report) return { success: false, error: 'Không tìm thấy báo cáo' };
    const fail = this.data.failures.find((f) => f.id === report.failureReportId);
    const machine = this.data.machines.find((m) => m.id === report.machineId);

    if (params.decision === 'APPROVE') {
      report.isManagerApproved = true;
      report.approvedById = params.user.id;
      report.approvedByName = params.user.fullName;
      report.approvedAt = new Date().toISOString();

      if (fail) fail.status = 'COMPLETED';
      if (machine) machine.status = 'OPERATIONAL';

      this.addAuditLog({
        actorId: params.user.id,
        actorName: params.user.fullName,
        actorRole: params.user.role,
        action: 'Nghiệm thu bảo trì & Kích hoạt máy',
        entityType: 'MAINTENANCE_REPORT',
        entityId: report.id,
        entityCode: fail?.code,
        previousState: 'PENDING_CONFIRMATION',
        newState: 'COMPLETED',
        details: `Đã nghiệm thu thiết bị ${report.machineName}, máy trở lại trạng thái Đang hoạt động`,
      });
    } else {
      if (!params.returnReason?.trim()) return { success: false, error: 'Bắt buộc nhập lý do trả lại báo cáo' };
      report.returnReason = params.returnReason;
      if (fail) fail.status = 'UNDER_REPAIR';

      this.addAuditLog({
        actorId: params.user.id,
        actorName: params.user.fullName,
        actorRole: params.user.role,
        action: 'Trả lại báo cáo bảo trì',
        entityType: 'MAINTENANCE_REPORT',
        entityId: report.id,
        entityCode: fail?.code,
        previousState: 'PENDING_CONFIRMATION',
        newState: 'UNDER_REPAIR',
        reason: params.returnReason,
      });
    }

    this.persist({ ...this.data });
    return { success: true };
  }

  // ==========================================
  // XIV. FINANCIAL MANAGEMENT (Revenue, Receivables, Payables, Expenses)
  // ==========================================
  public recordCustomerPayment(
    invoiceId: string,
    amount: number,
    notes?: string,
    user?: User
  ): { success: boolean; error?: string } {
    const inv = this.data.saleInvoices.find((i) => i.id === invoiceId);
    if (!inv) return { success: false, error: 'Không tìm thấy hóa đơn' };
    if (amount <= 0 || amount > inv.remainingAmountVnd) {
      return { success: false, error: 'Số tiền thu không hợp lệ' };
    }

    inv.paidAmountVnd += amount;
    inv.remainingAmountVnd -= amount;
    inv.paymentStatus = inv.remainingAmountVnd === 0 ? 'PAID' : 'PARTIALLY_PAID';

    inv.paymentHistory.push({
      amount,
      paidAt: new Date().toISOString(),
      recordedByName: user?.fullName || 'Giám đốc',
      notes,
    });

    this.addAuditLog({
      actorId: user?.id || 'sys',
      actorName: user?.fullName || 'Hệ thống',
      actorRole: user?.role || 'O',
      action: 'Ghi nhận thanh toán khách hàng',
      entityType: 'SALE_INVOICE',
      entityId: inv.id,
      entityCode: inv.code,
      details: `Thu ${amount.toLocaleString('vi-VN')} VND từ ${inv.customerName}`,
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  public createExpenseProposal(params: {
    expenseDate: string;
    category: ExpenseCategory;
    title: string;
    amountVnd: number;
    recipientOrVendor: string;
    receiptImageUrl?: string;
    user: User;
  }): { success: boolean; error?: string } {
    if (params.amountVnd <= 0) return { success: false, error: 'Số tiền phải lớn hơn 0' };

    const isOwner = params.user.role === 'O';
    const status = isOwner ? 'APPROVED' : 'PENDING_APPROVAL';
    const code = `EXP-2026-${String(this.data.expenseRecords.length + 1).padStart(3, '0')}`;

    const exp: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      code,
      expenseDate: params.expenseDate,
      category: params.category,
      title: params.title,
      amountVnd: params.amountVnd,
      status,
      recipientOrVendor: params.recipientOrVendor,
      receiptImageUrl: params.receiptImageUrl,
      createdById: params.user.id,
      createdByName: params.user.fullName,
      createdAt: new Date().toISOString(),
      approvedById: isOwner ? params.user.id : undefined,
      approvedByName: isOwner ? params.user.fullName : undefined,
      approvedAt: isOwner ? new Date().toISOString() : undefined,
    };

    this.data.expenseRecords.unshift(exp);

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: isOwner ? 'Owner duyệt chi trực tiếp' : 'Tạo đề xuất chi phí',
      entityType: 'EXPENSE_RECORD',
      entityId: exp.id,
      entityCode: code,
      details: `${code}: ${params.title} - ${params.amountVnd.toLocaleString('vi-VN')} VND`,
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  public decideExpense(params: {
    expenseId: string;
    decision: 'APPROVE' | 'REJECT';
    reason?: string;
    user: User;
  }): { success: boolean; error?: string } {
    const exp = this.data.expenseRecords.find((e) => e.id === params.expenseId);
    if (!exp) return { success: false, error: 'Không tìm thấy khoản chi' };

    if (params.decision === 'APPROVE') {
      exp.status = 'APPROVED';
      exp.approvedById = params.user.id;
      exp.approvedByName = params.user.fullName;
      exp.approvedAt = new Date().toISOString();
    } else {
      if (!params.reason?.trim()) return { success: false, error: 'Bắt buộc nhập lý do' };
      exp.status = 'REJECTED';
      exp.rejectionReason = params.reason;
    }

    this.persist({ ...this.data });
    return { success: true };
  }

  public recordExpensePayment(expenseId: string, user: User): { success: boolean; error?: string } {
    const exp = this.data.expenseRecords.find((e) => e.id === expenseId);
    if (!exp) return { success: false, error: 'Không tìm thấy khoản chi' };

    exp.status = 'PAID';
    exp.paidAt = new Date().toISOString();
    exp.paidById = user.id;
    exp.paidByName = user.fullName;

    this.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: 'Xác nhận thanh toán chi phí',
      entityType: 'EXPENSE_RECORD',
      entityId: exp.id,
      entityCode: exp.code,
      details: `Đã chi ${exp.amountVnd.toLocaleString('vi-VN')} VND cho ${exp.recipientOrVendor}`,
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  // Master Data Methods
  public addMachine(params: Omit<Machine, 'id'>, user: User) {
    const id = `m-${Date.now()}`;
    const machine: Machine = { ...params, id };
    this.data.machines.push(machine);
    this.persist({ ...this.data });
    return { success: true };
  }

  public updateMachineStatus(machineId: string, status: Machine['status'], user: User) {
    const machine = this.data.machines.find((m) => m.id === machineId);
    if (!machine) return { success: false, error: 'Không tìm thấy máy' };
    machine.status = status;
    this.persist({ ...this.data });
    return { success: true };
  }

  public addSupplier(params: Omit<Supplier, 'id'>, user: User) {
    if (user.role !== 'O') {
      return { success: false, error: 'Chỉ Giám đốc (Owner) mới có quyền tạo Nhà cung cấp' };
    }
    const id = `sup-${Date.now()}`;
    const sup: Supplier = { ...params, id, totalPurchasedKg: 0, totalPaidVnd: 0, status: 'ACTIVE' };
    this.data.suppliers.push(sup);
    this.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: 'Tạo Nhà cung cấp',
      entityType: 'SUPPLIER',
      entityId: id,
      entityCode: sup.code,
      details: `Tạo NCC ${sup.code} - ${sup.name}`,
    });
    this.persist({ ...this.data });
    return { success: true, supplier: sup };
  }

  public updateSupplier(id: string, params: Partial<Supplier>, user: User) {
    if (user.role !== 'O') {
      return { success: false, error: 'Chỉ Giám đốc (Owner) mới có quyền chỉnh sửa thông tin Nhà cung cấp' };
    }
    const sup = this.data.suppliers.find((s) => s.id === id);
    if (!sup) return { success: false, error: 'Không tìm thấy NCC' };
    Object.assign(sup, params);
    this.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: 'Cập nhật Nhà cung cấp',
      entityType: 'SUPPLIER',
      entityId: id,
      entityCode: sup.code,
      details: `Cập nhật thông tin NCC ${sup.code} - ${sup.name}`,
    });
    this.persist({ ...this.data });
    return { success: true };
  }

  public deactivateSupplier(id: string, user: User) {
    if (user.role !== 'O') {
      return { success: false, error: 'Chỉ Giám đốc (Owner) mới có quyền ngừng sử dụng Nhà cung cấp' };
    }
    const sup = this.data.suppliers.find((s) => s.id === id);
    if (!sup) return { success: false, error: 'Không tìm thấy NCC' };
    sup.status = sup.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: sup.status === 'INACTIVE' ? 'Ngừng sử dụng NCC' : 'Kích hoạt lại NCC',
      entityType: 'SUPPLIER',
      entityId: id,
      entityCode: sup.code,
      details: `${sup.status === 'INACTIVE' ? 'Ngừng sử dụng' : 'Kích hoạt lại'} NCC ${sup.code}`,
    });
    this.persist({ ...this.data });
    return { success: true, newStatus: sup.status };
  }

  public addCustomer(params: Omit<Customer, 'id'>, user: User) {
    if (user.role !== 'O') {
      return { success: false, error: 'Chỉ Giám đốc (Owner) mới có quyền tạo Khách hàng' };
    }
    const id = `cus-${Date.now()}`;
    const cus: Customer = { ...params, id, totalOrderedKg: 0, totalReceivableVnd: 0, status: 'ACTIVE' };
    this.data.customers.push(cus);
    this.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: 'Tạo Khách hàng',
      entityType: 'CUSTOMER',
      entityId: id,
      entityCode: cus.code,
      details: `Tạo khách hàng ${cus.code} - ${cus.name}`,
    });
    this.persist({ ...this.data });
    return { success: true, customer: cus };
  }

  public updateCustomer(id: string, params: Partial<Customer>, user: User) {
    if (user.role !== 'O') {
      return { success: false, error: 'Chỉ Giám đốc (Owner) mới có quyền chỉnh sửa thông tin Khách hàng' };
    }
    const cus = this.data.customers.find((c) => c.id === id);
    if (!cus) return { success: false, error: 'Không tìm thấy KH' };
    Object.assign(cus, params);
    this.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: 'Cập nhật Khách hàng',
      entityType: 'CUSTOMER',
      entityId: id,
      entityCode: cus.code,
      details: `Cập nhật thông tin KH ${cus.code} - ${cus.name}`,
    });
    this.persist({ ...this.data });
    return { success: true };
  }

  public deactivateCustomer(id: string, user: User) {
    if (user.role !== 'O') {
      return { success: false, error: 'Chỉ Giám đốc (Owner) mới có quyền ngừng sử dụng Khách hàng' };
    }
    const cus = this.data.customers.find((c) => c.id === id);
    if (!cus) return { success: false, error: 'Không tìm thấy KH' };
    cus.status = cus.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: cus.status === 'INACTIVE' ? 'Ngừng sử dụng KH' : 'Kích hoạt lại KH',
      entityType: 'CUSTOMER',
      entityId: id,
      entityCode: cus.code,
      details: `${cus.status === 'INACTIVE' ? 'Ngừng sử dụng' : 'Kích hoạt lại'} KH ${cus.code}`,
    });
    this.persist({ ...this.data });
    return { success: true, newStatus: cus.status };
  }

  // Admin Methods
  public createUserAccount(params: any, adminUser: User) {
    if (adminUser.role !== 'A') return { success: false, error: 'Chỉ Admin mới có quyền' };
    if (params.role === 'O') return { success: false, error: 'Không thể cấp quyền Owner' };
    const id = `u-${params.role.toLowerCase()}-${Date.now()}`;
    const newUser: User = {
      id,
      username: params.username,
      fullName: params.fullName,
      email: params.email,
      phone: params.phone,
      role: params.role,
      isActive: true,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.persist({ ...this.data });
    return { success: true };
  }

  public toggleUserLock(userId: string, adminUser: User) {
    if (adminUser.role !== 'A') return { success: false, error: 'Chỉ Admin mới có quyền' };
    const user = this.data.users.find((u) => u.id === userId);
    if (!user || user.role === 'O') return { success: false, error: 'Không thể khóa' };
    user.isActive = !user.isActive;
    this.persist({ ...this.data });
    return { success: true };
  }

  public updateUserProfile(userId: string, params: any) {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'Không tìm thấy người dùng' };
    user.fullName = params.fullName;
    user.phone = params.phone;
    user.email = params.email;
    if (params.avatarUrl) user.avatarUrl = params.avatarUrl;
    this.persist({ ...this.data });
    return { success: true };
  }
}

export const db = new DatabaseService();
