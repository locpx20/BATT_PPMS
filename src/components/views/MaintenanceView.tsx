import React, { useState } from 'react';
import {
  Wrench,
  AlertTriangle,
  Plus,
  CheckCircle2,
  XCircle,
  FileText,
  Package,
  Layers,
  Clock,
  X,
  Check,
  RotateCcw,
} from 'lucide-react';
import {
  User,
  MachineFailureReport,
  FailureSeverity,
  MaintenanceMaterialRequest,
  MaintenanceReport,
} from '../../types';
import { db } from '../../services/db';
import { Permissions } from '../../services/rbac';
import { StatusBadge } from '../common/StatusBadge';
import { ReasonModal } from '../common/ReasonModal';
import { EvidenceUpload } from '../common/EvidenceUpload';
import { showToast } from '../common/Toast';
import { formatVND, formatNumberVN } from '../../utils/formatters';

interface MaintenanceViewProps {
  currentUser: User;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ currentUser }) => {
  const snapshot = db.getSnapshot();
  const failures = snapshot.failures;
  const machines = snapshot.machines;
  const maintenanceStaffList = snapshot.users.filter((u) => u.role === 'MS');
  const materialRequests = snapshot.materialRequests;
  const maintenanceReports = snapshot.maintenanceReports;

  const [activeTab, setActiveTab] = useState<'FAILURES' | 'MATERIALS' | 'REPORTS'>('FAILURES');

  // Modals
  const [showReportFailureModal, setShowReportFailureModal] = useState(false);
  const [selectedFailure, setSelectedFailure] = useState<MachineFailureReport | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showMaterialRequestModal, setShowMaterialRequestModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Failure Form
  const [failureMachineId, setFailureMachineId] = useState(machines[0]?.id || '');
  const [symptoms, setSymptoms] = useState('');
  const [severity, setSeverity] = useState<FailureSeverity>('HIGH');
  const [failureImageUrl, setFailureImageUrl] = useState<string | undefined>();
  const [failureError, setFailureError] = useState('');

  // Assign Form (Single Step action!)
  const [selectedStaffId, setSelectedStaffId] = useState(maintenanceStaffList[0]?.id || '');

  // Material Request Form (Multi-item)
  const [materialItems, setMaterialItems] = useState<
    { materialName: string; requestedQuantity: number; unit: string; reason: string }[]
  >([{ materialName: '', requestedQuantity: 1, unit: 'Cái', reason: '' }]);
  const [matReqError, setMatReqError] = useState('');

  // Completion Report Form
  const [rootCause, setRootCause] = useState('');
  const [actionsTaken, setActionsTaken] = useState('');
  const [materialsUsedText, setMaterialsUsedText] = useState('');
  const [repairResult, setRepairResult] = useState('');
  const [beforeImageUrl, setBeforeImageUrl] = useState<string | undefined>();
  const [afterImageUrl, setAfterImageUrl] = useState<string | undefined>();
  const [completionError, setCompletionError] = useState('');

  // Actual Purchase Modal State (Sync to Finance)
  const [purchaseModal, setPurchaseModal] = useState<{
    isOpen: boolean;
    requestId: string;
    itemId: string;
    materialName: string;
    suggestedQty: number;
    unit: string;
  }>({
    isOpen: false,
    requestId: '',
    itemId: '',
    materialName: '',
    suggestedQty: 1,
    unit: 'Cái',
  });
  const [actualPurchaseQty, setActualPurchaseQty] = useState(1);
  const [actualUnitPrice, setActualUnitPrice] = useState(500000);
  const [actualSupplier, setActualSupplier] = useState('');
  const [actualInvoiceNum, setActualInvoiceNum] = useState('');
  const [actualInvoiceImg, setActualInvoiceImg] = useState<string | undefined>();

  // Reason modal for rejecting failure or returning completion report
  const [reasonModal, setReasonModal] = useState<{
    isOpen: boolean;
    actionType: 'RETURN' | 'REJECT';
    targetType: 'FAILURE' | 'MATERIAL_ITEM' | 'REPORT';
    requestId?: string;
    itemId?: string;
    reportId?: string;
    entityCode: string;
  }>({
    isOpen: false,
    actionType: 'REJECT',
    targetType: 'FAILURE',
    entityCode: '',
  });

  const handleReportFailure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      setFailureError('Vui lòng mô tả chi tiết hiện tượng sự cố');
      return;
    }

    const res = db.reportMachineFailure({
      machineId: failureMachineId,
      symptoms: symptoms.trim(),
      severity,
      imageUrl: failureImageUrl,
      user: currentUser,
    });

    if (res.success) {
      showToast('warning', 'Báo sự cố thành công', 'Yêu cầu sửa chữa đã được chuyển tới Quản lý');
      setShowReportFailureModal(false);
      setSymptoms('');
    } else {
      setFailureError(res.error || 'Lỗi khi báo sự cố');
    }
  };

  const handleAssignMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFailure) return;

    const res = db.assignMaintenanceStaff({
      failureId: selectedFailure.id,
      maintenanceStaffId: selectedStaffId,
      decision: 'ASSIGN',
      user: currentUser,
    });

    if (res.success) {
      showToast('success', 'Đã tiếp nhận & phân công', `Đã giao sự cố ${selectedFailure.code} cho kỹ thuật viên`);
      setShowAssignModal(false);
    }
  };

  const handleAddItemRow = () => {
    setMaterialItems([...materialItems, { materialName: '', requestedQuantity: 1, unit: 'Cái', reason: '' }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    setMaterialItems(materialItems.filter((_, i) => i !== idx));
  };

  const handleSubmitMaterialRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFailure) return;

    const validItems = materialItems.filter((it) => it.materialName.trim());
    if (validItems.length === 0) {
      setMatReqError('Cần điền ít nhất một tên vật tư hợp lệ');
      return;
    }

    const res = db.createMaterialRequest({
      failureReportId: selectedFailure.id,
      items: validItems,
      user: currentUser,
    });

    if (res.success) {
      showToast('success', 'Gửi yêu cầu thành công', 'Danh sách vật tư bảo trì đã được gửi duyệt theo từng dòng');
      setShowMaterialRequestModal(false);
    } else {
      setMatReqError(res.error || 'Lỗi tạo đề xuất vật tư');
    }
  };

  const handleApproveMaterialItem = (requestId: string, itemId: string) => {
    const res = db.decideMaterialItem({
      requestId,
      itemId,
      decision: 'APPROVE',
      user: currentUser,
    });
    if (res.success) {
      showToast('success', 'Đã duyệt vật tư', 'Dòng vật tư đã được phê duyệt');
    }
  };

  const handleOpenPurchaseModal = (requestId: string, item: any) => {
    setPurchaseModal({
      isOpen: true,
      requestId,
      itemId: item.id,
      materialName: item.materialName,
      suggestedQty: item.requestedQuantity,
      unit: item.unit,
    });
    setActualPurchaseQty(item.requestedQuantity);
    setActualUnitPrice(500000);
    setActualSupplier('Công ty Thiết bị Cơ điện Bình Thuận');
    setActualInvoiceNum('HD-' + Math.floor(10000 + Math.random() * 90000));
    setActualInvoiceImg(undefined);
  };

  const handleConfirmActualPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const res = db.recordActualMaterialPurchase({
      requestId: purchaseModal.requestId,
      itemId: purchaseModal.itemId,
      actualPurchasedQuantity: actualPurchaseQty,
      actualUnitPriceVnd: actualUnitPrice,
      supplierName: actualSupplier,
      invoiceUrl: actualInvoiceImg,
      purchaseNotes: actualInvoiceNum ? `Số HĐ: ${actualInvoiceNum}` : undefined,
      user: currentUser,
    });

    if (res.success) {
      showToast(
        'success',
        'Ghi nhận mua vật tư thành công',
        `Đã tạo chi phí ${formatVND(actualPurchaseQty * actualUnitPrice)} vào Sổ Tài chính`
      );
      setPurchaseModal({
        isOpen: false,
        requestId: '',
        itemId: '',
        materialName: '',
        suggestedQty: 1,
        unit: 'Cái',
      });
    } else {
      showToast('error', 'Lỗi', res.error);
    }
  };

  const handleSubmitCompletionReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFailure) return;

    if (!rootCause.trim() || !actionsTaken.trim()) {
      setCompletionError('Vui lòng điền nguyên nhân và công việc đã thực hiện');
      return;
    }

    const res = db.submitMaintenanceCompletionReport({
      failureReportId: selectedFailure.id,
      rootCause,
      actionsTaken,
      materialsUsedText,
      repairResult,
      beforeImageUrl,
      afterImageUrl,
      user: currentUser,
    });

    if (res.success) {
      showToast('success', 'Nộp báo cáo thành công', 'Báo cáo sửa chữa đã được chuyển tới Quản lý nghiệm thu');
      setShowCompletionModal(false);
    } else {
      setCompletionError(res.error || 'Lỗi lưu báo cáo hoàn thành');
    }
  };

  const handleApproveCompletion = (rep: MaintenanceReport) => {
    const res = db.approveMaintenanceCompletion({
      reportId: rep.id,
      decision: 'APPROVE',
      user: currentUser,
    });
    if (res.success) {
      showToast('success', 'Nghiệm thu thành công', `Thiết bị ${rep.machineName} đã trở lại trạng thái Đang hoạt động`);
    }
  };

  const handleConfirmReason = (reason: string) => {
    if (reasonModal.targetType === 'REPORT' && reasonModal.reportId) {
      const res = db.approveMaintenanceCompletion({
        reportId: reasonModal.reportId,
        decision: 'RETURN',
        returnReason: reason,
        user: currentUser,
      });
      if (res.success) {
        showToast('warning', 'Đã trả lại báo cáo', `Đã trả lại báo cáo cho Kỹ thuật viên khắc phục`);
        setReasonModal({ ...reasonModal, isOpen: false });
      }
    } else if (reasonModal.targetType === 'MATERIAL_ITEM' && reasonModal.requestId && reasonModal.itemId) {
      const res = db.decideMaterialItem({
        requestId: reasonModal.requestId,
        itemId: reasonModal.itemId,
        decision: 'REJECT',
        rejectionReason: reason,
        user: currentUser,
      });
      if (res.success) {
        showToast('error', 'Đã từ chối dòng vật tư', `Lý do: ${reason}`);
        setReasonModal({ ...reasonModal, isOpen: false });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sự cố & Bảo trì Cơ điện</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tiếp nhận sự cố 1 bước, yêu cầu & phê duyệt vật tư theo từng dòng, nghiệm thu an toàn máy
          </p>
        </div>

        {Permissions.canReportMachineFailure(currentUser.role) && (
          <button
            type="button"
            onClick={() => {
              setFailureError('');
              setShowReportFailureModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            Báo sự cố máy
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('FAILURES')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === 'FAILURES'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          1. Sự cố máy móc ({failures.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('MATERIALS')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === 'MATERIALS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          2. Yêu cầu Vật tư bảo trì ({materialRequests.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('REPORTS')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === 'REPORTS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          3. Báo cáo Sửa chữa hoàn thành ({maintenanceReports.length})
        </button>
      </div>

      {/* TAB 1: FAILURES LIST */}
      {activeTab === 'FAILURES' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Mã sự cố</th>
                  <th className="py-3 px-4">Thiết bị</th>
                  <th className="py-3 px-4">Hiện tượng sự cố</th>
                  <th className="py-3 px-4">Mức độ</th>
                  <th className="py-3 px-4">Người báo</th>
                  <th className="py-3 px-4">Kỹ thuật viên</th>
                  <th className="py-3 px-4">Trạng thái bảo trì</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {failures.map((f) => {
                  const canAssign = f.status === 'REPORTED' && Permissions.canAssignMaintenance(currentUser.role);
                  // STRICT RULE: ONLY Maintenance Staff (MS) can submit material requests and completion reports!
                  const isAssignedTech = currentUser.role === 'MS';

                  return (
                    <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{f.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{f.machineName}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate" title={f.symptoms}>
                        {f.symptoms}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            f.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : f.severity === 'HIGH'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {f.severity === 'CRITICAL' ? 'Nghiêm trọng' : f.severity === 'HIGH' ? 'Cao' : 'Trung bình'}
                        </span>
                      </td>
                      <td className="py-3 px-4">{f.reportedByName}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {f.assignedMaintenanceStaffName || <span className="text-slate-400 italic">Chưa giao</span>}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={f.status} size="sm" context="MAINTENANCE" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {canAssign && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedFailure(f);
                                setShowAssignModal(true);
                              }}
                              className="px-2.5 py-1 rounded-md bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 shadow-xs cursor-pointer"
                            >
                              Tiếp nhận & Phân công
                            </button>
                          )}

                          {/* STRICT PERMISSION: Only Maintenance Staff (MS) can submit material requests or completion reports! */}
                          {isAssignedTech && (f.status === 'ASSIGNED' || f.status === 'UNDER_REPAIR' || f.status === 'ENOUGH_MATERIALS' || f.status === 'SUPPLYING' || f.status === 'WAITING_FOR_MATERIALS') && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedFailure(f);
                                  setMaterialItems([
                                    { materialName: '', requestedQuantity: 1, unit: 'Cái', reason: '' },
                                  ]);
                                  setMatReqError('');
                                  setShowMaterialRequestModal(true);
                                }}
                                className="px-2 py-1 rounded bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold text-[11px] cursor-pointer"
                              >
                                + Đề xuất vật tư
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedFailure(f);
                                  setRootCause('');
                                  setActionsTaken('');
                                  setMaterialsUsedText('');
                                  setRepairResult('');
                                  setCompletionError('');
                                  setShowCompletionModal(true);
                                }}
                                className="px-2 py-1 rounded bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold text-[11px] cursor-pointer"
                              >
                                Nộp báo cáo hoàn thành
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MATERIAL REQUESTS (Line-by-line approval!) */}
      {activeTab === 'MATERIALS' && (
        <div className="space-y-4">
          {materialRequests.map((req) => (
            <div key={req.id} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-700">{req.code}</span>
                    <span className="font-semibold text-slate-800">{req.machineName}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kỹ thuật viên đề xuất: {req.maintenanceStaffName} • Ngày gửi:{' '}
                    {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>

              {/* Items Table with distinct Approve/Reject button per line */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Tên vật tư thay thế</th>
                      <th className="py-2 px-3 text-right">Số lượng</th>
                      <th className="py-2 px-3">Đơn vị</th>
                      <th className="py-2 px-3">Lý do kỹ thuật</th>
                      <th className="py-2 px-3">Trạng thái dòng</th>
                      <th className="py-2 px-3 text-center">Quyết định quản lý</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {req.items.map((item) => {
                      const canDecideItem =
                        item.status === 'PENDING' &&
                        Permissions.canDecideMaintenanceMaterialItem(currentUser.role);

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{item.materialName}</td>
                          <td className="py-2.5 px-3 text-right font-bold">{item.requestedQuantity}</td>
                          <td className="py-2.5 px-3">{item.unit}</td>
                          <td className="py-2.5 px-3 text-slate-600 max-w-[200px] truncate">{item.reason}</td>
                          <td className="py-2.5 px-3">
                            <StatusBadge status={item.status} size="sm" />
                            {item.rejectionReason && (
                              <span className="block text-[10px] text-rose-600 mt-0.5">
                                Lý do: {item.rejectionReason}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {canDecideItem ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleApproveMaterialItem(req.id, item.id)}
                                  className="px-2 py-1 rounded bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700 cursor-pointer"
                                >
                                  Duyệt dòng
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReasonModal({
                                      isOpen: true,
                                      actionType: 'REJECT',
                                      targetType: 'MATERIAL_ITEM',
                                      requestId: req.id,
                                      itemId: item.id,
                                      entityCode: item.materialName,
                                    })
                                  }
                                  className="px-2 py-1 rounded bg-rose-600 text-white font-semibold text-[11px] hover:bg-rose-700 cursor-pointer"
                                >
                                  Từ chối dòng
                                </button>
                              </div>
                            ) : item.status === 'APPROVED' ? (
                              item.isPurchased ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  ✓ Đã mua ({item.actualPurchasedQuantity} {item.unit} - {formatVND((item.actualPurchasedQuantity || 0) * (item.actualUnitPriceVnd || 0))})
                                </span>
                              ) : (
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className="text-[11px] text-emerald-700 font-semibold">Đã duyệt</span>
                                  {(currentUser.role === 'MS' || currentUser.role === 'M' || currentUser.role === 'O') && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenPurchaseModal(req.id, item)}
                                      className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[11px] border border-indigo-200 cursor-pointer"
                                    >
                                      Ghi nhận mua
                                    </button>
                                  )}
                                </div>
                              )
                            ) : (
                              <span className="text-slate-400 text-[11px]">
                                {item.decidedByName ? `Bởi ${item.decidedByName}` : '—'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: MAINTENANCE COMPLETION REPORTS */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-4">
          {maintenanceReports.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
              Chưa có báo cáo hoàn thành sửa chữa nào cần nghiệm thu
            </div>
          ) : (
            maintenanceReports.map((rep) => {
              const canReview = Permissions.canApproveMaintenanceReport(currentUser.role) && !rep.isManagerApproved;

              return (
                <div key={rep.id} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{rep.machineName}</h3>
                      <p className="text-xs text-slate-500">
                        Kỹ thuật viên: {rep.maintenanceStaffName} • Ngày nộp:{' '}
                        {new Date(rep.submittedAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div>
                      {rep.isManagerApproved ? (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                          Đã nghiệm thu an toàn
                        </span>
                      ) : rep.returnReason ? (
                        <span className="text-xs font-bold text-orange-700 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                          Bị trả lại: {rep.returnReason}
                        </span>
                      ) : canReview ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleApproveCompletion(rep)}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                          >
                            Nghiệm thu an toàn & Đưa máy hoạt động
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setReasonModal({
                                isOpen: true,
                                actionType: 'RETURN',
                                targetType: 'REPORT',
                                reportId: rep.id,
                                entityCode: rep.machineName,
                              })
                            }
                            className="px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 font-semibold text-xs border border-orange-200 cursor-pointer inline-flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Trả lại yêu cầu làm lại
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-700 font-semibold">Chờ Quản lý nghiệm thu</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Nguyên nhân gốc rễ:</span>
                      <p className="font-semibold text-slate-800">{rep.rootCause}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Công việc đã thực hiện:</span>
                      <p className="font-semibold text-slate-800">{rep.actionsTaken}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Vật tư thay thế thực tế đã dùng:</span>
                      <p className="text-slate-700">{rep.materialsUsedText || 'Không dùng vật tư'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Kết quả chạy thử tải:</span>
                      <p className="font-bold text-emerald-800">{rep.repairResult || 'Chạy êm, thông số đạt'}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* REPORT FAILURE MODAL */}
      {showReportFailureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Báo cáo Sự cố Máy móc</h3>
              <button
                type="button"
                onClick={() => setShowReportFailureModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportFailure} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Máy móc gặp sự cố <span className="text-rose-500">*</span>
                </label>
                <select
                  value={failureMachineId}
                  onChange={(e) => setFailureMachineId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-indigo-500"
                  required
                >
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} - {m.name} ({m.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hiện tượng sự cố chi tiết <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Tiếng kêu lạ, nhiệt độ buồng tăng cao, kẹt trục vít, rung lắc mạnh..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mức độ nghiêm trọng
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as FailureSeverity)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="LOW">Thấp - Vẫn chạy được</option>
                    <option value="MEDIUM">Trung bình - Cần kiểm tra sớm</option>
                    <option value="HIGH">Cao - Dừng máy sửa ngay</option>
                    <option value="CRITICAL">Khẩn cấp - Nguy cơ cháy nổ / Hỏng nặng</option>
                  </select>
                </div>

                <EvidenceUpload
                  label="Ảnh chụp hiện trường"
                  currentImageUrl={failureImageUrl}
                  onImageSelected={setFailureImageUrl}
                />
              </div>

              {failureError && <p className="text-xs text-rose-600 font-medium">{failureError}</p>}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReportFailureModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
                >
                  Gửi báo cáo sự cố
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN MAINTENANCE MODAL (Owner / Manager) */}
      {showAssignModal && selectedFailure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Tiếp nhận & Phân công Bảo trì</h3>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignMaintenance} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p>
                  Sự cố: <strong className="text-slate-900">{selectedFailure.code}</strong> — {selectedFailure.machineName}
                </p>
                <p className="text-slate-600">Hiện tượng: {selectedFailure.symptoms}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1.5">
                  Chọn Kỹ thuật viên Bảo trì <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 bg-white"
                  required
                >
                  {maintenanceStaffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} ({st.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Xác nhận Phân công
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MATERIAL REQUEST MODAL (Maintenance Staff Only) */}
      {showMaterialRequestModal && selectedFailure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Đề xuất Mua Vật tư Sửa chữa</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">Sự cố: {selectedFailure.code} — {selectedFailure.machineName}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMaterialRequestModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitMaterialRequest} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase">Danh mục vật tư thay thế</span>
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  + Thêm dòng vật tư
                </button>
              </div>

              <div className="space-y-3">
                {materialItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Vật tư #{idx + 1}</span>
                      {materialItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold cursor-pointer"
                        >
                          Xóa dòng
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-0.5">
                          Tên vật tư / Quy cách <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.materialName}
                          onChange={(e) => {
                            const updated = [...materialItems];
                            updated[idx].materialName = e.target.value;
                            setMaterialItems(updated);
                          }}
                          placeholder="Ví dụ: Vòng bi SKF 6312, Băng tải chịu nhiệt..."
                          className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-0.5">
                          Số lượng &amp; Đơn vị <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            min="1"
                            value={item.requestedQuantity}
                            onChange={(e) => {
                              const updated = [...materialItems];
                              updated[idx].requestedQuantity = Number(e.target.value);
                              setMaterialItems(updated);
                            }}
                            className="w-16 border border-slate-300 rounded-lg p-2 bg-white font-bold"
                            required
                          />
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => {
                              const updated = [...materialItems];
                              updated[idx].unit = e.target.value;
                              setMaterialItems(updated);
                            }}
                            className="flex-1 border border-slate-300 rounded-lg p-2 bg-white"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-0.5">
                        Lý do kỹ thuật cần thay
                      </label>
                      <input
                        type="text"
                        value={item.reason}
                        onChange={(e) => {
                          const updated = [...materialItems];
                          updated[idx].reason = e.target.value;
                          setMaterialItems(updated);
                        }}
                        placeholder="Vòng bi mòn tạo rung lắc, bạc đạn vỡ..."
                        className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {matReqError && <p className="text-xs text-rose-600 font-medium">{matReqError}</p>}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMaterialRequestModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Gửi đề xuất vật tư
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACTUAL PURCHASE RECORD MODAL */}
      {purchaseModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Ghi nhận Mua Vật tư Thực tế</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vật tư: <strong className="text-slate-800">{purchaseModal.materialName}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPurchaseModal({ ...purchaseModal, isOpen: false })}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmActualPurchase} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Số lượng mua ({purchaseModal.unit}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={actualPurchaseQty}
                    onChange={(e) => setActualPurchaseQty(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2.5 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Đơn giá mua (VNĐ) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1000"
                    value={actualUnitPrice}
                    onChange={(e) => setActualUnitPrice(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2.5 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="font-semibold text-slate-700">Tổng thanh toán:</span>
                <span className="text-base font-bold text-indigo-700">
                  {formatVND(actualPurchaseQty * actualUnitPrice)}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Cửa hàng / Nhà cung cấp</label>
                <input
                  type="text"
                  value={actualSupplier}
                  onChange={(e) => setActualSupplier(e.target.value)}
                  placeholder="Công ty Thiết bị Cơ điện..."
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <EvidenceUpload
                label="Ảnh chụp hóa đơn / Phiếu thu"
                currentImageUrl={actualInvoiceImg}
                onImageSelected={setActualInvoiceImg}
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPurchaseModal({ ...purchaseModal, isOpen: false })}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Lưu &amp; Ghi sổ Chi phí
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETION REPORT MODAL (Maintenance Staff Only) */}
      {showCompletionModal && selectedFailure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Báo cáo Hoàn thành Sửa chữa Máy</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedFailure.code} — {selectedFailure.machineName}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCompletionModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCompletionReport} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Nguyên nhân gốc rễ <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="Do mòn cơ khí, thiếu mỡ bôi trơn, kẹt dăm gỗ..."
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Công việc bảo dưỡng / Sửa chữa đã thực hiện <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={actionsTaken}
                  onChange={(e) => setActionsTaken(e.target.value)}
                  placeholder="Đã tháo puly, thay vòng bi mới, bơm mỡ chịu nhiệt, siết bu lông chân máy..."
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Vật tư thực tế đã sử dụng
                </label>
                <input
                  type="text"
                  value={materialsUsedText}
                  onChange={(e) => setMaterialsUsedText(e.target.value)}
                  placeholder="Ví dụ: 1 vòng bi SKF 6312, 1kg mỡ chịu nhiệt..."
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Kết quả chạy thử tải &amp; Thông số kỹ thuật
                </label>
                <input
                  type="text"
                  value={repairResult}
                  onChange={(e) => setRepairResult(e.target.value)}
                  placeholder="Chạy không tải 30 phút đạt yêu cầu, chạy có tải êm, nhiệt độ buồng 85 độ C"
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <EvidenceUpload
                  label="Ảnh máy trước sửa"
                  currentImageUrl={beforeImageUrl}
                  onImageSelected={setBeforeImageUrl}
                />
                <EvidenceUpload
                  label="Ảnh máy sau sửa"
                  currentImageUrl={afterImageUrl}
                  onImageSelected={setAfterImageUrl}
                />
              </div>

              {completionError && <p className="text-xs text-rose-600 font-medium">{completionError}</p>}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCompletionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Nộp Báo cáo Nghiệm thu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REASON MODAL FOR RETURNING REPORT OR REJECTING MATERIAL ITEM */}
      <ReasonModal
        isOpen={reasonModal.isOpen}
        title={reasonModal.actionType === 'RETURN' ? 'Trả lại Báo cáo sửa chữa' : 'Từ chối dòng vật tư'}
        actionType={reasonModal.actionType}
        entityCode={reasonModal.entityCode}
        onConfirm={handleConfirmReason}
        onClose={() => setReasonModal({ ...reasonModal, isOpen: false })}
      />
    </div>
  );
};
