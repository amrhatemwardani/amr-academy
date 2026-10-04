'use client'

import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useState } from 'react'

interface LogoutButtonProps {
  showText?: boolean
  className?: string
  collapsed?: boolean
}

export function LogoutButton({
  showText = false,
  className = '',
  collapsed = false,
}: LogoutButtonProps) {
  const router = useRouter()
  const locale = useLocale()
  const [loading, setLoading] = useState(false)
  const isAr = locale === 'ar'
  const text = isAr ? 'تسجيل الخروج' : 'Log out'

  const handleLogout = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push(`/${locale}/login`)
      router.refresh()
    } catch (err) {
      console.error('Logout error:', err)
      window.location.href = `/${locale}/login`
    } finally {
      setLoading(false)
    }
  }

  if (showText && !collapsed) {
    return (
      <button
        onClick={handleLogout}
        disabled={loading}
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors duration-150 ${className}`}
        title={text}
        aria-label={text}
      >
        <LogOut className="h-4 w-4 shrink-0" />
        <span className="truncate">{text}</span>
      </button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleLogout}
      disabled={loading}
      className={`text-muted-foreground hover:text-destructive hover:bg-destructive/10 ${className}`}
      title={text}
      aria-label={text}
    >
      <LogOut className="h-4 w-4" />
    </Button>
  )
}
