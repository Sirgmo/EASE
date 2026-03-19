// src/components/property/FavouriteButton.tsx
'use client'
import { useState } from 'react'
import { Heart } from 'lucide-react'

interface FavouriteButtonProps {
  mlsNumber: string
  address: string
  listPrice: number
  initialFavourited?: boolean
  className?: string
}

export function FavouriteButton({ mlsNumber, address, listPrice, initialFavourited = false, className = '' }: FavouriteButtonProps) {
  const [favourited, setFavourited] = useState(initialFavourited)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/favourites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mlsNumber,
          address,
          listPrice: String(listPrice),
        }),
      })
      if (res.ok) {
        const data = await res.json() as { favourited: boolean }
        setFavourited(data.favourited)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={(e) => { e.preventDefault(); void handleToggle() }}
      disabled={loading}
      aria-label={favourited ? 'Remove from favourites' : 'Add to favourites'}
      className={`rounded-full p-2 transition-colors ${
        favourited
          ? 'bg-red-50 text-red-500 hover:bg-red-100'
          : 'bg-white/80 text-secondary-400 hover:text-red-400 hover:bg-white'
      } ${className}`}
    >
      <Heart className={`h-5 w-5 ${favourited ? 'fill-current' : ''}`} />
    </button>
  )
}
