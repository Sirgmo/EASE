// src/components/search/SaveSearchButton.tsx
'use client'
import { useState } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import type { SearchCriteria } from '@/db/schema/savedSearches'

interface SaveSearchButtonProps {
  criteria: SearchCriteria
  className?: string
}

export function SaveSearchButton({ criteria, className = '' }: SaveSearchButtonProps) {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showNameInput, setShowNameInput] = useState(false)
  const [name, setName] = useState('')

  const handleSave = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), criteria }),
      })
      if (res.ok) {
        setSaved(true)
        setShowNameInput(false)
      }
    } finally {
      setLoading(false)
    }
  }

  if (saved) {
    return (
      <div className={`flex items-center gap-2 text-sm text-green-600 ${className}`}>
        <BookmarkCheck className="h-4 w-4" />
        Search saved
      </div>
    )
  }

  if (showNameInput) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void handleSave()}
          placeholder="Name this search..."
          className="rounded-lg border border-secondary-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          onClick={() => void handleSave()}
          disabled={loading || !name.trim()}
          className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? '...' : 'Save'}
        </button>
        <button
          onClick={() => setShowNameInput(false)}
          className="rounded-lg border border-secondary-200 px-3 py-1.5 text-sm text-secondary-600 hover:bg-secondary-50"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowNameInput(true)}
      className={`flex items-center gap-2 rounded-lg border border-secondary-200 px-3 py-1.5 text-sm text-secondary-600 hover:bg-secondary-50 ${className}`}
    >
      <Bookmark className="h-4 w-4" />
      Save search
    </button>
  )
}
