import Link from 'next/link'
import { Show, UserButton } from '@clerk/nextjs'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Ease</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Real estate transactions, step-by-step — no agent required.
        </p>
      </div>

      <div className="flex gap-4">
        <Show when="signed-out">
          <Link
            href="/sign-in"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Create account
          </Link>
        </Show>

        <Show when="signed-in">
          <Link
            href="/dashboard"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to dashboard
          </Link>
          <UserButton />
        </Show>
      </div>
    </main>
  )
}
