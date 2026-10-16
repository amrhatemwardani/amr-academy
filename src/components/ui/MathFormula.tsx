'use client'

import { useEffect, useRef } from 'react'
import katex from 'katex'

interface MathFormulaProps {
  math?: string
  children?: string
  block?: boolean
  className?: string
}

export function MathFormula({
  math,
  children,
  block = false,
  className = '',
}: MathFormulaProps) {
  const containerRef = useRef<HTMLSpanElement>(null)
  const formula = math || children || ''

  useEffect(() => {
    if (containerRef.current && formula) {
      try {
        katex.render(formula, containerRef.current, {
          displayMode: block,
          throwOnError: false,
        })
      } catch (err) {
        console.error('KaTeX render error:', err)
      }
    }
  }, [formula, block])

  return (
    <span
      ref={containerRef}
      className={`inline-block overflow-x-auto max-w-full align-middle ${className}`}
      dir="ltr"
    />
  )
}
