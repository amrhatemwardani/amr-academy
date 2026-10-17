'use client'

import React from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface MathTextProps {
  text?: string | null
  children?: string | null
  className?: string
  block?: boolean
}

export function MathText({ text, children, className = '', block = false }: MathTextProps) {
  const content = text ?? children ?? ''
  if (!content) return null

  // 1. If text contains $...$ or $$...$$ delimiters
  const hasDollarMath = /(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/.test(content)
  if (hasDollarMath) {
    const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g)
    return (
      <span className={className}>
        {parts.map((part, idx) => {
          if (part.startsWith('$$') && part.endsWith('$$')) {
            const math = part.slice(2, -2)
            try {
              const html = katex.renderToString(math, { displayMode: true, throwOnError: false })
              return (
                <span
                  key={idx}
                  className="block my-2 overflow-x-auto text-center"
                  dir="ltr"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              )
            } catch {
              return <span key={idx}>{part}</span>
            }
          }
          if (part.startsWith('$') && part.endsWith('$')) {
            const math = part.slice(1, -1)
            try {
              const html = katex.renderToString(math, { displayMode: false, throwOnError: false })
              return (
                <span
                  key={idx}
                  className="inline-block mx-0.5 overflow-x-auto align-middle"
                  dir="ltr"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              )
            } catch {
              return <span key={idx}>{part}</span>
            }
          }
          return <span key={idx}>{part}</span>
        })}
      </span>
    )
  }

  // 2. If entire content contains LaTeX commands (\frac, \sqrt, \theta, \int, etc.)
  if (/(\\[a-zA-Z]+|\^|\_)/.test(content)) {
    try {
      const html = katex.renderToString(content, { displayMode: block, throwOnError: false })
      return (
        <span
          className={`inline-block overflow-x-auto align-middle ${className}`}
          dir="ltr"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )
    } catch {
      return <span className={className}>{content}</span>
    }
  }

  // 3. Fallback to normal text
  return <span className={className}>{content}</span>
}
