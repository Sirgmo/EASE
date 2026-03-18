import { auth } from '@clerk/nextjs/server'
import { UserButton } from '@clerk/nextjs'

export default async function DashboardPage() {
  // auth() confirms the user is authenticated (proxy.ts enforces this, but call it here
  // so the page explicitly declares its auth dependency — easier to trace in code review)
  const { userId } = await auth()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ease Dashboard</h1>
        <UserButton />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-muted-foreground">
          Welcome. Your transaction journey will appear here.
        </p>
        <p className="text-xs text-muted-foreground font-mono">
          Authenticated as: {userId}
        </p>
      </main>
    </div>
  )
}
