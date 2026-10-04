'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'

export function LocaleToggle() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const toggleLocale = () => {
    const newLocale = locale === 'en' ? 'ar' : 'en'
    // Replace locale prefix in the current pathname
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
    router.push(newPath)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      aria-label={locale === 'en' ? 'Switch to Arabic' : 'Switch to English'}
      className="font-medium text-xs px-2.5 h-8"
    >
      {locale === 'en' ? 'عربي' : 'EN'}
    </Button>
  )
}
