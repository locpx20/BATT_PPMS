import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, FileText, Image as ImageIcon, Plus, Eye, X } from 'lucide-react';
import { User, LotItem, SingleQcTest } from '../../types';
import { db } from '../../services/db';
import { Permissions } from '../../services/rbac';
import { StatusBadge } from '../common/StatusBadge';
import { EvidenceUpload } from '../common/EvidenceUpload';
import { EvidenceViewerModal } from '../common/EvidenceViewerModal';
import { showToast } from '../common/Toast';
import { formatNumberVN } from '../../utils/formatters';

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
        `Đã lưu kết quả kiểm tra lần ${selectedLot.tests.length + 1}/3 cho lô ${selectedLot.lotCode}`
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
            Mỗi lô hàng (LOT) phải thực hiện đúng 3 lần kiểm tra độc lập để xác định phân loại vào Kho A hoặc Kho B
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
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${lot.targetWarehouse === 'KHO_A' ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800'}`}>
                          {lot.targetWarehouse === 'KHO_A' ? 'Kho A' : 'Kho B'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>Ngày sản xuất: {lot.productionDate}</span>
                      <span>•</span>
                      <span>{lot.jumboBagsCount} bao Jumbo</span>
                      <span>•</span>
                      <span>Khối lượng: {formatNumberVN(lot.quantityKg)} kg</span>
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
                  <StatusBadge status={lot.qcStatus} context="QC" />
                </div>
              </div>

              {/* 3 Independent Tests Display */}
              <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {[1, 2, 3].map((num) => {
                  const test = lot.tests.find((t) => t.testNumber === num);
                  return (
                    <div
                      key={num}
                      className={`p-3.5 rounded-xl border text-xs transition-all ${
                        test
                          ? 'bg-slate-50/70 border-slate-200'
                          : 'bg-dashed border-slate-200 bg-slate-50/20 flex flex-col items-center justify-center min-h-[140px]'
                      }`}
                    >
                      {test ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                            <span className="font-bold text-slate-800">Lần đo {num}/3</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(test.testedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Độ ẩm:</span>
                              <span className={`font-bold ${test.moisturePercent > 10 ? 'text-rose-600' : 'text-emerald-700'}`}>
                                {test.moisturePercent}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Độ tro:</span>
                              <span className="font-semibold text-slate-800">{test.ashPercent}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Tạp chất:</span>
                              <span className="font-semibold text-slate-800">{test.impuritiesPercent}%</span>
                            </div>
                            {test.calorificValueKcalKg && (
                              <div className="flex justify-between">
                                <span className="text-slate-500">Nhiệt trị:</span>
                                <span className="font-semibold text-indigo-700">{test.calorificValueKcalKg} kcal/kg</span>
                              </div>
                            )}
                          </div>

                          <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                            <span>KCS: {test.testedByName}</span>
                            {test.imageUrl && (
                              <button
                                type="button"
                                onClick={() => handleViewLotEvidence(lot)}
                                className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                              >
                                Xem ảnh mẫu
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <span className="text-slate-400 block mb-1">Chưa có kết quả lần {num}</span>
                          {canAddTest && num === testCount + 1 && (
                            <button
                              type="button"
                              onClick={() => handleOpenAddTest(lot)}
                              className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Đo mẫu lần {num}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Evaluation Banner when 3/3 done */}
              {lot.qcStatus === 'QC_COMPLETED' && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Đã hoàn thành đầy đủ 3/3 lần kiểm tra. Phân loại chỉ định: <strong>{lot.targetWarehouse === 'KHO_A' ? 'Kho A' : 'Kho B'}</strong>.
                      {!lot.isReceivedInWarehouse && ' Chờ Thủ kho kiểm đếm và nhận vào kho.'}
                    </span>
                  </div>
                  {lot.tests.some((t) => t.imageUrl) && (
                    <button
                      type="button"
                      onClick={() => handleViewLotEvidence(lot)}
                      className="text-xs font-semibold text-emerald-800 underline hover:text-emerald-950 shrink-0 cursor-pointer"
                    >
                      Xem toàn bộ ảnh mẫu kiểm tra
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* QC TEST MODAL */}
      {showTestModal && selectedLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Ghi nhận Kết quả Kiểm tra QC — Lần {selectedLot.tests.length + 1}/3
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">Lô hàng: {selectedLot.lotCode}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTest} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Độ ẩm (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={moisturePercent}
                    onChange={(e) => setMoisturePercent(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Chuẩn: 6% - 10%</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Độ tro (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={ashPercent}
                    onChange={(e) => setAshPercent(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Chuẩn Kho A: ≤ 0.7%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tạp chất (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={impuritiesPercent}
                    onChange={(e) => setImpuritiesPercent(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nhiệt trị (kcal/kg)
                  </label>
                  <input
                    type="number"
                    value={calorificValueKcalKg}
                    onChange={(e) => setCalorificValueKcalKg(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <EvidenceUpload
                label="Ảnh chụp mẫu đo phòng thí nghiệm / ẩm kế"
                currentImageUrl={imageUrl}
                onImageSelected={setImageUrl}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ghi chú kiểm tra
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú màu sắc viên, độ nén, vết nứt bề mặt..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
                >
                  Lưu kết quả đo lần {selectedLot.tests.length + 1}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EVIDENCE VIEWER MODAL */}
      <EvidenceViewerModal
        isOpen={showEvidence}
        images={evidenceImages}
        onClose={() => setShowEvidence(false)}
      />
    </div>
  );
};
