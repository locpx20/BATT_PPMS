/**
 * BATT PPMS - Relational Data Store & Business Transaction Engine
 * CÔNG TY CỔ PHẦN NĂNG LƯỢNG TÁI TẠO BATT
 * Ensures Data Integrity, Stock Consistency, FIFO Dispatch and Full Audit Trail
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
  StockMovement,
  AuditLog,
  InternalNotification,
  RoleCode,
} from '../types';

const STORAGE_KEY = 'batt_ppms_database_v6';

// 8 Official System Users
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

// Initial Suppliers
export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-01',
    code: 'NCC-01',
    name: 'Công ty TNHH Lâm Nghiệp Hàm Thuận',
    phone: '0252.386.1111',
    address: 'KCN Hàm Kiệm, Huyện Hàm Thuận Nam, Bình Thuận',
    contactPerson: 'Ông Nguyễn Đức Thắng',
    status: 'ACTIVE',
    materialTypes: ['Mùn cưa keo tràm', 'Dăm gỗ tràm'],
    notes: 'Đối tác chiến lược cung cấp mùn cưa độ ẩm < 45%',
  },
  {
    id: 'sup-02',
    code: 'NCC-02',
    name: 'Xưởng Chế biến Gỗ Minh Phú',
    phone: '0252.399.2222',
    address: 'Thị trấn Ma Lâm, Hàm Thuận Bắc, Bình Thuận',
    contactPerson: 'Bà Lê Thị Mỹ',
    status: 'ACTIVE',
    materialTypes: ['Dăm bào cao su', 'Mùn cưa cao su'],
  },
  {
    id: 'sup-03',
    code: 'NCC-03',
    name: 'Hợp tác xã Gỗ Rừng Trồng Tánh Linh',
    phone: '0252.377.3333',
    address: 'Xã Đức Thuận, Huyện Tánh Linh, Bình Thuận',
    contactPerson: 'Ông Trần Văn Ba',
    status: 'ACTIVE',
    materialTypes: ['Cây củi tạp', 'Dăm gỗ keo lá tràm'],
  },
  {
    id: 'sup-04',
    code: 'NCC-04',
    name: 'Công ty Cổ phần Nông Lâm Sản Đức Linh',
    phone: '0252.366.4444',
    address: 'Võ Xu, Đức Linh, Bình Thuận',
    contactPerson: 'Ông Vũ Hoàng Nam',
    status: 'ACTIVE',
    materialTypes: ['Mùn cưa thông', 'Vỏ cây băm'],
  },
  {
    id: 'sup-05',
    code: 'NCC-05',
    name: 'Doanh nghiệp Tư nhân Gỗ Nam Thành',
    phone: '0251.355.5555',
    address: 'KCN Sông Mây, Trảng Bom, Đồng Nai',
    contactPerson: 'Bà Hoàng Kim Oanh',
    status: 'ACTIVE',
    materialTypes: ['Dăm bào khô', 'Mùn cưa nội thất'],
  },
  {
    id: 'sup-06',
    code: 'NCC-06',
    name: 'Lâm trường Xuyên Mộc',
    phone: '0254.388.6666',
    address: 'Bông Trang, Xuyên Mộc, Bà Rịa - Vũng Tàu',
    contactPerson: 'Ông Đặng Quốc Dũng',
    status: 'ACTIVE',
    materialTypes: ['Dăm gỗ bạch đàn'],
  },
  {
    id: 'sup-07',
    code: 'NCC-07',
    name: 'Công ty TNHH Phế liệu Lâm nghiệp Đại Việt',
    phone: '0274.377.7777',
    address: 'Tân Uyên, Bình Dương',
    contactPerson: 'Bà Mai Phương Thúy',
    status: 'ACTIVE',
    materialTypes: ['Mùn cưa ép khối'],
  },
  {
    id: 'sup-08',
    code: 'NCC-08',
    name: 'Cơ sở Thu gom Dăm gỗ Sông Phan',
    phone: '0252.344.8888',
    address: 'Sông Phan, Hàm Tân, Bình Thuận',
    contactPerson: 'Ông Lê Hùng',
    status: 'ACTIVE',
    materialTypes: ['Dăm gỗ tạp địa phương'],
  },
];

// Initial Customers
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

// Initial Machines across all 7 stages
export const INITIAL_MACHINES: Machine[] = [
  {
    id: 'm-01',
    code: 'M-CLEAN-01',
    name: 'Máy sàng làm sạch tạp chất và tách kim loại từ tính',
    stage: 'CLEANING',
    model: 'Rotary Screen BATT-50T',
    capacity: '35 tấn/giờ',
    status: 'OPERATIONAL',
    installationDate: '2024-03-15',
    location: 'Khu vực tiếp nhận NVL thô',
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
    name: 'Hệ thống máy nghiền búa siêu mịn mùn cưa',
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
  stockMovements: StockMovement[];
  auditLogs: AuditLog[];
  notifications: InternalNotification[];
  rawInventoryBalanceKg: number; // Tồn kho NVL hiện hành (kg)
  finishedInventoryBalanceKg: number; // Tồn kho thành phẩm hiện hành (kg)
}

function getInitialDatabase(): AppDatabase {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const timeStr = now.toISOString();

  // Initial Seed Data to allow thorough testing of all 18 workflows
  const purchases: PurchaseAssignment[] = [
    {
      id: 'po-01',
      code: 'PO-2026-001',
      supplierId: 'sup-01',
      supplierName: 'Công ty TNHH Lâm Nghiệp Hàm Thuận',
      rawMaterialType: 'Mùn cưa keo tràm',
      plannedQuantityKg: 25000,
      plannedDate: '2026-10-24',
      assignedStaffId: 'u-purchasing-01',
      assignedStaffName: 'Lê Văn Quang (Thu mua)',
      createdById: 'u-mgr-01',
      createdByName: 'Trần Quốc Bảo (Trưởng phòng Vận hành)',
      createdAt: '2026-10-24T08:00:00Z',
      status: 'RECEIVED',
      notes: 'Thu mua mùn cưa phục vụ ca 1 và ca 2',
      weighedQuantityKg: 24800,
      unitPriceVnd: 750,
      totalAmountVnd: 18600000,
      weighedAt: '2026-10-24T10:15:00Z',
      scaleTicketImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600',
      invoiceImageUrl: 'https://images.unsplash.com/photo-1554415707-9e42acb69990?w=600',
      purchasingNotes: 'Xe chở 1 chuyến xe ben 3 chân, hao hụt bốc dỡ 200kg',
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
      rawMaterialType: 'Dăm bào cao su',
      plannedQuantityKg: 18000,
      plannedDate: '2026-10-24',
      assignedStaffId: 'u-purchasing-01',
      assignedStaffName: 'Lê Văn Quang (Thu mua)',
      createdById: 'u-owner-01',
      createdByName: 'Nguyễn Văn Thành (Giám đốc)',
      createdAt: '2026-10-24T09:00:00Z',
      status: 'APPROVED',
      notes: 'Dăm bào khô, độ ẩm tốt cần nhập gấp',
      weighedQuantityKg: 17850,
      unitPriceVnd: 820,
      totalAmountVnd: 14637000,
      weighedAt: '2026-10-24T13:45:00Z',
      scaleTicketImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600',
      purchasingNotes: 'Phiếu cân số 4821 Trạm cân ngã tư Ma Lâm',
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
      rawMaterialType: 'Dăm gỗ keo lá tràm',
      plannedQuantityKg: 30000,
      plannedDate: '2026-10-25',
      assignedStaffId: 'u-purchasing-01',
      assignedStaffName: 'Lê Văn Quang (Thu mua)',
      createdById: 'u-mgr-01',
      createdByName: 'Trần Quốc Bảo (Trưởng phòng Vận hành)',
      createdAt: '2026-10-24T15:00:00Z',
      status: 'SUBMITTED',
      notes: 'Chờ duyệt kết quả cân thực tế từ Tánh Linh về',
      weighedQuantityKg: 29500,
      unitPriceVnd: 780,
      totalAmountVnd: 23010000,
      weighedAt: '2026-10-24T16:30:00Z',
      scaleTicketImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600',
      invoiceImageUrl: 'https://images.unsplash.com/photo-1554415707-9e42acb69990?w=600',
      purchasingNotes: 'Đã kèm biên bản cân điện tử trạm cầu Hàm Tân',
      submittedAt: '2026-10-24T16:45:00Z',
    },
    {
      id: 'po-04',
      code: 'PO-2026-004',
      supplierId: 'sup-04',
      supplierName: 'Công ty Cổ phần Nông Lâm Sản Đức Linh',
      rawMaterialType: 'Mùn cưa thông',
      plannedQuantityKg: 15000,
      plannedDate: '2026-10-25',
      assignedStaffId: 'u-purchasing-01',
      assignedStaffName: 'Lê Văn Quang (Thu mua)',
      createdById: 'u-mgr-01',
      createdByName: 'Trần Quốc Bảo (Trưởng phòng Vận hành)',
      createdAt: '2026-10-24T10:00:00Z',
      status: 'RETURNED',
      notes: 'Bị trả lại do thiếu hóa đơn VAT kèm phiếu cân',
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
      rawMaterialType: 'Dăm bào khô',
      plannedQuantityKg: 20000,
      plannedDate: '2026-10-26',
      assignedStaffId: 'u-purchasing-01',
      assignedStaffName: 'Lê Văn Quang (Thu mua)',
      createdById: 'u-mgr-01',
      createdByName: 'Trần Quốc Bảo (Trưởng phòng Vận hành)',
      createdAt: '2026-10-24T16:00:00Z',
      status: 'ASSIGNED',
      notes: 'Phân công đi cân nhận ngày 26/10',
    },
  ];

  // Initial Production Plans
  const productionPlans: ProductionPlan[] = [
    {
      id: 'plan-01',
      code: 'PLAN-2026-042',
      productionDate: '2026-10-24',
      shift: 'CA_1',
      productName: 'Viên nén gỗ Tràm xuất khẩu ENplus-A1',
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
          operatorId: 'u-prod-01',
          operatorName: 'Hoàng Văn Hùng (Tổ trưởng Sản xuất)',
          targetQuantityKg: 24000,
        },
        {
          id: 'tsk-02',
          stage: 'DRYING',
          machineId: 'm-04',
          machineName: 'Hệ thống lò sấy thùng quay (M-DRY-01)',
          operatorId: 'u-prod-01',
          operatorName: 'Hoàng Văn Hùng (Tổ trưởng Sản xuất)',
          targetQuantityKg: 22000,
        },
        {
          id: 'tsk-03',
          stage: 'PELLETIZING',
          machineId: 'm-06',
          machineName: 'Máy ép viên nén CPM-1 (M-PELLET-01)',
          operatorId: 'u-prod-01',
          operatorName: 'Hoàng Văn Hùng (Tổ trưởng Sản xuất)',
          targetQuantityKg: 20000,
        },
        {
          id: 'tsk-04',
          stage: 'PACKAGING',
          machineId: 'm-08',
          machineName: 'Trạm cân đóng bao Jumbo 1 tấn (M-PACK-01)',
          operatorId: 'u-prod-01',
          operatorName: 'Hoàng Văn Hùng (Tổ trưởng Sản xuất)',
          targetQuantityKg: 20000,
        },
      ],
    },
    {
      id: 'plan-02',
      code: 'PLAN-2026-043',
      productionDate: '2026-10-24',
      shift: 'CA_2',
      productName: 'Viên nén gỗ Công nghiệp Grade B',
      targetQuantityKg: 18000,
      status: 'IN_PROGRESS',
      createdById: 'u-owner-01',
      createdByName: 'Nguyễn Văn Thành (Giám đốc)',
      createdAt: '2026-10-24T07:30:00Z',
      notes: 'Sản xuất cho đơn hàng cấp nhà máy nhiệt điện',
      assignments: [
        {
          id: 'tsk-05',
          stage: 'MILLING',
          machineId: 'm-03',
          machineName: 'Hệ thống máy nghiền búa (M-MILL-01)',
          operatorId: 'u-prod-01',
          operatorName: 'Hoàng Văn Hùng (Tổ trưởng Sản xuất)',
          targetQuantityKg: 20000,
        },
        {
          id: 'tsk-06',
          stage: 'PELLETIZING',
          machineId: 'm-06',
          machineName: 'Máy ép viên nén CPM-1 (M-PELLET-01)',
          operatorId: 'u-prod-01',
          operatorName: 'Hoàng Văn Hùng (Tổ trưởng Sản xuất)',
          targetQuantityKg: 18000,
        },
      ],
    },
  ];

  // Material issues
  const materialIssues: RawMaterialIssue[] = [
    {
      id: 'mat-iss-01',
      code: 'MAT-ISS-001',
      planId: 'plan-01',
      planCode: 'PLAN-2026-042',
      rawMaterialType: 'Mùn cưa keo tràm',
      issuedQuantityKg: 22500,
      recipientDepartment: 'Tổ Vận hành Lò Sấy & Ép Viên',
      issuedAt: '2026-10-24T06:15:00Z',
      issuedById: 'u-wh-01',
      issuedByName: 'Phạm Thị Phương Thảo (Thủ kho)',
      notes: 'Cấp đủ cho ca 1 sản xuất viên nén xuất khẩu',
    },
  ];

  // Shift reports
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
      planCode: 'PLAN-2026-042',
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

  // Initial Lots & 3 independent QC tests
  const lots: LotItem[] = [
    {
      id: 'lot-01',
      lotCode: 'LOT-20261024-01',
      planId: 'plan-01',
      planCode: 'PLAN-2026-042',
      shiftReportId: 'rep-01',
      productionDate: '2026-10-24',
      productName: 'Viên nén gỗ Tràm xuất khẩu ENplus-A1',
      quantityKg: 20000,
      jumboBagsCount: 20,
      grade: 'GRADE_A',
      qcStatus: 'QC_PASSED',
      reDryCount: 0,
      isReceivedInWarehouse: true,
      receivedAt: '2026-10-24T15:00:00Z',
      receivedById: 'u-wh-01',
      receivedByName: 'Phạm Thị Phương Thảo (Thủ kho)',
      availableQuantityKg: 10000, // 10,000 kg committed/dispatched, 10,000 available
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
          imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600',
          notes: 'Mẫu đầu ca 1: Đạt chuẩn ENplus-A1, bề mặt sáng mịn',
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
          imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600',
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
          imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600',
          notes: 'Mẫu cuối ca: Đạt 3/3 lần kiểm tra, xác nhận Grade A',
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
      productName: 'Viên nén gỗ Công nghiệp Grade B',
      quantityKg: 18000,
      jumboBagsCount: 18,
      grade: 'GRADE_B',
      qcStatus: 'IN_TESTING',
      reDryCount: 0,
      isReceivedInWarehouse: false, // Waiting for 3 QC tests and warehouse receipt
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
          imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600',
          notes: 'Kiểm tra lần 1: Đạt tiêu chuẩn công nghiệp Grade B',
        },
      ],
    },
  ];

  // Outbound Proposals
  const outboundProposals: OutboundProposal[] = [
    {
      id: 'out-01',
      code: 'OUT-PROP-2026-015',
      flow: 'FLOW_B', // Flow B: Manager creates -> Owner decides
      customerId: 'cus-01',
      customerName: 'Sumitomo Forestry Co., Ltd (Japan)',
      productName: 'Viên nén gỗ Tràm xuất khẩu ENplus-A1',
      lotId: 'lot-01',
      lotCode: 'LOT-20261024-01',
      grade: 'GRADE_A',
      requestedQuantityKg: 10000,
      unitPriceVnd: 3850,
      totalValueVnd: 38500000,
      status: 'DISPATCHED',
      notes: 'Đơn hàng xuất xưởng số lượng 10 bao Jumbo giao cảng Cái Mép',
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
      outboundQcMismatchDetected: false,
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
      flow: 'FLOW_A', // Flow A: Warehouse Staff creates -> Manager reviews -> Owner decides
      customerId: 'cus-03',
      customerName: 'Nhà máy Nhiệt điện Sinh khối Duyên Hải',
      productName: 'Viên nén gỗ Tràm xuất khẩu ENplus-A1',
      lotId: 'lot-01',
      lotCode: 'LOT-20261024-01',
      grade: 'GRADE_A',
      requestedQuantityKg: 5000,
      unitPriceVnd: 3600,
      totalValueVnd: 18000000,
      status: 'PENDING_OWNER_APPROVAL',
      notes: 'Thủ kho đề xuất xuất 5 bao Jumbo còn lại của LOT-20261024-01',
      createdById: 'u-wh-01',
      createdByName: 'Phạm Thị Phương Thảo (Thủ kho)',
      createdAt: '2026-10-24T16:45:00Z',
      managerReviewedById: 'u-mgr-01',
      managerReviewedByName: 'Trần Quốc Bảo (Trưởng phòng Vận hành)',
      managerReviewedAt: '2026-10-24T17:00:00Z',
      outboundQcTested: true,
      outboundQcMoisture: 7.9,
      outboundQcAsh: 0.67,
      outboundQcImpurities: 0.13,
      outboundQcTestedById: 'u-qc-01',
      outboundQcTestedByName: 'Đỗ Thị Ngọc Lan (Trưởng nhóm KCS)',
      outboundQcTestedAt: '2026-10-24T17:15:00Z',
      outboundQcMismatchDetected: false,
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

  // Machine Failures & Maintenance
  const failures: MachineFailureReport[] = [
    {
      id: 'inc-01',
      code: 'INC-2026-031',
      machineId: 'm-07',
      machineName: 'Máy ép viên nén CPM-2 (M-PELLET-02)',
      failureTime: '2026-10-24T09:30:00Z',
      symptoms: 'Rung lắc mạnh ổ bi chính, nhiệt độ gối đỡ tăng quá 85°C kèm tiếng rít kim loại',
      severity: 'HIGH',
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600',
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
        },
        {
          id: 'item-02',
          materialName: 'Mỡ bò chịu nhiệt cao cấp Mobilith SHC 220',
          requestedQuantity: 5,
          unit: 'Tuýp 400g',
          reason: 'Bơm bôi trơn lại toàn bộ cụm gối đỡ trục chính máy ép',
          status: 'APPROVED',
          decidedById: 'u-mgr-01',
          decidedByName: 'Trần Quốc Bảo (Trưởng phòng Vận hành)',
          decidedAt: '2026-10-24T10:30:00Z',
        },
        {
          id: 'item-03',
          materialName: 'Dây curoa Gates 8V-2500',
          requestedQuantity: 8,
          unit: 'Sợi',
          reason: 'Dự phòng thêm cho bộ truyền động motor chính',
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

  // Stock movements (Physical Ledger)
  const stockMovements: StockMovement[] = [
    {
      id: 'sm-01',
      timestamp: '2026-10-24T11:30:00Z',
      materialCategory: 'RAW_MATERIAL',
      materialName: 'Mùn cưa keo tràm',
      movementType: 'IN',
      quantityKg: 24750,
      referenceDocumentType: 'PURCHASE_RECEIPT',
      referenceDocumentCode: 'PO-2026-001',
      confirmedById: 'u-wh-01',
      confirmedByName: 'Phạm Thị Phương Thảo (Thủ kho)',
      balanceAfterKg: 42250, // Starting was 17,500 + 24,750
      notes: 'Nhập kho thực tế từ xe cân PO-2026-001 NCC Hàm Thuận',
    },
    {
      id: 'sm-02',
      timestamp: '2026-10-24T06:15:00Z',
      materialCategory: 'RAW_MATERIAL',
      materialName: 'Mùn cưa keo tràm',
      movementType: 'OUT',
      quantityKg: 22500,
      referenceDocumentType: 'RAW_MATERIAL_ISSUE',
      referenceDocumentCode: 'MAT-ISS-001',
      confirmedById: 'u-wh-01',
      confirmedByName: 'Phạm Thị Phương Thảo (Thủ kho)',
      balanceAfterKg: 19750,
      notes: 'Cấp NVL cho Kế hoạch sản xuất PLAN-2026-042',
    },
    {
      id: 'sm-03',
      timestamp: '2026-10-24T15:00:00Z',
      materialCategory: 'FINISHED_GOODS',
      materialName: 'Viên nén gỗ Tràm xuất khẩu ENplus-A1',
      movementType: 'IN',
      quantityKg: 20000,
      referenceDocumentType: 'FINISHED_GOODS_RECEIPT',
      referenceDocumentCode: 'LOT-20261024-01',
      lotCode: 'LOT-20261024-01',
      confirmedById: 'u-wh-01',
      confirmedByName: 'Phạm Thị Phương Thảo (Thủ kho)',
      balanceAfterKg: 20000,
      notes: 'Thủ kho nhập 20 bao Jumbo LOT-20261024-01 sau khi QC Passed 3 lần',
    },
    {
      id: 'sm-04',
      timestamp: '2026-10-24T16:30:00Z',
      materialCategory: 'FINISHED_GOODS',
      materialName: 'Viên nén gỗ Tràm xuất khẩu ENplus-A1',
      movementType: 'OUT',
      quantityKg: 10000,
      referenceDocumentType: 'CUSTOMER_DISPATCH',
      referenceDocumentCode: 'OUT-PROP-2026-015',
      lotCode: 'LOT-20261024-01',
      confirmedById: 'u-wh-01',
      confirmedByName: 'Phạm Thị Phương Thảo (Thủ kho)',
      balanceAfterKg: 10000,
      notes: 'Xuất 10 bao Jumbo cho xe 72C-184.92 khách hàng Sumitomo Japan',
    },
  ];

  // Audit Logs
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
      details: 'Phân công nhân viên Lê Văn Quang thu mua 25.000 kg Mùn cưa keo tràm từ NCC Hàm Thuận',
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
      details: 'Hồ sơ đầy đủ phiếu cân điện tử và hóa đơn',
    },
    {
      id: 'aud-04',
      timestamp: '2026-10-24T11:30:00Z',
      actorId: 'u-wh-01',
      actorName: 'Phạm Thị Phương Thảo',
      actorRole: 'WS',
      action: 'Xác nhận nhập kho NVL vật lý',
      entityType: 'PURCHASE_ASSIGNMENT',
      entityId: 'po-01',
      entityCode: 'PO-2026-001',
      previousState: 'APPROVED',
      newState: 'RECEIVED',
      details: 'Thực nhận 24.750 kg mùn cưa, tăng tồn kho NVL',
    },
    {
      id: 'aud-05',
      timestamp: '2026-10-24T15:30:00Z',
      actorId: 'u-owner-01',
      actorName: 'Nguyễn Văn Thành',
      actorRole: 'O',
      action: 'Phê duyệt xuất hàng cuối cùng',
      entityType: 'OUTBOUND_PROPOSAL',
      entityId: 'out-01',
      entityCode: 'OUT-PROP-2026-015',
      previousState: 'PENDING_OWNER_APPROVAL',
      newState: 'APPROVED',
      details: 'Duyệt bán 10.000 kg Grade A đơn giá 3.850 VND/kg cho Sumitomo Japan',
    },
    {
      id: 'aud-06',
      timestamp: '2026-10-24T16:30:00Z',
      actorId: 'u-wh-01',
      actorName: 'Phạm Thị Phương Thảo',
      actorRole: 'WS',
      action: 'Xác nhận xuất kho vật lý',
      entityType: 'OUTBOUND_PROPOSAL',
      entityId: 'out-01',
      entityCode: 'OUT-PROP-2026-015',
      previousState: 'APPROVED',
      newState: 'DISPATCHED',
      details: 'Bàn giao 10.000 kg cho tài xế Đặng Tuấn Kiệt (xe 72C-184.92), giảm tồn kho thành phẩm',
    },
  ];

  // Internal Notifications
  const notifications: InternalNotification[] = [
    {
      id: 'notif-01',
      recipientRole: 'O',
      title: 'Đề xuất xuất hàng chờ duyệt',
      message: 'Đề xuất OUT-PROP-2026-016 (5.000 kg - Khách hàng Duyên Hải) đang chờ Owner quyết định',
      entityType: 'OUTBOUND_PROPOSAL',
      entityId: 'out-02',
      targetView: 'outbound',
      createdAt: '2026-10-24T17:00:00Z',
      isRead: false,
    },
    {
      id: 'notif-02',
      recipientRole: 'M',
      title: 'Sự cố máy móc cần xử lý',
      message: 'Sự cố INC-2026-031 trên máy ép M-PELLET-02 đã được phân công cho Vũ Tiến Dũng',
      entityType: 'MACHINE_FAILURE',
      entityId: 'inc-01',
      targetView: 'maintenance',
      createdAt: '2026-10-24T09:50:00Z',
      isRead: true,
    },
    {
      id: 'notif-03',
      recipientRole: 'QC',
      title: 'Yêu cầu kiểm tra QC ca 2',
      message: 'LOT-20261024-02 đã xong kiểm tra lần 1, cần tiếp tục thực hiện lần 2 và 3',
      entityType: 'LOT',
      entityId: 'lot-02',
      targetView: 'qc',
      createdAt: '2026-10-24T18:30:00Z',
      isRead: false,
    },
    {
      id: 'notif-04',
      recipientRole: 'WS',
      title: 'NVL đã duyệt chờ nhập kho',
      message: 'Phiếu thu mua PO-2026-002 (17.850 kg Dăm bào) đã được Owner phê duyệt, sẵn sàng tiếp nhận',
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
    stockMovements,
    auditLogs,
    notifications,
    rawInventoryBalanceKg: 19750 + 24750, // 44,500 kg
    finishedInventoryBalanceKg: 10000,     // 10,000 kg
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
        if (parsed.users && parsed.purchases && parsed.lots) {
          return parsed;
        }
      }
    } catch {
      // Local storage unreadable or corrupt, initialize clean seed
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
      // Fallback in-memory
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
    rawMaterialType: string;
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
      rawMaterialType: params.rawMaterialType,
      plannedQuantityKg: params.plannedQuantityKg,
      plannedDate: params.plannedDate,
      assignedStaffId: staff.id,
      assignedStaffName: staff.fullName,
      createdById: params.creator.id,
      createdByName: params.creator.fullName,
      createdAt: new Date().toISOString(),
      status: 'ASSIGNED',
      notes: params.notes,
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
      details: `Phân công ${staff.fullName} thu mua ${params.plannedQuantityKg.toLocaleString('vi-VN')} kg ${params.rawMaterialType} từ ${supplier.name}`,
    });

    this.addNotification({
      recipientUserId: staff.id,
      recipientRole: 'PS',
      title: 'Phân công thu mua mới',
      message: `Bạn được phân công thu mua ${params.plannedQuantityKg.toLocaleString('vi-VN')} kg ${params.rawMaterialType} (${code})`,
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
    purchasingNotes?: string;
    user: User;
  }): { success: boolean; error?: string } {
    const p = this.data.purchases.find((x) => x.id === params.assignmentId);
    if (!p) return { success: false, error: 'Không tìm thấy hồ sơ thu mua' };
    if (p.status !== 'ASSIGNED' && p.status !== 'RETURNED') {
      return { success: false, error: 'Hồ sơ không ở trạng thái cho phép ghi kết quả' };
    }
    if (params.weighedQuantityKg <= 0) {
      return { success: false, error: 'Khối lượng cân thực tế phải lớn hơn 0' };
    }
    if (params.unitPriceVnd <= 0) {
      return { success: false, error: 'Đơn giá phải lớn hơn 0' };
    }

    const previousState = p.status;
    p.weighedQuantityKg = params.weighedQuantityKg;
    p.unitPriceVnd = params.unitPriceVnd;
    p.totalAmountVnd = params.weighedQuantityKg * params.unitPriceVnd;
    p.weighedAt = new Date().toISOString();
    p.submittedAt = new Date().toISOString();
    p.scaleTicketImageUrl = params.scaleTicketImageUrl || p.scaleTicketImageUrl;
    p.invoiceImageUrl = params.invoiceImageUrl || p.invoiceImageUrl;
    p.purchasingNotes = params.purchasingNotes;
    p.status = 'SUBMITTED';

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: previousState === 'RETURNED' ? 'Cập nhật lại kết quả thu mua (sau khi trả lại)' : 'Ghi kết quả thu mua',
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
      message: `${p.code} (${p.supplierName}) đã ghi nhận cân thực tế ${params.weighedQuantityKg.toLocaleString('vi-VN')} kg`,
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
        details: 'Phê duyệt chuyển bước tiếp nhận kho vật lý',
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

  public receiveRawMaterialIntoWarehouse(params: {
    assignmentId: string;
    receivedQuantityKg: number;
    warehouseNotes?: string;
    discrepancyReason?: string;
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

    // Check significant discrepancy (> 5% difference compared to weighed quantity)
    const weighed = p.weighedQuantityKg || p.plannedQuantityKg;
    const diffPercent = Math.abs(params.receivedQuantityKg - weighed) / weighed;
    if (diffPercent > 0.05 && (!params.discrepancyReason || !params.discrepancyReason.trim())) {
      return {
        success: false,
        error: `Chênh lệch khối lượng ${((params.receivedQuantityKg - weighed) / 1000).toFixed(2)} tấn (> 5%). Bắt buộc nhập nguyên nhân chênh lệch.`,
      };
    }

    // Atomic stock movement
    p.receivedQuantityKg = params.receivedQuantityKg;
    p.receivedAt = new Date().toISOString();
    p.receivedById = params.user.id;
    p.receivedByName = params.user.fullName;
    p.warehouseNotes = params.warehouseNotes;
    p.discrepancyReason = params.discrepancyReason;
    p.status = 'RECEIVED';

    this.data.rawInventoryBalanceKg += params.receivedQuantityKg;

    const sm: StockMovement = {
      id: `sm-${Date.now()}`,
      timestamp: new Date().toISOString(),
      materialCategory: 'RAW_MATERIAL',
      materialName: p.rawMaterialType,
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
      action: 'Xác nhận nhập kho NVL vật lý',
      entityType: 'PURCHASE_ASSIGNMENT',
      entityId: p.id,
      entityCode: p.code,
      previousState: 'APPROVED',
      newState: 'RECEIVED',
      details: `Kế hoạch: ${p.plannedQuantityKg.toLocaleString('vi-VN')} kg | Cân mua: ${weighed.toLocaleString('vi-VN')} kg | Thực nhập kho: ${params.receivedQuantityKg.toLocaleString('vi-VN')} kg`,
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  // ==========================================
  // WF-02 PRODUCTION PLANNING
  // ==========================================
  public createProductionPlan(params: {
    productionDate: string;
    shift: 'CA_1' | 'CA_2' | 'CA_3';
    productName: string;
    targetQuantityKg: number;
    assignments: {
      stage: any;
      machineId: string;
      operatorId: string;
      targetQuantityKg: number;
      notes?: string;
    }[];
    notes?: string;
    creator: User;
  }): { success: boolean; error?: string; plan?: ProductionPlan } {
    if (params.targetQuantityKg <= 0) {
      return { success: false, error: 'Sản lượng mục tiêu phải lớn hơn 0' };
    }
    if (!params.assignments || params.assignments.length === 0) {
      return { success: false, error: 'Phải cấu hình ít nhất một công đoạn sản xuất' };
    }

    const nextNum = this.data.productionPlans.length + 42;
    const code = `PLAN-2026-${String(nextNum).padStart(3, '0')}`;
    const id = `plan-${Date.now()}`;

    const formattedAssignments = params.assignments.map((a, idx) => {
      const machine = this.data.machines.find((m) => m.id === a.machineId);
      const operator = this.data.users.find((u) => u.id === a.operatorId);
      return {
        id: `tsk-${id}-${idx}`,
        stage: a.stage,
        machineId: a.machineId,
        machineName: machine ? machine.name : 'Máy sản xuất',
        operatorId: a.operatorId,
        operatorName: operator ? operator.fullName : 'Công nhân',
        targetQuantityKg: a.targetQuantityKg,
        notes: a.notes,
      };
    });

    const plan: ProductionPlan = {
      id,
      code,
      productionDate: params.productionDate,
      shift: params.shift,
      productName: params.productName,
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

    // Notify operators
    const operatorIds = new Set(formattedAssignments.map((a) => a.operatorId));
    operatorIds.forEach((opId) => {
      this.addNotification({
        recipientUserId: opId,
        recipientRole: 'S',
        title: 'Phân công kế hoạch sản xuất mới',
        message: `Bạn được phân công trong ${code} (${params.productName})`,
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
    rawMaterialType: string;
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
        error: `Không đủ tồn kho khả dụng. Tồn hiện tại: ${this.data.rawInventoryBalanceKg.toLocaleString('vi-VN')} kg, Yêu cầu cấp: ${params.issuedQuantityKg.toLocaleString('vi-VN')} kg`,
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
      rawMaterialType: params.rawMaterialType,
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
      materialName: params.rawMaterialType,
      movementType: 'OUT',
      quantityKg: params.issuedQuantityKg,
      referenceDocumentType: 'RAW_MATERIAL_ISSUE',
      referenceDocumentCode: code,
      confirmedById: params.user.id,
      confirmedByName: params.user.fullName,
      balanceAfterKg: this.data.rawInventoryBalanceKg,
      notes: `Cấp NVL cho kế hoạch ${plan.code} (${params.recipientDepartment})`,
    };
    this.data.stockMovements.unshift(sm);

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: 'Xác nhận cấp phát NVL',
      entityType: 'RAW_MATERIAL_ISSUE',
      entityId: id,
      entityCode: code,
      details: `Xuất kho ${params.issuedQuantityKg.toLocaleString('vi-VN')} kg ${params.rawMaterialType} cho ${plan.code}`,
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

    if (params.actualOutputKg <= 0) {
      return { success: false, error: 'Sản lượng thực tế phải lớn hơn 0 kg' };
    }
    if (params.actualMaterialUsedKg <= 0) {
      return { success: false, error: 'NVL thực dùng phải lớn hơn 0 kg' };
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
      action: 'Gửi báo cáo ca sản xuất',
      entityType: 'SHIFT_REPORT',
      entityId: id,
      entityCode: code,
      newState: 'SUBMITTED',
      details: `${code}: NVL dùng ${params.actualMaterialUsedKg.toLocaleString('vi-VN')} kg, Sản lượng ${params.actualOutputKg.toLocaleString('vi-VN')} kg`,
    });

    this.addNotification({
      recipientRole: 'M',
      title: 'Báo cáo ca chờ duyệt',
      message: `${params.user.fullName} đã gửi ${code} (${params.actualOutputKg.toLocaleString('vi-VN')} kg viên nén)`,
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

      // Automatically generate a new LOT in PENDING QC status
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
        productName: 'Viên nén gỗ Tràm xuất khẩu ENplus-A1',
        quantityKg: report.actualOutputKg,
        jumboBagsCount: Math.ceil(report.actualOutputKg / 1000),
        qcStatus: 'PENDING',
        tests: [],
        reDryCount: 0,
        isReceivedInWarehouse: false,
        availableQuantityKg: report.actualOutputKg,
        createdAt: new Date().toISOString(),
      };
      this.data.lots.unshift(newLot);

      this.addAuditLog({
        actorId: params.user.id,
        actorName: params.user.fullName,
        actorRole: params.user.role,
        action: 'Phê duyệt báo cáo ca sản xuất',
        entityType: 'SHIFT_REPORT',
        entityId: report.id,
        entityCode: report.code,
        previousState: 'SUBMITTED',
        newState: 'APPROVED',
        details: `Duyệt báo cáo ${report.code}. Đã tạo lô hàng ${lotCode} chờ 3 lần kiểm tra QC`,
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
        action: 'Trả lại báo cáo ca',
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
        action: 'Từ chối báo cáo ca',
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
  // WF-05 QUALITY CONTROL (3 INDEPENDENT TESTS)
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
      return { success: false, error: 'LOT này đã hoàn thành đủ 3 lần kiểm tra QC độc lập' };
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
      // 3 independent tests completed! Calculate overall grade
      const avgMoisture = lot.tests.reduce((acc, t) => acc + t.moisturePercent, 0) / 3;
      const avgAsh = lot.tests.reduce((acc, t) => acc + t.ashPercent, 0) / 3;

      if (avgMoisture > 12.0) {
        lot.qcStatus = 'RE_DRY_REQUIRED';
        lot.reDryCount += 1;
        this.addNotification({
          recipientRole: 'M',
          title: 'LOT cần sấy lại (Độ ẩm cao)',
          message: `${lot.lotCode} có độ ẩm trung bình ${avgMoisture.toFixed(1)}% vượt ngưỡng cho phép (> 12%)`,
          entityType: 'LOT',
          entityId: lot.id,
          targetView: 'qc',
        });
      } else {
        lot.qcStatus = 'QC_PASSED';
        // Grade A: Ash < 0.8% and Moisture <= 10%
        // Grade B: Ash < 1.5% and Moisture <= 10%
        lot.grade = avgAsh <= 0.8 ? 'GRADE_A' : 'GRADE_B';

        this.addNotification({
          recipientRole: 'WS',
          title: 'LOT đạt chuẩn KCS chờ nhập kho thành phẩm',
          message: `${lot.lotCode} (${lot.quantityKg.toLocaleString('vi-VN')} kg - ${lot.grade}) đã qua 3 lần QC`,
          entityType: 'LOT',
          entityId: lot.id,
          targetView: 'finished-goods',
        });
      }
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
      details: `Lần ${testNum}/3: Độ ẩm ${params.moisturePercent}%, Độ tro ${params.ashPercent}%, Tạp chất ${params.impuritiesPercent}%`,
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  // ==========================================
  // WF-06 FINISHED GOODS INVENTORY RECEIPT
  // ==========================================
  public receiveFinishedGoods(params: { lotId: string; user: User }): { success: boolean; error?: string } {
    const lot = this.data.lots.find((l) => l.id === params.lotId);
    if (!lot) return { success: false, error: 'Không tìm thấy LOT' };
    if (lot.qcStatus !== 'QC_PASSED') {
      return { success: false, error: 'Chỉ nhận vào kho thành phẩm các LOT đã đạt 3 lần QC (QC_PASSED)' };
    }
    if (lot.isReceivedInWarehouse) {
      return { success: false, error: 'LOT này đã được nhận vào kho thành phẩm trước đó' };
    }

    lot.isReceivedInWarehouse = true;
    lot.receivedAt = new Date().toISOString();
    lot.receivedById = params.user.id;
    lot.receivedByName = params.user.fullName;

    this.data.finishedInventoryBalanceKg += lot.quantityKg;

    const sm: StockMovement = {
      id: `sm-${Date.now()}`,
      timestamp: new Date().toISOString(),
      materialCategory: 'FINISHED_GOODS',
      materialName: lot.productName,
      movementType: 'IN',
      quantityKg: lot.quantityKg,
      referenceDocumentType: 'FINISHED_GOODS_RECEIPT',
      referenceDocumentCode: lot.lotCode,
      lotCode: lot.lotCode,
      confirmedById: params.user.id,
      confirmedByName: params.user.fullName,
      balanceAfterKg: this.data.finishedInventoryBalanceKg,
      notes: `Thủ kho nhận nhập ${lot.jumboBagsCount} bao Jumbo (${lot.grade}) vào kho thành phẩm`,
    };
    this.data.stockMovements.unshift(sm);

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: 'Xác nhận nhập kho thành phẩm vật lý',
      entityType: 'LOT',
      entityId: lot.id,
      entityCode: lot.lotCode,
      details: `Nhập kho ${lot.quantityKg.toLocaleString('vi-VN')} kg (${lot.grade}), tăng tồn kho thành phẩm`,
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  // ==========================================
  // WF-07 OUTBOUND PROPOSAL (FLOW A & FLOW B)
  // ==========================================
  public createOutboundProposal(params: {
    flow: 'FLOW_A' | 'FLOW_B';
    customerId: string;
    productName: string;
    lotId: string;
    requestedQuantityKg: number;
    unitPriceVnd?: number;
    notes?: string;
    user: User;
  }): { success: boolean; error?: string } {
    const customer = this.data.customers.find((c) => c.id === params.customerId);
    if (!customer) return { success: false, error: 'Khách hàng không hợp lệ' };
    const lot = this.data.lots.find((l) => l.id === params.lotId);
    if (!lot) return { success: false, error: 'Không tìm thấy LOT' };

    if (!lot.isReceivedInWarehouse) {
      return { success: false, error: 'Chỉ được tạo đề xuất xuất hàng từ LOT đã nhập kho thành phẩm' };
    }
    if (params.requestedQuantityKg <= 0) {
      return { success: false, error: 'Khối lượng yêu cầu xuất phải lớn hơn 0' };
    }
    if (params.requestedQuantityKg > lot.availableQuantityKg) {
      return {
        success: false,
        error: `Khối lượng vượt tồn khả dụng của lô ${lot.lotCode}. Khả dụng: ${lot.availableQuantityKg.toLocaleString('vi-VN')} kg`,
      };
    }

    const nextNum = this.data.outboundProposals.length + 15;
    const code = `OUT-PROP-2026-${String(nextNum).padStart(3, '0')}`;
    const id = `out-${Date.now()}`;

    // In Flow A: starts at PENDING_MANAGER_REVIEW
    // In Flow B: starts at PENDING_OWNER_APPROVAL
    const initialStatus = params.flow === 'FLOW_A' ? 'PENDING_MANAGER_REVIEW' : 'PENDING_OWNER_APPROVAL';

    const proposal: OutboundProposal = {
      id,
      code,
      flow: params.flow,
      customerId: customer.id,
      customerName: customer.name,
      productName: params.productName,
      lotId: lot.id,
      lotCode: lot.lotCode,
      grade: lot.grade || 'GRADE_A',
      requestedQuantityKg: params.requestedQuantityKg,
      unitPriceVnd: params.unitPriceVnd,
      totalValueVnd: params.unitPriceVnd ? params.unitPriceVnd * params.requestedQuantityKg : undefined,
      status: initialStatus,
      notes: params.notes,
      createdById: params.user.id,
      createdByName: params.user.fullName,
      createdAt: new Date().toISOString(),
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
      details: `${code} (${params.flow}): Xuất ${params.requestedQuantityKg.toLocaleString('vi-VN')} kg từ ${lot.lotCode} cho ${customer.name}`,
    });

    if (params.flow === 'FLOW_A') {
      this.addNotification({
        recipientRole: 'M',
        title: 'Đề xuất xuất hàng chờ quản lý xem xét',
        message: `${params.user.fullName} đã tạo ${code} (${customer.name})`,
        entityType: 'OUTBOUND_PROPOSAL',
        entityId: id,
        targetView: 'outbound',
      });
    } else {
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

  public managerReviewOutboundProposal(params: {
    proposalId: string;
    action: 'FORWARD_TO_OWNER' | 'RETURN';
    returnReason?: string;
    user: User;
  }): { success: boolean; error?: string } {
    const prop = this.data.outboundProposals.find((p) => p.id === params.proposalId);
    if (!prop) return { success: false, error: 'Không tìm thấy đề xuất' };
    if (prop.status !== 'PENDING_MANAGER_REVIEW') {
      return { success: false, error: 'Đề xuất không ở trạng thái chờ Manager xem xét' };
    }

    prop.managerReviewedById = params.user.id;
    prop.managerReviewedByName = params.user.fullName;
    prop.managerReviewedAt = new Date().toISOString();

    if (params.action === 'FORWARD_TO_OWNER') {
      prop.status = 'PENDING_OWNER_APPROVAL';
      this.addAuditLog({
        actorId: params.user.id,
        actorName: params.user.fullName,
        actorRole: params.user.role,
        action: 'Quản lý xem xét và chuyển Owner quyết định',
        entityType: 'OUTBOUND_PROPOSAL',
        entityId: prop.id,
        entityCode: prop.code,
        previousState: 'PENDING_MANAGER_REVIEW',
        newState: 'PENDING_OWNER_APPROVAL',
      });

      this.addNotification({
        recipientRole: 'O',
        title: 'Đề xuất xuất hàng trình duyệt',
        message: `${prop.code} đã được Manager kiểm tra và chuyển cho Owner duyệt`,
        entityType: 'OUTBOUND_PROPOSAL',
        entityId: prop.id,
        targetView: 'outbound',
      });
    } else {
      if (!params.returnReason || !params.returnReason.trim()) {
        return { success: false, error: 'Bắt buộc nhập lý do trả lại' };
      }
      prop.status = 'RETURNED';
      prop.returnReason = params.returnReason;
      this.addAuditLog({
        actorId: params.user.id,
        actorName: params.user.fullName,
        actorRole: params.user.role,
        action: 'Quản lý trả lại đề xuất',
        entityType: 'OUTBOUND_PROPOSAL',
        entityId: prop.id,
        entityCode: prop.code,
        previousState: 'PENDING_MANAGER_REVIEW',
        newState: 'RETURNED',
        reason: params.returnReason,
      });
    }

    this.persist({ ...this.data });
    return { success: true };
  }

  public ownerDecideOutboundProposal(params: {
    proposalId: string;
    decision: 'APPROVE' | 'RETURN' | 'REJECT';
    reason?: string;
    newCustomerId?: string;
    adjustedPriceVnd?: number;
    user: User;
  }): { success: boolean; error?: string } {
    const prop = this.data.outboundProposals.find((p) => p.id === params.proposalId);
    if (!prop) return { success: false, error: 'Không tìm thấy đề xuất' };
    if (prop.status !== 'PENDING_OWNER_APPROVAL') {
      return { success: false, error: 'Đề xuất không ở trạng thái chờ Owner quyết định' };
    }

    // Owner exclusive: Change customer while preserving original in history
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

    // Owner sets or adjusts selling price
    if (params.adjustedPriceVnd && params.adjustedPriceVnd > 0) {
      prop.unitPriceVnd = params.adjustedPriceVnd;
      prop.totalValueVnd = params.adjustedPriceVnd * prop.requestedQuantityKg;
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
        action: 'Owner phê duyệt xuất hàng cuối cùng',
        entityType: 'OUTBOUND_PROPOSAL',
        entityId: prop.id,
        entityCode: prop.code,
        previousState: 'PENDING_OWNER_APPROVAL',
        newState: 'APPROVED',
        details: `Duyệt xuất ${prop.requestedQuantityKg.toLocaleString('vi-VN')} kg cho ${prop.customerName}`,
      });

      this.addNotification({
        recipientRole: 'M',
        title: 'Đề xuất xuất hàng đã được Owner duyệt',
        message: `${prop.code} đã được duyệt. Vui lòng ghi nhận thông tin xe nhận hàng`,
        entityType: 'OUTBOUND_PROPOSAL',
        entityId: prop.id,
        targetView: 'outbound',
      });
    } else if (params.decision === 'RETURN') {
      if (!params.reason || !params.reason.trim()) {
        return { success: false, error: 'Bắt buộc nhập lý do khi Trả lại đề xuất' };
      }
      prop.status = 'RETURNED';
      prop.returnReason = params.reason;
      this.addAuditLog({
        actorId: params.user.id,
        actorName: params.user.fullName,
        actorRole: params.user.role,
        action: 'Owner trả lại đề xuất',
        entityType: 'OUTBOUND_PROPOSAL',
        entityId: prop.id,
        entityCode: prop.code,
        previousState: 'PENDING_OWNER_APPROVAL',
        newState: 'RETURNED',
        reason: params.reason,
      });
    } else {
      if (!params.reason || !params.reason.trim()) {
        return { success: false, error: 'Bắt buộc nhập lý do khi Từ chối đề xuất' };
      }
      prop.status = 'REJECTED';
      prop.rejectionReason = params.reason;
      this.addAuditLog({
        actorId: params.user.id,
        actorName: params.user.fullName,
        actorRole: params.user.role,
        action: 'Owner từ chối đề xuất',
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

  // ==========================================
  // WF-08 OUTBOUND QC
  // ==========================================
  public recordOutboundQc(params: {
    proposalId: string;
    moisturePercent: number;
    ashPercent: number;
    impuritiesPercent: number;
    user: User;
  }): { success: boolean; error?: string } {
    const prop = this.data.outboundProposals.find((p) => p.id === params.proposalId);
    if (!prop) return { success: false, error: 'Không tìm thấy đề xuất' };
    const lot = this.data.lots.find((l) => l.id === prop.lotId);

    prop.outboundQcTested = true;
    prop.outboundQcMoisture = params.moisturePercent;
    prop.outboundQcAsh = params.ashPercent;
    prop.outboundQcImpurities = params.impuritiesPercent;
    prop.outboundQcTestedById = params.user.id;
    prop.outboundQcTestedByName = params.user.fullName;
    prop.outboundQcTestedAt = new Date().toISOString();

    // Check mismatch with LOT shift QC (if moisture shifted > 1.5% or ash shifted > 0.3%)
    if (lot && lot.tests.length > 0) {
      const avgLotMoisture = lot.tests.reduce((acc, t) => acc + t.moisturePercent, 0) / lot.tests.length;
      if (Math.abs(params.moisturePercent - avgLotMoisture) > 1.5) {
        prop.outboundQcMismatchDetected = true;
        this.addNotification({
          recipientRole: 'O',
          title: 'Cảnh báo sai khác QC xuất hàng',
          message: `${prop.code}: Độ ẩm xuất hàng (${params.moisturePercent}%) lệch so với QC ca (${avgLotMoisture.toFixed(1)}%). Chờ Owner quyết định`,
          entityType: 'OUTBOUND_PROPOSAL',
          entityId: prop.id,
          targetView: 'outbound',
        });
      }
    }

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: 'Ghi nhận QC kiểm tra xuất hàng',
      entityType: 'OUTBOUND_PROPOSAL',
      entityId: prop.id,
      entityCode: prop.code,
      details: `Độ ẩm: ${params.moisturePercent}%, Độ tro: ${params.ashPercent}%, Tạp chất: ${params.impuritiesPercent}%`,
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  public ownerDecideOutboundQcMismatch(params: {
    proposalId: string;
    decision: 'APPROVED_DISPATCH' | 'REQUIRE_RETEST' | 'REJECTED_DISPATCH';
    notes?: string;
    user: User;
  }): { success: boolean; error?: string } {
    const prop = this.data.outboundProposals.find((p) => p.id === params.proposalId);
    if (!prop) return { success: false, error: 'Không tìm thấy đề xuất' };

    prop.ownerMismatchDecision = params.decision;
    prop.ownerMismatchDecisionNotes = params.notes;

    if (params.decision === 'REJECTED_DISPATCH') {
      prop.status = 'REJECTED';
      prop.rejectionReason = `Owner từ chối xuất hàng do sai lệch chất lượng QC: ${params.notes || ''}`;
    }

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: 'Owner xử lý sai khác QC xuất hàng',
      entityType: 'OUTBOUND_PROPOSAL',
      entityId: prop.id,
      entityCode: prop.code,
      details: `Quyết định: ${params.decision}. Ghi chú: ${params.notes || 'Không'}`,
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  // ==========================================
  // WF-09 PICKUP & DISPATCH (FIFO)
  // ==========================================
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
      return { success: false, error: 'Chỉ ghi nhận thông tin nhận hàng cho đề xuất đã được Owner phê duyệt' };
    }

    prop.recipientName = params.recipientName;
    prop.recipientPhone = params.recipientPhone;
    prop.truckLicensePlate = params.truckLicensePlate;
    prop.pickupTimeScheduled = params.pickupTimeScheduled;
    prop.recipientRecordedById = params.user.id;
    prop.recipientRecordedByName = params.user.fullName;
    prop.recipientRecordedAt = new Date().toISOString();

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: 'Ghi nhận thông tin người nhận hàng và xe vận chuyển',
      entityType: 'OUTBOUND_PROPOSAL',
      entityId: prop.id,
      entityCode: prop.code,
      details: `Tài xế: ${params.recipientName} (${params.recipientPhone}), Biển số xe: ${params.truckLicensePlate}`,
    });

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
    dispatchEvidenceImageUrl?: string;
    truckPlateVerified: string;
    user: User;
  }): { success: boolean; error?: string } {
    const prop = this.data.outboundProposals.find((p) => p.id === params.proposalId);
    if (!prop) return { success: false, error: 'Không tìm thấy đề xuất' };
    if (prop.status !== 'APPROVED') {
      return { success: false, error: 'Chỉ xuất kho cho đề xuất đã được phê duyệt' };
    }
    if (prop.isDispatched) {
      return { success: false, error: 'Đề xuất này đã được xuất kho trước đó' };
    }

    // Check recipient credential match
    if (
      prop.truckLicensePlate &&
      params.truckPlateVerified.trim().toUpperCase() !== prop.truckLicensePlate.trim().toUpperCase()
    ) {
      prop.dispatchMismatchFlag = true;
      this.addNotification({
        recipientRole: 'M',
        title: 'Cảnh báo sai lệch biển số xe nhận hàng',
        message: `${prop.code}: Xe thực tế đến (${params.truckPlateVerified}) không khớp biển số đăng ký (${prop.truckLicensePlate})`,
        entityType: 'OUTBOUND_PROPOSAL',
        entityId: prop.id,
        targetView: 'outbound',
      });
      this.persist({ ...this.data });
      return {
        success: false,
        error: `Biển số xe thực tế (${params.truckPlateVerified}) không khớp với hồ sơ đăng ký (${prop.truckLicensePlate}). Không được phép xuất kho. Đã chuyển cảnh báo cho Quản lý.`,
      };
    }

    const lot = this.data.lots.find((l) => l.id === prop.lotId);
    if (!lot) return { success: false, error: 'Không tìm thấy LOT xuất kho' };

    if (params.actualDispatchedKg <= 0) {
      return { success: false, error: 'Khối lượng thực xuất phải lớn hơn 0' };
    }
    if (params.actualDispatchedKg > lot.availableQuantityKg) {
      return {
        success: false,
        error: `Khối lượng thực xuất vượt quá tồn khả dụng của lô ${lot.lotCode}. Khả dụng: ${lot.availableQuantityKg.toLocaleString('vi-VN')} kg`,
      };
    }

    // Atomic execution
    lot.availableQuantityKg -= params.actualDispatchedKg;
    this.data.finishedInventoryBalanceKg -= params.actualDispatchedKg;

    prop.isDispatched = true;
    prop.status = 'DISPATCHED';
    prop.actualDispatchedKg = params.actualDispatchedKg;
    prop.dispatchedAt = new Date().toISOString();
    prop.dispatchedById = params.user.id;
    prop.dispatchedByName = params.user.fullName;
    prop.dispatchEvidenceImageUrl = params.dispatchEvidenceImageUrl;

    const sm: StockMovement = {
      id: `sm-${Date.now()}`,
      timestamp: new Date().toISOString(),
      materialCategory: 'FINISHED_GOODS',
      materialName: prop.productName,
      movementType: 'OUT',
      quantityKg: params.actualDispatchedKg,
      referenceDocumentType: 'CUSTOMER_DISPATCH',
      referenceDocumentCode: prop.code,
      lotCode: lot.lotCode,
      confirmedById: params.user.id,
      confirmedByName: params.user.fullName,
      balanceAfterKg: this.data.finishedInventoryBalanceKg,
      notes: `Xuất kho giao cho ${prop.customerName} (Xe ${params.truckPlateVerified})`,
    };
    this.data.stockMovements.unshift(sm);

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: 'Xác nhận xuất kho bàn giao hàng thực tế',
      entityType: 'OUTBOUND_PROPOSAL',
      entityId: prop.id,
      entityCode: prop.code,
      previousState: 'APPROVED',
      newState: 'DISPATCHED',
      details: `Đã bàn giao ${params.actualDispatchedKg.toLocaleString('vi-VN')} kg từ ${lot.lotCode} cho xe ${params.truckPlateVerified}`,
    });

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
      action: 'Báo cáo sự cố máy móc',
      entityType: 'MACHINE_FAILURE',
      entityId: id,
      entityCode: code,
      newState: 'REPORTED',
      details: `${code}: ${machine.name} - Mức độ: ${params.severity} - Hiện tượng: ${params.symptoms}`,
    });

    this.addNotification({
      recipientRole: 'M',
      title: 'Sự cố máy móc mới',
      message: `${code}: ${machine.name} gặp sự cố mức độ ${params.severity}`,
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
      if (!params.rejectionReason || !params.rejectionReason.trim()) {
        return { success: false, error: 'Bắt buộc nhập lý do từ chối' };
      }
      fail.status = 'REJECTED';
      fail.rejectionReason = params.rejectionReason;
      const machine = this.data.machines.find((m) => m.id === fail.machineId);
      if (machine) machine.status = 'OPERATIONAL';

      this.addAuditLog({
        actorId: params.user.id,
        actorName: params.user.fullName,
        actorRole: params.user.role,
        action: 'Từ chối yêu cầu bảo trì',
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

    // In a single action: tiếp nhận và phân công
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
      action: 'Tiếp nhận và phân công bảo trì',
      entityType: 'MACHINE_FAILURE',
      entityId: fail.id,
      entityCode: fail.code,
      previousState: 'REPORTED',
      newState: 'ASSIGNED',
      details: `Phân công kỹ thuật viên ${staff.fullName} xử lý ${fail.code}`,
    });

    this.addNotification({
      recipientUserId: staff.id,
      recipientRole: 'MS',
      title: 'Công việc sửa chữa mới',
      message: `Bạn được phân công sửa chữa ${fail.code} (${fail.machineName})`,
      entityType: 'MACHINE_FAILURE',
      entityId: fail.id,
      targetView: 'maintenance',
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  // ==========================================
  // WF-11 & WF-12 MAINTENANCE EXECUTION & MATERIAL REQUESTS
  // ==========================================
  public createMaterialRequest(params: {
    failureReportId: string;
    items: { materialName: string; requestedQuantity: number; unit: string; reason: string }[];
    user: User;
  }): { success: boolean; error?: string } {
    const fail = this.data.failures.find((f) => f.id === params.failureReportId);
    if (!fail) return { success: false, error: 'Không tìm thấy sự cố' };
    if (!params.items || params.items.length === 0) {
      return { success: false, error: 'Phải yêu cầu ít nhất 1 loại vật tư' };
    }

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

    this.data.materialRequests.unshift(req);

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: 'Tạo đề xuất vật tư bảo trì',
      entityType: 'MAINTENANCE_MATERIAL_REQUEST',
      entityId: id,
      entityCode: code,
      details: `${code}: ${params.items.length} hạng mục vật tư cho ${fail.machineName}`,
    });

    this.addNotification({
      recipientRole: 'M',
      title: 'Đề xuất vật tư bảo trì chờ duyệt',
      message: `${params.user.fullName} đề xuất ${params.items.length} loại vật tư cho ${fail.code}`,
      entityType: 'MAINTENANCE_MATERIAL_REQUEST',
      entityId: id,
      targetView: 'maintenance',
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
      this.addAuditLog({
        actorId: params.user.id,
        actorName: params.user.fullName,
        actorRole: params.user.role,
        action: 'Duyệt dòng vật tư bảo trì',
        entityType: 'MAINTENANCE_MATERIAL_ITEM',
        entityId: item.id,
        details: `Duyệt cấp ${item.requestedQuantity} ${item.unit} ${item.materialName}`,
      });
    } else {
      if (!params.rejectionReason || !params.rejectionReason.trim()) {
        return { success: false, error: 'Bắt buộc nhập lý do từ chối cho dòng vật tư này' };
      }
      item.status = 'REJECTED';
      item.rejectionReason = params.rejectionReason;
      this.addAuditLog({
        actorId: params.user.id,
        actorName: params.user.fullName,
        actorRole: params.user.role,
        action: 'Từ chối dòng vật tư bảo trì',
        entityType: 'MAINTENANCE_MATERIAL_ITEM',
        entityId: item.id,
        reason: params.rejectionReason,
        details: `Từ chối cấp ${item.materialName}`,
      });
    }

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

    fail.status = 'UNDER_REPAIR';
    this.data.maintenanceReports.unshift(report);

    this.addAuditLog({
      actorId: params.user.id,
      actorName: params.user.fullName,
      actorRole: params.user.role,
      action: 'Nộp báo cáo hoàn thành sửa chữa',
      entityType: 'MAINTENANCE_REPORT',
      entityId: report.id,
      details: `Kỹ thuật viên ${params.user.fullName} đã sửa xong ${fail.machineName}`,
    });

    this.addNotification({
      recipientRole: 'M',
      title: 'Báo cáo sửa chữa chờ nghiệm thu',
      message: `${params.user.fullName} đã hoàn thành sửa ${fail.machineName}`,
      entityType: 'MAINTENANCE_REPORT',
      entityId: report.id,
      targetView: 'maintenance',
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
        action: 'Nghiệm thu hoàn thành bảo trì',
        entityType: 'MAINTENANCE_REPORT',
        entityId: report.id,
        details: `Xác nhận máy ${report.machineName} đã chạy thử an toàn và trở lại trạng thái OPERATIONAL`,
      });
    } else {
      if (!params.returnReason || !params.returnReason.trim()) {
        return { success: false, error: 'Bắt buộc nhập lý do yêu cầu sửa lại' };
      }
      report.returnReason = params.returnReason;
      this.addAuditLog({
        actorId: params.user.id,
        actorName: params.user.fullName,
        actorRole: params.user.role,
        action: 'Yêu cầu kiểm tra lại kết quả bảo trì',
        entityType: 'MAINTENANCE_REPORT',
        entityId: report.id,
        reason: params.returnReason,
      });
    }

    this.persist({ ...this.data });
    return { success: true };
  }

  // ==========================================
  // WF-13 MACHINE MANAGEMENT
  // ==========================================
  public addMachine(params: Omit<Machine, 'id'>, user: User): { success: boolean; error?: string } {
    const id = `m-${Date.now()}`;
    const machine: Machine = { ...params, id };
    this.data.machines.push(machine);
    this.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: 'Thêm mới thiết bị máy móc',
      entityType: 'MACHINE',
      entityId: id,
      entityCode: machine.code,
      details: `${machine.code} - ${machine.name} (${machine.stage})`,
    });
    this.persist({ ...this.data });
    return { success: true };
  }

  public updateMachineStatus(
    machineId: string,
    status: Machine['status'],
    user: User
  ): { success: boolean; error?: string } {
    const machine = this.data.machines.find((m) => m.id === machineId);
    if (!machine) return { success: false, error: 'Không tìm thấy máy' };
    const prev = machine.status;
    machine.status = status;
    this.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: 'Cập nhật trạng thái máy',
      entityType: 'MACHINE',
      entityId: machine.id,
      entityCode: machine.code,
      previousState: prev,
      newState: status,
    });
    this.persist({ ...this.data });
    return { success: true };
  }

  // ==========================================
  // WF-14 SUPPLIER & CUSTOMER
  // ==========================================
  public addSupplier(params: Omit<Supplier, 'id'>, user: User): { success: boolean; error?: string } {
    const id = `sup-${Date.now()}`;
    const sup: Supplier = { ...params, id };
    this.data.suppliers.push(sup);
    this.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: 'Thêm mới Nhà cung cấp',
      entityType: 'SUPPLIER',
      entityId: id,
      entityCode: sup.code,
      details: `${sup.name} (${sup.contactPerson})`,
    });
    this.persist({ ...this.data });
    return { success: true };
  }

  public addCustomer(params: Omit<Customer, 'id'>, user: User): { success: boolean; error?: string } {
    const id = `cus-${Date.now()}`;
    const cus: Customer = { ...params, id };
    this.data.customers.push(cus);
    this.addAuditLog({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: 'Thêm mới Khách hàng',
      entityType: 'CUSTOMER',
      entityId: id,
      entityCode: cus.code,
      details: `${cus.name} (${cus.contactPerson})`,
    });
    this.persist({ ...this.data });
    return { success: true };
  }

  // ==========================================
  // WF-16 USER & ACCESS MANAGEMENT (ADMIN ONLY)
  // ==========================================
  public createUserAccount(
    params: {
      username: string;
      fullName: string;
      email: string;
      phone: string;
      role: RoleCode;
      avatarUrl?: string;
    },
    adminUser: User
  ): { success: boolean; error?: string } {
    if (adminUser.role !== 'A') {
      return { success: false, error: 'Chỉ Quản trị viên Hệ thống (Admin) mới có quyền tạo tài khoản' };
    }
    if (params.role === 'O') {
      return { success: false, error: 'Chính sách bảo mật: Không được phép tự cấp vai trò Owner qua giao diện Admin' };
    }
    const exists = this.data.users.some((u) => u.username.toLowerCase() === params.username.toLowerCase());
    if (exists) {
      return { success: false, error: 'Tên đăng nhập đã tồn tại trong hệ thống' };
    }

    const id = `u-${params.role.toLowerCase()}-${Date.now()}`;
    const newUser: User = {
      id,
      username: params.username,
      fullName: params.fullName,
      email: params.email,
      phone: params.phone,
      role: params.role,
      isActive: true,
      avatarUrl: params.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      createdAt: new Date().toISOString(),
    };

    this.data.users.push(newUser);
    this.addAuditLog({
      actorId: adminUser.id,
      actorName: adminUser.fullName,
      actorRole: adminUser.role,
      action: 'Tạo tài khoản người dùng mới',
      entityType: 'USER',
      entityId: id,
      details: `Tạo tài khoản ${newUser.username} (${newUser.fullName}) vai trò ${newUser.role}`,
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  public toggleUserLock(userId: string, adminUser: User): { success: boolean; error?: string } {
    if (adminUser.role !== 'A') {
      return { success: false, error: 'Chỉ Quản trị viên Hệ thống (Admin) mới có quyền khóa/mở khóa tài khoản' };
    }
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'Không tìm thấy người dùng' };
    if (user.role === 'O') {
      return { success: false, error: 'Không thể khóa tài khoản Giám đốc (Owner)' };
    }

    user.isActive = !user.isActive;
    this.addAuditLog({
      actorId: adminUser.id,
      actorName: adminUser.fullName,
      actorRole: adminUser.role,
      action: user.isActive ? 'Mở khóa tài khoản' : 'Khóa tài khoản',
      entityType: 'USER',
      entityId: user.id,
      details: `${user.username} (${user.fullName})`,
    });

    this.persist({ ...this.data });
    return { success: true };
  }

  public updateUserProfile(
    userId: string,
    params: { fullName: string; phone: string; email: string; avatarUrl?: string }
  ): { success: boolean; error?: string } {
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
