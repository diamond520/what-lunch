// Google Maps "search by query" URL — opens Maps with the restaurant name
// as a search term. No API key needed, no auth, no rate limit. The user
// sees results just like they typed it into Maps themselves.
export function getGoogleMapsSearchUrl(name: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`
}
