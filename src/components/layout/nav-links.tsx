'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: '今日推薦' },
  { href: '/restaurants', label: '餐廳管理' },
  { href: '/weekend', label: '假日推薦' },
] as const

export function NavLinks() {
  const pathname = usePathname() ?? '/'

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {NAV_ITEMS.map(({ href, label }) => (
          <NavigationMenuItem key={href}>
            <NavigationMenuLink
              asChild
              className={cn(
                navigationMenuTriggerStyle(),
                pathname === href && 'bg-accent text-accent-foreground',
              )}
            >
              <Link href={href}>{label}</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
