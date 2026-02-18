import { NavLinks } from './nav-links'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-screen-2xl items-center px-4">
        <span className="mr-6 font-semibold text-foreground">What Lunch?</span>
        <NavLinks />
      </div>
    </header>
  )
}
