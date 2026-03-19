// src/app/api/favourites/route.ts
// Toggle favourite: adds row if not favourited, removes if already favourited
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { favourites } from '@/db/schema/favourites'
import { users } from '@/db/schema/users'
import { eq, and } from 'drizzle-orm'

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const userFavourites = await db
    .select()
    .from(favourites)
    .where(eq(favourites.userId, user.id))

  return NextResponse.json(userFavourites)
}

export async function POST(request: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await request.json() as { mlsNumber: string; address: string; listPrice: string }
  if (!body.mlsNumber || !body.address || !body.listPrice) {
    return NextResponse.json({ error: 'mlsNumber, address, listPrice required' }, { status: 400 })
  }

  // Toggle: check if already favourited
  const [existing] = await db
    .select()
    .from(favourites)
    .where(
      and(
        eq(favourites.userId, user.id),
        eq(favourites.mlsNumber, body.mlsNumber)
      )
    )
    .limit(1)

  if (existing) {
    // Remove favourite (toggle off)
    await db.delete(favourites).where(eq(favourites.id, existing.id))
    return NextResponse.json({ favourited: false })
  }

  // Add favourite (toggle on)
  const [newFav] = await db
    .insert(favourites)
    .values({
      userId: user.id,
      mlsNumber: body.mlsNumber,
      address: body.address,
      listPrice: body.listPrice,
    })
    .returning()

  return NextResponse.json({ favourited: true, favourite: newFav }, { status: 201 })
}
