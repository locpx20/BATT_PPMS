import React, { useState } from 'react';
import { Cpu, Plus, CheckCircle2, AlertTriangle, Wrench, XCircle, X } from 'lucide-react';
import { User, Machine, ProductionStage, MachineStatus, STAGE_NAMES } from '../../types';
import { db } from '../../services/db';
import { Permissions } from '../../services/rbac';
import { StatusBadge } from '../common/StatusBadge';
import { showToast } from '../common/Toast';

interface MachineViewProps {
  currentUser: User;
}

export const MachineView: React.FC<MachineViewProps> = ({ currentUser }) => {
  const snapshot = db.getSnapshot();
  const machines = snapshot.machines;

  const [showAddModal, setShowAddModal] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [stage, setStage] = useState<ProductionStage>('PELLETIZING');
  const [model, setModel] = useState('');
  const [capacity, setCapacity] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');

  const handleAddMachine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError('Mã máy và tên thiết bị không được để trống');
      return;
    }

    const res = db.addMachine(
      {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        stage,
        model: model.trim() || 'Tiêu chuẩn BATT',
        capacity: capacity.trim() || '20 tấn/giờ',
        status: 'OPERATIONAL',
        installationDate: new Date().toISOString().split('T')[0],
        location: location.trim() || 'Xưởng sản xuất trung tâm',
      },
      currentUser
    );

    if (res.success) {
      showToast('success', 'Thêm máy thành công', `Thiết bị ${code} đã được đưa vào danh mục`);
      setShowAddModal(false);
      setCode('');
      setName('');
    }
  };

  const handleChangeStatus = (machineId: string, status: MachineStatus) => {
    const res = db.updateMachineStatus(machineId, status, currentUser);
    if (res.success) {
      showToast('success', 'Đã cập nhật trạng thái', 'Trạng thái thiết bị đã thay đổi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Danh mục Máy móc & Thiết bị</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý trang thiết bị dây chuyền 7 công đoạn sản xuất viên nén gỗ
          </p>
        </div>

        {Permissions.canManageMachines(currentUser.role) && (
          <button
            type="button"
            onClick={() => {
              setCode(`M-${Date.now().toString().slice(-4)}`);
              setError('');
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Thêm thiết bị mới
          </button>
        )}
      </div>

      {/* Machine Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {machines.map((m) => (
          <div
            key={m.id}
            className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-indigo-700 text-xs px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100">
                  {m.code}
                </span>
                <StatusBadge status={m.status} size="sm" />
              </div>

              <h3 className="font-bold text-sm text-slate-900 mb-1 leading-snug">{m.name}</h3>
              <p className="text-xs font-semibold text-slate-500 mb-3">{STAGE_NAMES[m.stage]}</p>

              <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Model:</span>
                  <span className="font-medium text-slate-800">{m.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Công suất:</span>
                  <span className="font-semibold text-slate-800">{m.capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vị trí:</span>
                  <span className="text-slate-700 truncate max-w-[150px]">{m.location}</span>
                </div>
              </div>
            </div>

            {/* Quick Status Toggles (Owner / Manager) */}
            {Permissions.canManageMachines(currentUser.role) && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Cập nhật:</span>
                <div className="inline-flex gap-1">
                  {m.status !== 'OPERATIONAL' && (
                    <button
                      type="button"
                      onClick={() => handleChangeStatus(m.id, 'OPERATIONAL')}
                      className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold cursor-pointer"
                    >
                      Hoạt động
                    </button>
                  )}
                  {m.status !== 'MAINTENANCE_REQUIRED' && (
                    <button
                      type="button"
                      onClick={() => handleChangeStatus(m.id, 'MAINTENANCE_REQUIRED')}
                      className="px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold cursor-pointer"
                    >
                      Bảo trì
                    </button>
                  )}
                  {m.status !== 'DECOMMISSIONED' && (
                    <button
                      type="button"
                      onClick={() => handleChangeStatus(m.id, 'DECOMMISSIONED')}
                      className="px-2 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                    >
                      Ngừng
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ADD MACHINE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Thêm Thiết bị Máy móc</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMachine} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mã máy <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="M-CLEAN-02"
                    className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Công đoạn sản xuất <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as ProductionStage)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-indigo-500"
                  >
                    {(Object.keys(STAGE_NAMES) as ProductionStage[]).map((s) => (
                      <option key={s} value={s}>
                        {STAGE_NAMES[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tên thiết bị chi tiết <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Máy ép viên nén khuôn đứng CPM số 3"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Model / Hãng sản xuất
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="CPM 7936-8"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Công suất định mức
                  </label>
                  <input
                    type="text"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="4.5 tấn/giờ"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Vị trí lắp đặt trong nhà xưởng
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Xưởng ép viên số 2"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Xác nhận Thêm máy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
