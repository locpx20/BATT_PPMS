import React, { useState } from 'react';
import { Package, CheckCircle2, Search, ArrowRight, Check, History, X, Boxes } from 'lucide-react';
import { User, LotItem } from '../../types';
import { db } from '../../services/db';
import { Permissions } from '../../services/rbac';
import { MetricCard } from '../common/MetricCard';
import { StatusBadge } from '../common/StatusBadge';
import { showToast } from '../common/Toast';
import { formatNumberVN } from '../../utils/formatters';

interface FinishedGoodsViewProps {
  currentUser: User;
}

export const FinishedGoodsView: React.FC<FinishedGoodsViewProps> = ({ currentUser }) => {
  const snapshot = db.getSnapshot();
  const balanceA = snapshot.finishedInventoryWarehouseA_Kg;
  const balanceB = snapshot.finishedInventoryWarehouseB_Kg;
  const finishedBalance = balanceA + balanceB;
  const lots = snapshot.lots;

  // Filter lots: those ready for receipt vs those already in warehouse
  const pendingReceiveLots = lots.filter((l) => l.qcStatus === 'QC_COMPLETED' && !l.isReceivedInWarehouse);
  const inWarehouseLots = lots.filter((l) => l.isReceivedInWarehouse);

  // Traceability Modal
  const [selectedLotTrace, setSelectedLotTrace] = useState<LotItem | null>(null);

  const handleConfirmReceive = (lot: LotItem) => {
    const res = db.receiveFinishedGoods({
      lotId: lot.id,
      user: currentUser,
    });

    if (res.success) {
      const whName = lot.targetWarehouse === 'KHO_A' ? 'Kho A' : 'Kho B';
      showToast(
        'success',
        'Nhập kho thành phẩm thành công',
        `Đã nhận ${lot.jumboBagsCount} bao Jumbo (${formatNumberVN(lot.quantityKg)} kg) vào ${whName}`
      );
    } else {
      showToast('error', 'Lỗi', res.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner KPI - Strictly Kho A and Kho B */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Tồn Kho A"
          value={(balanceA / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
          unit="Tấn"
          iconName="Package"
          color="indigo"
          subtext="Viên nén gỗ lưu trữ tại Kho A"
        />
        <MetricCard
          title="Tồn Kho B"
          value={(balanceB / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
          unit="Tấn"
          iconName="Boxes"
          color="sky"
          subtext="Viên nén gỗ lưu trữ tại Kho B"
        />
        <MetricCard
          title="Tổng Tồn Thành phẩm"
          value={(finishedBalance / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
          unit="Tấn"
          iconName="CheckCircle2"
          color="emerald"
          subtext="Tổng lượng tồn khả dụng Kho A và Kho B"
        />
        <MetricCard
          title="Lô hàng Chờ nhập kho"
          value={pendingReceiveLots.length}
          unit="Lô (LOT)"
          iconName="ArrowRight"
          color="amber"
          subtext="Đã hoàn thành QC, chờ thủ kho kiểm đếm"
        />
      </div>

      {/* SECTION 1: PENDING RECEIPT INTO FG WAREHOUSE */}
      {pendingReceiveLots.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200/80 p-5 shadow-xs bg-amber-50/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900">
                Lô hàng Đã đạt chuẩn KCS (3/3 lần QC) — Chờ Thủ kho nhận hàng
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Chỉ tăng tồn kho sau khi Thủ kho xác nhận nhập vật lý
              </p>
            </div>
          </div>

          <div className="divide-y divide-amber-100">
            {pendingReceiveLots.map((lot) => (
              <div key={lot.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{lot.lotCode}</span>
                    <span className="font-semibold text-slate-800">{lot.productName}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${lot.targetWarehouse === 'KHO_A' ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800'}`}>
                      {lot.targetWarehouse === 'KHO_A' ? 'Kho A' : 'Kho B'}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-0.5">
                    Ngày sản xuất: {lot.productionDate} • Số lượng: {formatNumberVN(lot.quantityKg)} kg (
                    {lot.jumboBagsCount} bao Jumbo)
                  </p>
                </div>

                {Permissions.canReceiveFinishedGoods(currentUser.role) ? (
                  <button
                    type="button"
                    onClick={() => handleConfirmReceive(lot)}
                    className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Xác nhận Nhập kho thành phẩm
                  </button>
                ) : (
                  <span className="text-slate-400 italic text-[11px]">Chỉ Thủ kho được xác nhận</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: INVENTORY BY LOT */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
            Danh sách Lô hàng Thành phẩm trong Kho & Truy xuất Nguồn gốc (Traceability)
          </h3>
          <span className="text-xs text-slate-500">Quản lý theo thời gian sản xuất và hạn xuất kho FIFO</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Mã LOT</th>
                <th className="py-3 px-4">Vị trí kho</th>
                <th className="py-3 px-4">Ngày sản xuất</th>
                <th className="py-3 px-4 text-right">Khối lượng ban đầu</th>
                <th className="py-3 px-4 text-right">Khả dụng xuất kho</th>
                <th className="py-3 px-4 text-right">Bao Jumbo</th>
                <th className="py-3 px-4">Độ ẩm QC TB</th>
                <th className="py-3 px-4">Thủ kho tiếp nhận</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inWarehouseLots.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Kho thành phẩm hiện đang trống
                  </td>
                </tr>
              ) : (
                inWarehouseLots.map((lot) => {
                  const avgMoisture =
                    lot.tests.length > 0
                      ? (lot.tests.reduce((s, t) => s + t.moisturePercent, 0) / lot.tests.length).toFixed(1)
                      : '—';

                  return (
                    <tr key={lot.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">{lot.lotCode}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${lot.targetWarehouse === 'KHO_A' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                          {lot.targetWarehouse === 'KHO_A' ? 'Kho A' : 'Kho B'}
                        </span>
                      </td>
                      <td className="py-3 px-4">{lot.productionDate}</td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatNumberVN(lot.quantityKg)} kg
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatNumberVN(lot.availableQuantityKg)} kg
                      </td>
                      <td className="py-3 px-4 text-right font-medium">{lot.jumboBagsCount} bao</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-emerald-700">{avgMoisture}%</span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-medium text-slate-800">{lot.receivedByName}</span>
                          <span className="block text-[10px] text-slate-400">
                            {lot.receivedAt ? new Date(lot.receivedAt).toLocaleDateString('vi-VN') : ''}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedLotTrace(lot)}
                          className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] cursor-pointer"
                        >
                          Truy xuất
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TRACEABILITY MODAL */}
      {selectedLotTrace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Hồ sơ Truy xuất Nguồn gốc: {selectedLotTrace.lotCode}</h3>
              <button
                type="button"
                onClick={() => setSelectedLotTrace(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã kế hoạch sản xuất:</span>
                  <span className="font-mono font-bold text-indigo-700">{selectedLotTrace.planCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vị trí kho lưu trữ:</span>
                  <span className="font-bold text-slate-800">
                    {selectedLotTrace.targetWarehouse === 'KHO_A' ? 'Kho A' : 'Kho B'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngày sản xuất hoàn thành:</span>
                  <span className="font-medium text-slate-800">{selectedLotTrace.productionDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Quy cách đóng gói:</span>
                  <span className="font-medium text-slate-800">{selectedLotTrace.jumboBagsCount} bao Jumbo (1 tấn/bao)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tồn khả dụng hiện tại:</span>
                  <span className="font-bold text-emerald-700">{formatNumberVN(selectedLotTrace.availableQuantityKg)} kg</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                  Lịch sử 3 lần Kiểm tra KCS
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedLotTrace.tests.map((t) => (
                    <div key={t.testNumber} className="p-3 bg-white flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800">Lần {t.testNumber}</span>
                        <span className="text-slate-400 text-[10px] ml-2">({t.testedByName})</span>
                      </div>
                      <div className="space-x-3 text-slate-700">
                        <span>Độ ẩm: <strong>{t.moisturePercent}%</strong></span>
                        <span>Độ tro: <strong>{t.ashPercent}%</strong></span>
                        <span>Tạp chất: <strong>{t.impuritiesPercent}%</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLotTrace(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
