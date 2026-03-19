'use client'
// src/components/property/PhotoGallery.tsx
// Browsable photo gallery with lightbox for Repliers listing images
import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface Photo {
  smallUrl: string
  mediumUrl: string
  largeUrl: string
}

interface PhotoGalleryProps {
  photos: Photo[]
  address: string
}

export function PhotoGallery({ photos, address }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-2xl bg-secondary-100 text-secondary-400">
        No photos available
      </div>
    )
  }

  return (
    <>
      {/* Grid layout: 1 large + up to 4 thumbnails */}
      <div className="grid grid-cols-4 gap-2 overflow-hidden rounded-2xl">
        <div
          className="col-span-2 row-span-2 cursor-pointer"
          onClick={() => setLightboxIndex(0)}
        >
          <img
            src={photos[0]!.largeUrl}
            alt={`${address} — main photo`}
            className="h-full w-full object-cover transition-opacity hover:opacity-95"
          />
        </div>
        {photos.slice(1, 5).map((photo, i) => (
          <div
            key={i}
            className="cursor-pointer overflow-hidden"
            onClick={() => setLightboxIndex(i + 1)}
          >
            <img
              src={photo.mediumUrl}
              alt={`${address} — photo ${i + 2}`}
              className="h-full w-full object-cover transition-opacity hover:opacity-90"
            />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 rounded-full p-2 text-white hover:bg-white/10"
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            onClick={() => setLightboxIndex(Math.max(0, lightboxIndex - 1))}
            disabled={lightboxIndex === 0}
            className="absolute left-4 rounded-full p-2 text-white hover:bg-white/10 disabled:opacity-30"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <img
            src={photos[lightboxIndex]!.largeUrl}
            alt={`${address} — photo ${lightboxIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
          />
          <button
            onClick={() => setLightboxIndex(Math.min(photos.length - 1, lightboxIndex + 1))}
            disabled={lightboxIndex === photos.length - 1}
            className="absolute right-4 rounded-full p-2 text-white hover:bg-white/10 disabled:opacity-30"
            aria-label="Next photo"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
          <p className="absolute bottom-4 text-sm text-white/60">
            {lightboxIndex + 1} / {photos.length}
          </p>
        </div>
      )}
    </>
  )
}
