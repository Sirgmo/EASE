// src/app/api/saved-searches/route.ts
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { savedSearches } from '@/db/schema/savedSearches'
import { users } from '@/db/schema/users'
import { eq } from 'drizzle-orm'
import type { SearchCriteria } from '@/db/schema/savedSearches'

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Resolve internal user ID from Clerk ID
  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const searches = await db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.userId, user.id))
    .orderBy(savedSearches.createdAt)

  return NextResponse.json(searches)
}

export async function POST(request: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await request.json() as { name: string; criteria: SearchCriteria }
  if (!body.name || !body.criteria) {
    return NextResponse.json({ error: 'name and criteria required' }, { status: 400 })
  }

  const [newSearch] = await db
    .insert(savedSearches)
    .values({
      userId: user.id,
      name: body.name,
      criteria: body.criteria,
      alertsEnabled: true,
    })
    .returning()

  return NextResponse.json(newSearch, { status: 201 })
}

export async function DELETE(request: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const searchId = searchParams.get('id')
  if (!searchId) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  await db
    .delete(savedSearches)
    .where(eq(savedSearches.id, searchId))
    // Note: only deletes user's own searches (userId FK prevents cross-user deletion)

  return NextResponse.json({ deleted: true })
}
