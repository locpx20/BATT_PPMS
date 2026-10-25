import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, FileText, Image as ImageIcon, Plus, Eye, X } from 'lucide-react';
import { User, LotItem, SingleQcTest } from '../../types';
import { db } from '../../services/db';
import { Permissions } from '../../services/rbac';
import { StatusBadge } from '../common/StatusBadge';
import { EvidenceUpload } from '../common/EvidenceUpload';
import { EvidenceViewerModal } from '../common/EvidenceViewerModal';
import { showToast } from '../common/Toast';

interface QualityControlViewProps {
  currentUser: User;
}

export const QualityControlView: React.FC<QualityControlViewProps> = ({ currentUser }) => {
  const snapshot = db.getSnapshot();
  const lots = snapshot.lots;

  const [selectedLot, setSelectedLot] = useState<LotItem | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);

  // QC Test Form
  const [moisturePercent, setMoisturePercent] = useState<number>(8.0);
  const [ashPercent, setAshPercent] = useState<number>(0.7);
  const [impuritiesPercent, setImpuritiesPercent] = useState<number>(0.15);
  const [calorificValueKcalKg, setCalorificValueKcalKg] = useState<number>(4600);
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Evidence Gallery Modal
  const [showEvidence, setShowEvidence] = useState(false);
  const [evidenceImages, setEvidenceImages] = useState<{ url: string; label?: string }[]>([]);

  const handleOpenAddTest = (lot: LotItem) => {
    setSelectedLot(lot);
    setMoisturePercent(8.0);
    setAshPercent(0.7);
    setImpuritiesPercent(0.15);
    setCalorificValueKcalKg(4600);
    setImageUrl(undefined);
    setNotes('');
    setError('');
    setShowTestModal(true);
  };

  const handleSubmitTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLot) return;

    if (moisturePercent <= 0 || ashPercent < 0) {
      setError('Các thông số đo kiểm tra phải hợp lệ');
      return;
    }

    const res = db.addQcTest({
      lotId: selectedLot.id,
      moisturePercent,
      ashPercent,
      impuritiesPercent,
      calorificValueKcalKg,
      imageUrl,
      notes,
      user: currentUser,
    });

    if (res.success) {
      showToast(
        'success',
        'Ghi kết quả QC thành công',
        `Đã lưu kết quả kiểm tra lần ${selectedLot.tests.length + 1}/3 cho ${selectedLot.lotCode}`
      );
      setShowTestModal(false);
      setSelectedLot(null);
    } else {
      setError(res.error || 'Lỗi khi lưu kết quả QC');
    }
  };

  const handleViewLotEvidence = (lot: LotItem) => {
    const imgs: { url: string; label?: string }[] = [];
    lot.tests.forEach((t) => {
      if (t.imageUrl) {
        imgs.push({ url: t.imageUrl, label: `QC Lần ${t.testNumber} (${t.moisturePercent}% ẩm)` });
      }
    });
    if (imgs.length > 0) {
      setEvidenceImages(imgs);
      setShowEvidence(true);
    } else {
      showToast('info', 'Thông báo', 'Lô hàng này chưa có ảnh chứng từ chụp mẫu');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Kiểm tra Chất lượng (KCS / QC)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mỗi lô hàng (LOT) phải thực hiện 3 lần kiểm tra độc lập để xác định phân hạng Grade A / Grade B
          </p>
        </div>
      </div>

      {/* LOT Grid */}
      <div className="space-y-4">
        {lots.map((lot) => {
          const testCount = lot.tests.length;
          const canAddTest =
            testCount < 3 && Permissions.canPerformQcTest(currentUser.role) && lot.qcStatus !== 'QC_COMPLETED';

          return (
            <div
              key={lot.id}
              className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all"
            >
              {/* Top LOT Meta */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700 font-mono font-bold text-sm">
                    {lot.lotCode}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{lot.productName}</h3>
                      {lot.targetWarehouse && (
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${lot.targetWarehouse === 'KHO_A' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}`}>
                          {lot.targetWarehouse === 'KHO_A' ? 'Kho A (Xuất khẩu)' : 'Kho B (Công nghiệp)'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>Ngày sản xuất: {lot.productionDate}</span>
                      <span>•</span>
                      <span>{lot.jumboBagsCount} bao Jumbo</span>
                      <span>•</span>
                      <span>Khối lượng: {lot.quantityKg.toLocaleString('vi-VN')} kg</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block uppercase font-medium">Tiến độ KCS</span>
                    <span className="text-xs font-bold text-indigo-700">
                      {testCount}/3 lần kiểm tra
                    </span>
                  </div>
                  <StatusBadge status={lot.qcStatus} />
                </div>
              </div>

              {/* 3 Independent Tests Display */}
              <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {[1, 2, 3].map((num) => {
                  const test = lot.tests.find((t) => t.testNumber === num);
                  return (
                    <div
                      key={num}
                      className={`p-3.5 rounded-xl border text-xs transition-colors ${
                        test
                          ? 'bg-slate-50/70 border-slate-200'
                          : 'bg-slate-50/20 border-dashed border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-800">Kiểm tra Lần {num}</span>
                        {test ? (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(test.testedAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Chưa đo</span>
                        )}
                      </div>

                      {test ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Độ ẩm:</span>
                            <span
                              className={`font-bold ${
                                test.moisturePercent > 10 ? 'text-amber-600' : 'text-emerald-700'
                              }`}
                            >
                              {test.moisturePercent}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Độ tro:</span>
                            <span
                              className={`font-bold ${
                                test.ashPercent > 0.8 ? 'text-blue-700' : 'text-emerald-700'
                              }`}
                            >
                              {test.ashPercent}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Tạp chất:</span>
                            <span className="font-semibold text-slate-700">{test.impuritiesPercent}%</span>
                          </div>
                          {test.calorificValueKcalKg && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Nhiệt trị:</span>
                              <span className="font-semibold text-slate-700">
                                {test.calorificValueKcalKg} kcal/kg
                              </span>
                            </div>
                          )}
                          <p className="text-[11px] text-slate-400 truncate mt-1">KCS: {test.testedByName}</p>
                        </div>
                      ) : (
                        <div className="py-5 text-center text-slate-400 text-xs">
                          {num === testCount + 1 && canAddTest ? (
                            <button
                              type="button"
                              onClick={() => handleOpenAddTest(lot)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                            >
                              Đo mẫu lần {num}
                            </button>
                          ) : (
                            <span>Chờ hoàn thành lần trước</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons & Evidence footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {lot.tests.some((t) => t.imageUrl) && (
                    <button
                      type="button"
                      onClick={() => handleViewLotEvidence(lot)}
                      className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Xem ảnh chụp mẫu đo
                    </button>
                  )}
                </div>

                {lot.isReceivedInWarehouse ? (
                  <span className="text-teal-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Đã nhập kho thành phẩm ({lot.availableQuantityKg.toLocaleString('vi-VN')} kg khả dụng)
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Chưa nhập kho thành phẩm</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* QC TEST MODAL (QC Staff) */}
      {showTestModal && selectedLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Ghi nhận Kết quả Kiểm tra KCS (Lần {selectedLot.tests.length + 1}/3)
                </h3>
                <p className="text-xs text-slate-500 font-mono">Lô hàng: {selectedLot.lotCode}</p>
              </div>
              <button
                onClick={() => setShowTestModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTest} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Độ ẩm (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="50"
                    value={moisturePercent}
                    onChange={(e) => setMoisturePercent(Number(e.target.value))}
                    className="w-full text-sm font-bold border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Chuẩn ENplus: 6% - 10%</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Độ tro (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={ashPercent}
                    onChange={(e) => setAshPercent(Number(e.target.value))}
                    className="w-full text-sm font-bold border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Grade A &le; 0.8% • Grade B &le; 1.5%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tạp chất (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={impuritiesPercent}
                    onChange={(e) => setImpuritiesPercent(Number(e.target.value))}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nhiệt trị (kcal/kg)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    max="6000"
                    value={calorificValueKcalKg}
                    onChange={(e) => setCalorificValueKcalKg(Number(e.target.value))}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <EvidenceUpload
                label="Ảnh thiết bị đo / mẫu viên nén"
                value={imageUrl}
                onChange={setImageUrl}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ghi chú cảm quan
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mẫu viên bóng, không nứt gãy, màu sáng..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Lưu kết quả QC lần {selectedLot.tests.length + 1}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evidence Viewer */}
      <EvidenceViewerModal
        isOpen={showEvidence}
        images={evidenceImages}
        onClose={() => setShowEvidence(false)}
      />
    </div>
  );
};
