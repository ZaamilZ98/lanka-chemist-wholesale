"use client";

import { useState, useRef, useCallback } from "react";

interface ImageItem {
  id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
}

interface ImageGalleryProps {
  images: ImageItem[];
  productName: string;
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
  const sorted = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return a.sort_order - b.sort_order;
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("center center");
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeImage = sorted[activeIndex];

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  }, []);

  if (sorted.length === 0) {
    return (
      <div className="aspect-square rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
        <div className="text-center text-gray-300">
          <svg
            className="mx-auto h-20 w-20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <p className="mt-2 text-sm">No image available</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Main image with hover zoom */}
      <div
        ref={containerRef}
        className="aspect-square rounded-lg bg-gray-50 border border-gray-200 overflow-hidden cursor-zoom-in relative"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => setLightboxOpen(true)}
      >
        <img
          src={activeImage.url}
          alt={activeImage.alt_text || productName}
          className="h-full w-full object-contain p-6 transition-transform duration-200"
          style={{
            transformOrigin: zoomOrigin,
            transform: isHovering ? "scale(2)" : "scale(1)",
          }}
          draggable={false}
        />
        {/* Zoom hint */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-black/50 px-2 py-1 text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
          </svg>
        </div>
      </div>

      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {sorted.map((img, index) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(index)}
              className={`shrink-0 h-16 w-16 rounded-lg border-2 overflow-hidden transition-colors ${
                index === activeIndex
                  ? "border-brand-green"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <img
                src={img.url}
                alt={img.alt_text || `${productName} thumbnail ${index + 1}`}
                className="h-full w-full object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Navigation arrows */}
          {sorted.length > 1 && (
            <>
              <button
                className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((prev) => (prev > 0 ? prev - 1 : sorted.length - 1));
                }}
                aria-label="Previous image"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((prev) => (prev < sorted.length - 1 ? prev + 1 : 0));
                }}
                aria-label="Next image"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <img
            src={activeImage.url}
            alt={activeImage.alt_text || productName}
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
