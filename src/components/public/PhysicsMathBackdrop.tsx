'use client'

import React from 'react'
import 'katex/dist/katex.min.css'
import katex from 'katex'

const FLOATING_FORMULAS = [
  { formula: 'E = m c^2', top: '10%', left: '5%', delay: '0s', class: 'animate-float-math' },
  { formula: '\\sum \\vec{F} = m \\vec{a}', top: '22%', right: '8%', delay: '1.2s', class: 'animate-float-math-alt' },
  { formula: '\\lambda = \\frac{v}{f}', top: '38%', left: '7%', delay: '2.5s', class: 'animate-float-math' },
  { formula: 'V = I \\cdot R', top: '52%', right: '6%', delay: '0.8s', class: 'animate-float-math-alt' },
  { formula: '\\int x^2 \\, dx = \\frac{x^3}{3} + C', top: '68%', left: '6%', delay: '1.8s', class: 'animate-float-math' },
  { formula: 'F_g = G \\frac{m_1 m_2}{r^2}', top: '84%', right: '10%', delay: '3.0s', class: 'animate-float-math' },
]

export function PhysicsMathBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none -z-10">
      {/* GitHub-style Subtle Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#d0d7de_1px,transparent_1px)] dark:bg-[radial-gradient(#30363d_1px,transparent_1px)] [background-size:24px_24px] opacity-35 dark:opacity-25" />

      {/* Floating Equations with KaTeX (Background Only) */}
      {FLOATING_FORMULAS.map((item, idx) => {
        let renderedHtml = ''
        try {
          renderedHtml = katex.renderToString(item.formula, { throwOnError: false, displayMode: false })
        } catch {
          renderedHtml = item.formula
        }

        return (
          <div
            key={idx}
            className={`absolute hidden lg:block text-slate-400/40 dark:text-slate-500/25 text-xs lg:text-sm font-serif px-2.5 py-1 rounded-md border border-border/40 bg-card/30 backdrop-blur-[1px] ${item.class}`}
            style={{
              top: item.top,
              left: (item as any).left,
              right: (item as any).right,
              animationDelay: item.delay,
            }}
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        )
      })}
    </div>
  )
}
