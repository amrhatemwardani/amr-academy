'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarCheck,
  CreditCard,
  FileText,
  HelpCircle,
  BarChart3,
  Settings,
  MessageSquare,
  Trophy,
  Calendar,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  ClipboardList,
  BookMarked,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { LogoutButton } from '@/components/ui/LogoutButton'

const getNavItems = (locale: string) => [
  { href: `/${locale}/dashboard`,      labelKey: 'dashboard',    icon: LayoutDashboard },
  { href: `/${locale}/students`,       labelKey: 'students',     icon: Users },
  { href: `/${locale}/classes`,        labelKey: 'classes',      icon: BookOpen },
  { href: `/${locale}/attendance`,     labelKey: 'attendance',   icon: CalendarCheck },
  { href: `/${locale}/calendar`,       labelKey: 'calendar',     icon: Calendar },
  { href: `/${locale}/finance`,        labelKey: 'finance',      icon: CreditCard },
  { href: `/${locale}/exams`,          labelKey: 'exams',        icon: FileText },
  { href: `/${locale}/assignments`,    labelKey: 'assignments',  icon: ClipboardList },
  { href: `/${locale}/materials`,      labelKey: 'materials',    icon: BookMarked },
  { href: `/${locale}/question-bank`,  labelKey: 'questionBank', icon: HelpCircle },
  { href: `/${locale}/leaderboard`,    labelKey: 'leaderboard',  icon: Trophy },
  { href: `/${locale}/messages`,       labelKey: 'messages',     icon: MessageSquare },
  { href: `/${locale}/reports`,        labelKey: 'reports',      icon: BarChart3 },
  { href: `/${locale}/settings`,       labelKey: 'settings',     icon: Settings },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const isRtl = locale === 'ar'

  const [collapsed, setCollapsed] = useState(false)

  // Persist sidebar state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) setCollapsed(saved === 'true')
  }, [])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  const navItems = getNavItems(locale)

  const CollapseIcon = isRtl
    ? collapsed ? ChevronLeft : ChevronRight
    : collapsed ? ChevronRight : ChevronLeft

  return (
    <aside
      className={cn(
        'sidebar flex flex-col bg-sidebar border-e border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Logo / Brand */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-sidebar-border',
        collapsed && 'justify-center px-2'
      )}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/20">
          <GraduationCap className="h-5 w-5 text-primary" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-sidebar-foreground truncate">م. عمرو حاتم</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">Eng. Amr Hatem Academy</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin">
        <ul className="space-y-0.5">
          {navItems.map(({ href, labelKey, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'nav-link',
                    isActive && 'active',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? t(labelKey as Parameters<typeof t>[0]) : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <span className="truncate">
                      {t(labelKey as Parameters<typeof t>[0])}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Collapse toggle and Logout */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        <LogoutButton showText={!collapsed} collapsed={collapsed} />
        <button
          onClick={toggleCollapsed}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-sidebar-foreground/60',
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-150',
            collapsed && 'justify-center px-2'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <CollapseIcon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{collapsed ? 'Expand' : 'Collapse'}</span>}
        </button>
      </div>
    </aside>
  )
}
