import React, { useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface EvidenceUploadProps {
  label: string;
  value?: string;
  currentImageUrl?: string;
  onChange?: (base64Url?: string) => void;
  onImageSelected?: (base64Url?: string) => void;
  required?: boolean;
}

export const EvidenceUpload: React.FC<EvidenceUploadProps> = ({
  label,
  value,
  currentImageUrl,
  onChange,
  onImageSelected,
  required = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeValue = value !== undefined ? value : currentImageUrl;
  const triggerChange = (url?: string) => {
    if (onChange) onChange(url);
    if (onImageSelected) onImageSelected(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read as DataURL (base64) so it immediately persists and displays cleanly
    const reader = new FileReader();
    reader.onloadend = () => {
      triggerChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      {activeValue ? (
        <div className="relative group w-36 h-28 rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
          <img src={activeValue} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => triggerChange(undefined)}
            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/70 text-white hover:bg-rose-600 transition-colors cursor-pointer"
            title="Xóa ảnh"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-lg p-3 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-indigo-50/30 flex flex-col items-center justify-center gap-1.5"
        >
          <div className="p-2 rounded-full bg-slate-200 text-slate-600">
            <Upload className="w-4 h-4" />
          </div>
          <span className="text-xs text-slate-600 font-medium">Bấm để tải ảnh chứng từ</span>
          <span className="text-[11px] text-slate-400">JPG, PNG, WebP (Tối đa 5MB)</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  );
};
