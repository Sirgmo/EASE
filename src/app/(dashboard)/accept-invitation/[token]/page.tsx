import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import AcceptInvitationClient from './AcceptInvitationClient'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function AcceptInvitationPage({ params }: PageProps) {
  const { token } = await params
  const { userId } = await auth()

  if (!userId) {
    redirect(`/sign-in?redirect_url=/accept-invitation/${token}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md w-full">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Transaction Invitation
        </h1>
        <p className="text-gray-600 mb-6">
          You have been invited to join a real estate transaction on Ease.
          Click Accept to gain access to the transaction documents and dashboard.
        </p>
        <AcceptInvitationClient token={token} />
      </div>
    </div>
  )
}
