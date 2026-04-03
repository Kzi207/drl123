import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (index: number) => void;
}

export default function ImageLightbox({ images, initialIndex = 0, isOpen, onClose, onDelete }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
      setRotation(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialIndex]);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setScale(1);
    setRotation(0);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setScale(1);
    setRotation(0);
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation((prev) => prev + 90);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = images[currentIndex];
    link.download = `minh-chung-${currentIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(currentIndex);
      if (images.length <= 1) {
        onClose();
      } else {
        // Move to next image or previous if it was the last one
        if (currentIndex === images.length - 1) {
          setCurrentIndex(prev => prev - 1);
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8"
        onClick={onClose}
      >
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            title="Phóng to"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            title="Thu nhỏ"
          >
            <ZoomOut size={20} />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            title="Xoay"
          >
            <RotateCw size={20} />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            title="Tải xuống"
          >
            <Download size={20} />
          </button>
          
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-2 bg-white/10 hover:bg-red-500/50 text-white rounded-full transition-colors"
              title="Xóa minh chứng"
            >
              <Trash2 size={20} />
            </button>
          )}

          <div className="w-px h-6 bg-white/20 mx-1"></div>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-red-500 text-white rounded-full transition-colors"
            title="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 md:left-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 md:right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
            >
              <ChevronRight size={32} />
            </button>
          </>
        )}

        <motion.div
          key={currentIndex}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative max-w-full max-h-full flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={images[currentIndex]}
            alt={`Proof ${currentIndex + 1}`}
            className="max-w-full max-h-[85vh] object-contain shadow-2xl transition-transform duration-300"
            style={{ 
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              cursor: scale > 1 ? 'move' : 'default'
            }}
          />
          
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-white font-bold text-sm bg-black/50 px-4 py-1 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        </motion.div>

        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/30 rounded-xl backdrop-blur-md overflow-x-auto max-w-[90vw]">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                  setScale(1);
                  setRotation(0);
                }}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                  currentIndex === idx ? 'border-blue-500 scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                <img src={img} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
