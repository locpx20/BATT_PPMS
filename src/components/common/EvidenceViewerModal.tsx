import React from 'react';
import { X, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface EvidenceViewerModalProps {
  isOpen: boolean;
  title?: string;
  images: { url: string; label?: string }[];
  initialIndex?: number;
  onClose: () => void;
}

export const EvidenceViewerModal: React.FC<EvidenceViewerModalProps> = ({
  isOpen,
  title = 'Chứng từ & Hình ảnh thực tế',
  images,
  initialIndex = 0,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  React.useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 text-white">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-400" />
            <h3 className="font-medium text-sm sm:text-base truncate">{title}</h3>
            {currentImage.label && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {currentImage.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={currentImage.url}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Mở ảnh gốc trong tab mới"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Image Stage */}
        <div className="flex-1 bg-black/60 flex items-center justify-center p-4 overflow-auto min-h-[300px]">
          <img
            src={currentImage.url}
            alt={currentImage.label || 'Chứng từ'}
            className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg select-none"
          />
        </div>

        {/* Thumbnail gallery if multiple images */}
        {images.length > 1 && (
          <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  currentIndex === idx ? 'border-indigo-500 scale-105' : 'border-slate-700 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
