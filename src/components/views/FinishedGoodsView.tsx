import React, { useState } from 'react';
import { Package, CheckCircle2, Search, ArrowRight, Check, History, X } from 'lucide-react';
import { User, LotItem } from '../../types';
import { db } from '../../services/db';
import { Permissions } from '../../services/rbac';
import { MetricCard } from '../common/MetricCard';
import { StatusBadge } from '../common/StatusBadge';
import { showToast } from '../common/Toast';

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
      const whName = lot.targetWarehouse === 'KHO_A' ? 'Kho A (Xuất khẩu)' : 'Kho B (Công nghiệp)';
      showToast(
        'success',
        'Nhập kho thành phẩm thành công',
        `Đã nhận ${lot.jumboBagsCount} bao Jumbo (${lot.quantityKg.toLocaleString('vi-VN')} kg) vào ${whName}`
      );
    } else {
      showToast('error', 'Lỗi', res.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner KPI - Distinct Kho A and Kho B */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Tồn Kho A (Xuất khẩu)"
          value={(balanceA / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
          unit="Tấn"
          iconName="Package"
          color="indigo"
          subtext="Viên nén đạt chuẩn Grade A (ENplus-A1)"
        />
        <MetricCard
          title="Tồn Kho B (Công nghiệp)"
          value={(balanceB / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
          unit="Tấn"
          iconName="Boxes"
          color="sky"
          subtext="Viên nén đạt chuẩn Grade B (Nồi hơi)"
        />
        <MetricCard
          title="Tổng Tồn Thành phẩm"
          value={(finishedBalance / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
          unit="Tấn"
          iconName="CheckCircle2"
          color="emerald"
          subtext="Tổng lượng khả dụng cả Kho A và Kho B"
        />
        <MetricCard
          title="LOT Chờ nhập kho"
          value={pendingReceiveLots.length}
          unit="LOT"
          iconName="ArrowRight"
          color="amber"
          subtext="Đã đạt 3 lần QC, chờ thủ kho kiểm đếm"
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
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${lot.targetWarehouse === 'KHO_A' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}`}>
                      {lot.targetWarehouse === 'KHO_A' ? 'Kho A (Xuất khẩu)' : 'Kho B (Công nghiệp)'}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-0.5">
                    Ngày sản xuất: {lot.productionDate} • Số lượng: {lot.quantityKg.toLocaleString('vi-VN')} kg (
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
                <th className="py-3 px-4">Ngày sản xuất</th>
                <th className="py-3 px-4">Sản phẩm</th>
                <th className="py-3 px-4">Phân hạng</th>
                <th className="py-3 px-4 text-right">Tổng khối lượng</th>
                <th className="py-3 px-4 text-right">Bao Jumbo</th>
                <th className="py-3 px-4 text-right">Tồn khả dụng</th>
                <th className="py-3 px-4">Thủ kho tiếp nhận</th>
                <th className="py-3 px-4 text-center">Truy xuất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inWarehouseLots.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Chưa có lô hàng thành phẩm nào trong kho
                  </td>
                </tr>
              ) : (
                inWarehouseLots.map((lot) => (
                  <tr key={lot.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{lot.lotCode}</td>
                    <td className="py-3 px-4">{lot.productionDate}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{lot.productName}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${lot.targetWarehouse === 'KHO_A' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}`}>
                        {lot.targetWarehouse === 'KHO_A' ? 'Kho A (Xuất khẩu)' : 'Kho B (Công nghiệp)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">{lot.quantityKg.toLocaleString('vi-VN')} kg</td>
                    <td className="py-3 px-4 text-right">{lot.jumboBagsCount} bao</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {lot.availableQuantityKg.toLocaleString('vi-VN')} kg
                    </td>
                    <td className="py-3 px-4">{lot.receivedByName || 'Thủ kho'}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedLotTrace(lot)}
                        className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                      >
                        Truy xuất LOT →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL TRACEABILITY MODAL */}
      {selectedLotTrace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Truy xuất Nguồn gốc Toàn bộ (Traceability)</h3>
                <p className="text-xs text-indigo-700 font-mono font-bold">{selectedLotTrace.lotCode}</p>
              </div>
              <button
                onClick={() => setSelectedLotTrace(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Step 1: Production Plan */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-indigo-700 uppercase tracking-wider text-[11px] block">
                  1. Kế hoạch Sản xuất gốc
                </span>
                <p className="font-semibold text-slate-800">{selectedLotTrace.planCode}</p>
                <p className="text-slate-500">Sản phẩm: {selectedLotTrace.productName}</p>
              </div>

              {/* Step 2: Shift Report */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-indigo-700 uppercase tracking-wider text-[11px] block">
                  2. Báo cáo Ca Sản xuất
                </span>
                <p className="font-semibold text-slate-800">Mã ca: {selectedLotTrace.shiftReportId}</p>
                <p className="text-slate-500">
                  Ngày sản xuất: {selectedLotTrace.productionDate} • Sản lượng: {selectedLotTrace.quantityKg} kg
                </p>
              </div>

              {/* Step 3: 3 Independent QC Tests */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-indigo-700 uppercase tracking-wider text-[11px] block">
                  3. Kết quả 3 Lần Kiểm tra KCS Độc lập ({selectedLotTrace.targetWarehouse === 'KHO_A' ? 'Kho A - Xuất khẩu' : 'Kho B - Công nghiệp'})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {selectedLotTrace.tests.map((t) => (
                    <div key={t.testNumber} className="p-2 rounded-lg bg-white border border-slate-200 text-[11px]">
                      <span className="font-bold block text-slate-800">Lần {t.testNumber}</span>
                      <p className="text-slate-600">Độ ẩm: {t.moisturePercent}%</p>
                      <p className="text-slate-600">Độ tro: {t.ashPercent}%</p>
                      <p className="text-slate-400 mt-1">KCS: {t.testedByName}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 4: Warehouse Receipt */}
              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 space-y-1">
                <span className="font-bold text-teal-800 uppercase tracking-wider text-[11px] block">
                  4. Tiếp nhận Nhập kho Thành phẩm Vật lý
                </span>
                <p className="text-teal-900 font-semibold">
                  Thủ kho xác nhận: {selectedLotTrace.receivedByName || 'Phạm Thị Phương Thảo'}
                </p>
                <p className="text-teal-700">
                  Thời gian: {selectedLotTrace.receivedAt ? new Date(selectedLotTrace.receivedAt).toLocaleString('vi-VN') : 'Đã nhập kho'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
