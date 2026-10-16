'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface BrandedLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
  showText?: boolean
}

export function BrandedLoader({
  size = 'md',
  text,
  className,
  showText = true,
}: BrandedLoaderProps) {
  const dimensions = {
    sm: { box: 'h-12 w-12', logo: 24, orbit: 48 },
    md: { box: 'h-20 w-20', logo: 36, orbit: 80 },
    lg: { box: 'h-28 w-28', logo: 52, orbit: 112 },
  }[size]

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 p-4', className)}>
      <div className={cn('relative flex items-center justify-center', dimensions.box)}>
        {/* Animated Orbits (Physics Atom) */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '6s' }}>
          <div className="h-full w-full rounded-full border border-dashed border-[#14A3A3]/60" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse' }}>
          <div className="h-full w-full rounded-full border border-[#F2B134]/50 [transform:rotateX(60deg)_rotateY(30deg)]" />
        </div>

        {/* Center Logo Icon */}
        <div className="relative z-10 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm p-1 shadow-sm">
          <Image
            src="/logo-icon.svg"
            alt="Loading..."
            width={dimensions.logo}
            height={dimensions.logo}
            className="animate-pulse"
          />
        </div>
      </div>

      {showText && (
        <p className="text-xs font-semibold text-muted-foreground animate-pulse tracking-wide">
          {text || 'جاري التحميل...'}
        </p>
      )}
    </div>
  )
}
