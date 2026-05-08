// Server-only auth helpers for the restaurant management API.
// Any env var matching EDIT_TOKEN or EDIT_TOKEN_* is treated as a valid
// shared password — lets the team add/rotate passwords without code changes.

export function getValidTokens(): string[] {
  return Object.entries(process.env)
    .filter(([k, v]) => /^EDIT_TOKEN(_.+)?$/.test(k) && typeof v === 'string' && v.length > 0)
    .map(([, v]) => v as string)
}

export function isAuthorized(req: Request): boolean {
  const auth = req.headers.get('authorization') ?? ''
  const match = auth.match(/^Bearer (.+)$/)
  if (!match) return false
  const provided = match[1]
  const valid = getValidTokens()
  if (valid.length === 0) return false
  return valid.some((t) => t === provided)
}
