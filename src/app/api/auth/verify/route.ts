import { NextResponse } from 'next/server'
import { isAuthorized } from '@/lib/api-auth'

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ ok: true })
}
