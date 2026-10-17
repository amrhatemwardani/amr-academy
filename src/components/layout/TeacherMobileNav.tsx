'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  ShieldCheck,
  Menu,
  X,
  BookOpen,
  Calendar,
  CreditCard,
  FileText,
  ClipboardList,
  BookMarked,
  HelpCircle,
  Trophy,
  Award,
  MessageSquare,
  BarChart3,
  Settings,
  UserPlus,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import { LogoutButton } from '@/components/ui/LogoutButton'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { LocaleToggle } from '@/components/ui/locale-toggle'

export function TeacherMobileNav() {
  const locale = useLocale()
  const pathname = usePathname()
  const isAr = locale === 'ar'

  const [drawerOpen, setDrawerOpen] = useState(false)

  const quickNav = [
    { href: `/${locale}/dashboard`, label: isAr ? 'الرئيسية' : 'Home', icon: LayoutDashboard },
    { href: `/${locale}/students`, label: isAr ? 'الطلاب' : 'Students', icon: Users },
    { href: `/${locale}/attendance`, label: isAr ? 'الحضور' : 'Attendance', icon: CalendarCheck },
    { href: `/${locale}/login-audit`, label: isAr ? 'الأمان' : 'Security', icon: ShieldCheck },
  ]

  const allSections = [
    { href: `/${locale}/dashboard`, label: isAr ? 'لوحة التحكم' : 'Dashboard', icon: LayoutDashboard },
    { href: `/${locale}/applications`, label: isAr ? 'طلبات الالتحاق' : 'Applications', icon: UserPlus },
    { href: `/${locale}/students`, label: isAr ? 'إدارة الطلاب' : 'Students', icon: Users },
    { href: `/${locale}/login-audit`, label: isAr ? 'بيانات الدخول وسجل الأمان' : 'Login & Security', icon: ShieldCheck, badge: 'New' },
    { href: `/${locale}/classes`, label: isAr ? 'الفصول والمجموعات' : 'Classes', icon: BookOpen },
    { href: `/${locale}/attendance`, label: isAr ? 'سجل الحضور والغياب' : 'Attendance', icon: CalendarCheck },
    { href: `/${locale}/calendar`, label: isAr ? 'التقويم وجدول الحصص' : 'Calendar', icon: Calendar },
    { href: `/${locale}/finance`, label: isAr ? 'المصروفات والمالية' : 'Finance', icon: CreditCard },
    { href: `/${locale}/exams`, label: isAr ? 'بنك الامتحانات والنتائج' : 'Exams', icon: FileText },
    { href: `/${locale}/assignments`, label: isAr ? 'الواجبات والتسليمات' : 'Assignments', icon: ClipboardList },
    { href: `/${locale}/materials`, label: isAr ? 'المذكرات والمواد الدراسية' : 'Materials', icon: BookMarked },
    { href: `/${locale}/question-bank`, label: isAr ? 'بنك الأسئلة' : 'Question Bank', icon: HelpCircle },
    { href: `/${locale}/leaderboard`, label: isAr ? 'لوحة الشرف والأوائل' : 'Leaderboard', icon: Trophy },
    { href: `/${locale}/certificates`, label: isAr ? 'شهادات التقدير' : 'Certificates', icon: Award },
    { href: `/${locale}/messages`, label: isAr ? 'المحادثات والرسائل' : 'Messages', icon: MessageSquare },
    { href: `/${locale}/reports`, label: isAr ? 'التقارير والإحصائيات' : 'Reports', icon: BarChart3 },
    { href: `/${locale}/settings`, label: isAr ? 'الإعدادات العامة' : 'Settings', icon: Settings },
  ]

  const Chevron = isAr ? ChevronLeft : ChevronRight

  return (
    <>
      {/* ── Fixed Mobile Bottom Bar (Phones: < md) ─────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 start-0 end-0 z-40 border-t border-border bg-background/95 dark:bg-[#0c111c]/95 backdrop-blur-md shadow-lg pb-safe">
        <ul className="grid grid-cols-5 h-16">
          {quickNav.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== `/${locale}/dashboard` && pathname.startsWith(href))
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex flex-col items-center justify-center h-full gap-0.5 text-[10px] font-bold transition-all',
                    isActive
                      ? 'text-primary font-black'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <div className={cn(
                    'p-1.5 rounded-xl transition-all',
                    isActive && 'bg-primary/10 text-primary scale-110 shadow-xs'
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="truncate max-w-[4rem]">{label}</span>
                </Link>
              </li>
            )
          })}

          {/* Menu Button (Toggles full drawer) */}
          <li>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full gap-0.5 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-all',
                drawerOpen && 'text-primary font-black'
              )}
            >
              <div className="p-1.5 rounded-xl bg-muted/60">
                <Menu className="h-4 w-4" />
              </div>
              <span>{isAr ? 'القائمة' : 'Menu'}</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* ── Full Mobile / iPad Slide-Over Drawer ───────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex animate-fade-in"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className={cn(
              'relative w-full max-w-xs sm:max-w-sm h-full bg-background border-e border-border shadow-2xl flex flex-col justify-between overflow-hidden',
              isAr ? 'ms-auto' : 'me-auto'
            )}
            onClick={(e) => e.stopPropagation()}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-black shadow-xs">
                  ⚡
                </div>
                <div>
                  <h3 className="font-black text-sm text-foreground">
                    {isAr ? 'أكاديمية م. عمرو حاتم' : 'Amr Hatem Academy'}
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-semibold">
                    {isAr ? 'منصة المعلم الذكية' : 'Teacher Portal'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="px-4 py-2.5 border-b border-border bg-muted/10 flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground">
                {isAr ? 'تفضيلات العرض' : 'Preferences'}
              </span>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <LocaleToggle />
              </div>
            </div>

            {/* Nav Links Scroll Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
              {allSections.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== `/${locale}/dashboard` && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      'flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                        isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-primary'
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span className={cn(
                          'text-[9px] font-black px-1.5 py-0.2 rounded-full',
                          isActive ? 'bg-white text-primary' : 'bg-amber-500/10 text-amber-600'
                        )}>
                          {item.badge}
                        </span>
                      )}
                      <Chevron className={cn('h-3.5 w-3.5 opacity-60', isActive && 'opacity-100')} />
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Drawer Footer with Logout */}
            <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold">
                {isAr ? 'تسجيل الخروج' : 'Log out'}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
