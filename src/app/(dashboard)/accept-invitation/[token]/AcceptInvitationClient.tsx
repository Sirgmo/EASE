'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AcceptInvitationClientProps {
  token: string
}

export default function AcceptInvitationClient({ token }: AcceptInvitationClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleAccept() {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
      })

      if (res.status === 409) {
        setError('This invitation has already been accepted.')
        return
      }
      if (res.status === 410) {
        setError('This invitation has expired. Please ask the transaction owner to send a new invitation.')
        return
      }
      if (res.status === 404) {
        setError('This invitation link is invalid.')
        return
      }
      if (!res.ok) {
        setError('Something went wrong. Please try again.')
        return
      }

      const data = await res.json() as { transactionId: string; role: string }
      router.push(`/transactions/${data.transactionId}`)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
      <button
        onClick={handleAccept}
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Accepting...' : 'Accept Invitation'}
      </button>
    </div>
  )
}
