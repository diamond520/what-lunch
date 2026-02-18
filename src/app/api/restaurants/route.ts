import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const RESTAURANTS_FILE = path.join(process.cwd(), 'src/lib/restaurants.ts')

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Only available in development mode' }, { status: 403 })
  }

  const { restaurant } = await request.json()
  if (!restaurant?.name || !restaurant?.type || restaurant?.price == null) {
    return NextResponse.json({ error: 'Invalid restaurant data' }, { status: 400 })
  }

  const content = await fs.readFile(RESTAURANTS_FILE, 'utf-8')

  // Check duplicate by name
  if (content.includes(`name: '${restaurant.name}'`)) {
    return NextResponse.json({ error: 'Already in config' }, { status: 409 })
  }

  // Find next id number
  const idMatches = [...content.matchAll(/id: 'id-(\d+)'/g)]
  const maxId = idMatches.length > 0 ? Math.max(...idMatches.map((m) => parseInt(m[1]))) : 0
  const newId = `id-${maxId + 1}`

  // Format new entry
  const padName = (s: string) => `'${s}'`.padEnd(20)
  const padType = (s: string) => `'${s}'`.padEnd(6)
  const entry = `  { id: '${newId}', name: ${padName(restaurant.name)}, type: ${padType(restaurant.type)}, price: ${restaurant.price}, distance: ${restaurant.distance}, rating: ${restaurant.rating} },`

  // Insert before `] satisfies Restaurant[]`
  const updated = content.replace(
    /\n\] satisfies Restaurant\[\]/,
    `\n${entry}\n] satisfies Restaurant[]`,
  )

  await fs.writeFile(RESTAURANTS_FILE, updated, 'utf-8')

  return NextResponse.json({ success: true, id: newId })
}
