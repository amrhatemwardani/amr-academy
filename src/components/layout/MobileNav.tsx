'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  Home,
  BookOpen,
  BookMarked,
  TrendingUp,
  FileText,
  MessageSquare,
  ClipboardList,
} from 'lucide-react'

const getPortalNavItems = (locale: string) => [
  { href: `/${locale}/portal`,             labelKey: 'portal',        icon: Home },
  { href: `/${locale}/portal/classes`,     labelKey: 'myClasses',     icon: BookOpen },
  { href: `/${locale}/portal/tasks`,       labelKey: 'myTasks',       icon: ClipboardList },
  { href: `/${locale}/portal/resources`,   labelKey: 'myResources',   icon: BookMarked },
  { href: `/${locale}/portal/progress`,    labelKey: 'myProgress',    icon: TrendingUp },
  { href: `/${locale}/portal/exams`,       labelKey: 'myExams',       icon: FileText },
  { href: `/${locale}/portal/messages`,    labelKey: 'myMessages',    icon: MessageSquare },
]

export function MobileNav() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const navItems = getPortalNavItems(locale)

  return (
    <nav className="fixed bottom-0 start-0 end-0 z-30 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-safe">
      <ul className="grid grid-cols-7 h-16">
        {navItems.map(({ href, labelKey, icon: Icon }) => {
          const isActive = pathname === href || (href !== `/${locale}/portal` && pathname.startsWith(href))
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center h-full gap-0.5 text-[9px] font-medium transition-colors duration-150',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={cn('h-4 w-4 transition-transform duration-150', isActive && 'scale-110')} />
                <span className="leading-none truncate max-w-[3rem]">
                  {t(labelKey as Parameters<typeof t>[0])}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
