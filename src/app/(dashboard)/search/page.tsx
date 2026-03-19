// src/app/(dashboard)/search/page.tsx
// Auth-gated search page — proxy.ts protects all /(dashboard)/* routes via Clerk
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import SearchClient from './SearchClient'

export const metadata = {
  title: 'Search Properties | Ease',
}

export default async function SearchPage() {
  // Explicit auth check — belt and suspenders with proxy.ts middleware
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="border-b border-secondary-100 bg-white px-6 py-4">
        <h1 className="font-display text-2xl font-bold text-secondary-900">Search Properties</h1>
        <p className="mt-1 text-sm text-secondary-500">
          Live MLS data — Toronto area properties. Data provided under VOW agreement.
        </p>
      </div>
      <Suspense fallback={<div className="flex flex-1 items-center justify-center text-secondary-400">Loading...</div>}>
        <SearchClient />
      </Suspense>
    </div>
  )
}
