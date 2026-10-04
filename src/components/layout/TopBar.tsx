'use client'

import { Bell, Search, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { LocaleToggle } from '@/components/ui/locale-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { LogoutButton } from '@/components/ui/LogoutButton'
import Link from 'next/link'
import { useLocale } from 'next-intl'

interface TopBarProps {
  userName: string
  avatarUrl?: string | null
  unreadNotifications?: number
  role?: 'teacher' | 'student'
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function TopBar({
  userName,
  avatarUrl,
  unreadNotifications = 0,
  role = 'teacher',
}: TopBarProps) {
  const locale = useLocale()
  const notifHref = role === 'teacher'
    ? `/${locale}/notifications`
    : `/${locale}/portal/notifications`
  const msgHref = role === 'teacher'
    ? `/${locale}/messages`
    : `/${locale}/portal/messages`
  const profileHref = role === 'teacher'
    ? `/${locale}/settings`
    : `/${locale}/portal/profile`

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      {/* Search */}
      <div className="hidden md:flex flex-1 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="ps-9 h-8 text-sm bg-muted/50 border-transparent focus-visible:border-input focus-visible:bg-background"
            aria-label="Global search"
          />
        </div>
      </div>

      <div className="flex flex-1 md:flex-none items-center justify-end gap-1">
        {/* Messages */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Messages"
          asChild
        >
          <Link href={msgHref}>
            <MessageSquare className="h-4 w-4" />
          </Link>
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications ${unreadNotifications > 0 ? `(${unreadNotifications} unread)` : ''}`}
          asChild
        >
          <Link href={notifHref}>
            <Bell className="h-4 w-4" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-0.5 -end-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </Link>
        </Button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Locale toggle */}
        <LocaleToggle />

        {/* User avatar */}
        <Button variant="ghost" size="icon" className="ms-1" asChild>
          <Link href={profileHref} aria-label={`Profile: ${userName}`}>
            <Avatar className="h-7 w-7">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
              <AvatarFallback className="text-[10px]">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
          </Link>
        </Button>

        {/* Logout */}
        <LogoutButton className="ms-1" />
      </div>
    </header>
  )
}
