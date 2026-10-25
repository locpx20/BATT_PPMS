import React, { useState } from 'react';
import { Plus, Calendar, Layers, Clock, Users, X, CheckCircle2 } from 'lucide-react';
import { User, ProductionPlan, ProductionStage, STAGE_NAMES, PlanShift, SHIFT_NAMES } from '../../types';
import { db } from '../../services/db';
import { Permissions } from '../../services/rbac';
import { StatusBadge } from '../common/StatusBadge';
import { showToast } from '../common/Toast';

interface ProductionPlanViewProps {
  currentUser: User;
}

export const ProductionPlanView: React.FC<ProductionPlanViewProps> = ({ currentUser }) => {
  const snapshot = db.getSnapshot();
  const plans = snapshot.productionPlans;
  const machines = snapshot.machines.filter((m) => m.status === 'OPERATIONAL');
  const operators = snapshot.users.filter((u) => u.role === 'S');

  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state - Single finished product is "Viên nén gỗ"
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState<PlanShift>('CA_1');
  const productName = 'Viên nén gỗ'; // Fixed single product
  const [targetQuantityKg, setTargetQuantityKg] = useState<number>(25000);
  const [notes, setNotes] = useState('');

  // 4 Core Stages with Multiple Staff Multi-select
  const [configuredStages, setConfiguredStages] = useState<
    {
      stage: ProductionStage;
      machineId: string;
      operatorIds: string[];
      targetQuantityKg: number;
    }[]
  >([
    {
      stage: 'CLEANING',
      machineId: machines.find((m) => m.stage === 'CLEANING')?.id || machines[0]?.id || '',
      operatorIds: [operators[0]?.id].filter(Boolean),
      targetQuantityKg: 28000,
    },
    {
      stage: 'DRYING',
      machineId: machines.find((m) => m.stage === 'DRYING')?.id || machines[0]?.id || '',
      operatorIds: [operators[1]?.id || operators[0]?.id].filter(Boolean),
      targetQuantityKg: 26000,
    },
    {
      stage: 'PELLETIZING',
      machineId: machines.find((m) => m.stage === 'PELLETIZING')?.id || machines[0]?.id || '',
      operatorIds: operators.slice(0, 2).map((o) => o.id), // multi-operator example
      targetQuantityKg: 25000,
    },
    {
      stage: 'PACKAGING',
      machineId: machines.find((m) => m.stage === 'PACKAGING')?.id || machines[0]?.id || '',
      operatorIds: [operators[0]?.id].filter(Boolean),
      targetQuantityKg: 25000,
    },
  ]);

  const [formError, setFormError] = useState('');

  const toggleOperatorForStage = (stageIdx: number, opId: string) => {
    const updated = [...configuredStages];
    const currentList = updated[stageIdx].operatorIds;
    if (currentList.includes(opId)) {
      if (currentList.length > 1) {
        updated[stageIdx].operatorIds = currentList.filter((id) => id !== opId);
      }
    } else {
      updated[stageIdx].operatorIds = [...currentList, opId];
    }
    setConfiguredStages(updated);
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetQuantityKg <= 0) {
      setFormError('Sản lượng mục tiêu phải lớn hơn 0 kg');
      return;
    }

    const assignmentsPayload = configuredStages.map((stg) => {
      const selectedOps = operators.filter((o) => stg.operatorIds.includes(o.id));
      const primaryOp = selectedOps[0];
      return {
        stage: stg.stage,
        machineId: stg.machineId,
        operatorId: primaryOp?.id || operators[0]?.id || '',
        operatorIds: stg.operatorIds,
        assignedStaffIds: stg.operatorIds,
        assignedStaffNames: selectedOps.map((o) => o.fullName),
        targetQuantityKg: stg.targetQuantityKg,
      };
    });

    const res = db.createProductionPlan({
      productionDate,
      shift,
      targetQuantityKg,
      assignments: assignmentsPayload as any,
      notes,
      creator: currentUser,
    });

    if (res.success) {
      showToast('success', 'Lập kế hoạch thành công', `Mã kế hoạch: ${res.plan?.code}`);
      setShowCreateModal(false);
    } else {
      setFormError(res.error || 'Lỗi khi tạo kế hoạch');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Kế hoạch Sản xuất</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lập kế hoạch ca máy, phân công công nhân vận hành và định mức sản lượng Viên nén gỗ
          </p>
        </div>

        {Permissions.canCreateProductionPlan(currentUser.role) && (
          <button
            type="button"
            onClick={() => {
              setFormError('');
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tạo kế hoạch
          </button>
        )}
      </div>

      {/* Plan Cards / Table */}
      <div className="space-y-4">
        {plans.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
            Chưa có kế hoạch sản xuất nào
          </div>
        ) : (
          plans.map((pl) => (
            <div
              key={pl.id}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700 font-mono font-bold text-sm">
                    {pl.code}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{pl.productName}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                        Sản phẩm chuẩn
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>Ngày: {pl.productionDate}</span>
                      <span>•</span>
                      <span>{SHIFT_NAMES[pl.shift]}</span>
                      <span>•</span>
                      <span>Người tạo: {pl.createdByName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block uppercase font-medium">Mục tiêu</span>
                    <span className="text-sm font-bold text-slate-900">
                      {pl.targetQuantityKg.toLocaleString('vi-VN')} kg
                    </span>
                  </div>
                  <StatusBadge status={pl.status} />
                </div>
              </div>

              {/* Configured Stages */}
              <div className="pt-4">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  Phân công máy &amp; công nhân ({pl.assignments.length} công đoạn)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {pl.assignments.map((asg) => {
                    const staffList =
                      asg.operatorNames && asg.operatorNames.length > 0
                        ? asg.operatorNames.join(', ')
                        : 'Chưa phân công';
                    return (
                      <div key={asg.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                        <span className="font-bold text-slate-900 block truncate">{STAGE_NAMES[asg.stage]}</span>
                        <p className="text-slate-700 font-medium truncate mt-1">{asg.machineName}</p>
                        <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200/70 space-y-1">
                          <div className="flex items-start gap-1">
                            <span className="text-slate-400 shrink-0">Nhân sự:</span>
                            <span className="font-semibold text-slate-800 line-clamp-1">{staffList}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Chỉ tiêu:</span>
                            <span className="font-bold text-indigo-700">
                              {asg.targetQuantityKg.toLocaleString('vi-VN')} kg
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE PLAN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-slate-900 text-base">Lập Kế hoạch Sản xuất</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ngày sản xuất <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={productionDate}
                    onChange={(e) => setProductionDate(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ca sản xuất <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as PlanShift)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="CA_1">Ca 1 (06:00 - 14:00)</option>
                    <option value="CA_2">Ca 2 (14:00 - 22:00)</option>
                    <option value="CA_3">Ca 3 (22:00 - 06:00)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Sản phẩm đầu ra
                  </label>
                  <div className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-800 flex items-center justify-between">
                    <span>Viên nén gỗ</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-mono">
                      Chuẩn thành phẩm
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Sản lượng mục tiêu (kg) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={targetQuantityKg}
                    onChange={(e) => setTargetQuantityKg(Number(e.target.value))}
                    className="w-full text-xs font-bold text-slate-900 border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Assignment Rows for stages with MULTI-OPERATOR CHECKBOXES */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Phân công máy &amp; Công nhân phụ trách (Hỗ trợ nhiều công nhân trên 1 máy)
                </label>
                <div className="space-y-3">
                  {configuredStages.map((stg, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 text-xs">{STAGE_NAMES[stg.stage]}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500">Mục tiêu:</span>
                          <input
                            type="number"
                            value={stg.targetQuantityKg}
                            onChange={(e) => {
                              const updated = [...configuredStages];
                              updated[idx].targetQuantityKg = Number(e.target.value);
                              setConfiguredStages(updated);
                            }}
                            className="w-24 text-xs font-semibold border border-slate-300 rounded-md p-1 bg-white text-right"
                          />
                          <span className="text-slate-500 text-[11px]">kg</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                            Chọn máy khả dụng:
                          </label>
                          <select
                            value={stg.machineId}
                            onChange={(e) => {
                              const updated = [...configuredStages];
                              updated[idx].machineId = e.target.value;
                              setConfiguredStages(updated);
                            }}
                            className="w-full text-xs border border-slate-300 rounded-md p-1.5 bg-white truncate"
                          >
                            {machines.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.code} - {m.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                            Công nhân phụ trách (chọn 1 hoặc nhiều):
                          </label>
                          <div className="flex flex-wrap gap-1.5 p-1.5 bg-white rounded-md border border-slate-200 max-h-24 overflow-y-auto">
                            {operators.map((op) => {
                              const isChecked = stg.operatorIds.includes(op.id);
                              return (
                                <button
                                  key={op.id}
                                  type="button"
                                  onClick={() => toggleOperatorForStage(idx, op.id)}
                                  className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                                    isChecked
                                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold'
                                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  {isChecked ? '✓ ' : '+ '}
                                  {op.fullName}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ghi chú kế hoạch
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú điều hành sản xuất..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {formError && <p className="text-xs text-rose-600 font-medium">{formError}</p>}

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Xác nhận Tạo kế hoạch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
