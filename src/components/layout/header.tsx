'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { NavLinks, NAV_ITEMS } from './nav-links'
import { ThemeToggle } from './theme-toggle'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Auto-close sheet on navigation
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-screen-2xl items-center px-3 sm:px-4">
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden"
          onClick={() => setOpen(true)}
          aria-label="開啟選單"
        >
          <Menu className="size-5" />
        </Button>

        <span className="mr-6 font-semibold text-foreground">What Lunch?</span>
        <NavLinks />
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile nav sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64">
          <SheetHeader>
            <SheetTitle>What Lunch?</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-4">
            {NAV_ITEMS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  pathname === href && 'bg-accent text-accent-foreground',
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}
