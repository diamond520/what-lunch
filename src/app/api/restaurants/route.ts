import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { DEFAULT_RESTAURANTS, DEFAULT_WEEKEND_RESTAURANTS } from '@/lib/restaurants'
import type { Restaurant } from '@/lib/types'

const redis = new Redis({
  url: process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? '',
  token: process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
})

const KEY_WEEKDAY = 'restaurants:weekday'
const KEY_WEEKEND = 'restaurants:weekend'

// Collect all valid edit tokens from env vars matching EDIT_TOKEN or EDIT_TOKEN_*
// so the team can have multiple shared passwords without code changes.
function getValidTokens(): string[] {
  return Object.entries(process.env)
    .filter(([k, v]) => /^EDIT_TOKEN(_.+)?$/.test(k) && typeof v === 'string' && v.length > 0)
    .map(([, v]) => v as string)
}

function isAuthorized(req: Request): boolean {
  const auth = req.headers.get('authorization') ?? ''
  const match = auth.match(/^Bearer (.+)$/)
  if (!match) return false
  const provided = match[1]
  const valid = getValidTokens()
  if (valid.length === 0) return false
  return valid.some((t) => t === provided)
}

function isValidRestaurant(r: unknown): r is Restaurant {
  if (typeof r !== 'object' || r === null) return false
  const o = r as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.type === 'string' &&
    typeof o.price === 'number' &&
    typeof o.distance === 'number' &&
    typeof o.rating === 'number'
  )
}

export async function GET() {
  try {
    let weekday = await redis.get<Restaurant[]>(KEY_WEEKDAY)
    let weekend = await redis.get<Restaurant[]>(KEY_WEEKEND)

    if (!weekday) {
      weekday = DEFAULT_RESTAURANTS as Restaurant[]
      await redis.set(KEY_WEEKDAY, weekday)
    }
    if (!weekend) {
      weekend = DEFAULT_WEEKEND_RESTAURANTS as Restaurant[]
      await redis.set(KEY_WEEKEND, weekend)
    }

    return NextResponse.json({ weekday, weekend })
  } catch {
    return NextResponse.json({ error: 'Storage unavailable' }, { status: 503 })
  }
}

export async function PUT(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as
    | { kind?: unknown; restaurants?: unknown }
    | null
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { kind, restaurants } = body
  if (kind !== 'weekday' && kind !== 'weekend') {
    return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
  }
  if (!Array.isArray(restaurants) || !restaurants.every(isValidRestaurant)) {
    return NextResponse.json({ error: 'Invalid restaurants' }, { status: 400 })
  }

  try {
    const key = kind === 'weekday' ? KEY_WEEKDAY : KEY_WEEKEND
    await redis.set(key, restaurants)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Storage unavailable' }, { status: 503 })
  }
}
