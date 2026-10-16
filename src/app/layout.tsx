import type { Metadata } from 'next'
import { Inter, Cairo } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { NavigationProgressBar } from '@/components/layout/NavigationProgressBar'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Amr Academy – Student Management System',
    template: '%s | Amr Academy',
  },
  description:
    'Amr Academy Student Management System — Physics & Mathematics by Eng. Amr Hatem.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  ),
  icons: {
    icon: '/logo-icon.svg',
    shortcut: '/logo-icon.svg',
    apple: '/logo-icon.svg',
  },
  manifest: '/manifest.json',
  robots: {
    index: false, // private application
    follow: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html suppressHydrationWarning>
      <body className={`${inter.variable} ${cairo.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Global top progress bar on every page navigation */}
          <NavigationProgressBar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
