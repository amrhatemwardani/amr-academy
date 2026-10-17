'use client'

import React, { useState } from 'react'
import 'katex/dist/katex.min.css'
import katex from 'katex'

const FLOATING_FORMULAS = [
  { formula: 'E = m c^2', top: '8%', left: '4%', delay: '0s', class: 'animate-float-math' },
  { formula: '\\sum \\vec{F} = m \\vec{a}', top: '16%', right: '6%', delay: '1.2s', class: 'animate-float-math-alt' },
  { formula: '\\lambda = \\frac{v}{f}', top: '38%', left: '8%', delay: '2.5s', class: 'animate-float-math' },
  { formula: 'V = I \\cdot R', top: '48%', right: '10%', delay: '0.8s', class: 'animate-float-math-alt' },
  { formula: '\\int x^2 \\, dx = \\frac{x^3}{3} + C', top: '65%', left: '5%', delay: '1.8s', class: 'animate-float-math' },
  { formula: '\\Delta x \\cdot \\Delta p \\ge \\frac{\\hbar}{2}', top: '78%', right: '7%', delay: '2.1s', class: 'animate-float-math-alt' },
  { formula: 'F_g = G \\frac{m_1 m_2}{r^2}', top: '88%', left: '12%', delay: '3.0s', class: 'animate-float-math' },
]

export function PhysicsMathBackdrop() {
  const [appleBounces, setAppleBounces] = useState(0)

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none -z-10">
      {/* Soft Ambient Light Glows */}
      <div className="absolute top-1/4 start-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-amber-500/10 dark:bg-amber-400/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-2/3 end-10 w-[500px] h-[350px] bg-teal-500/10 dark:bg-teal-400/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Floating Equations with KaTeX */}
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
            className={`absolute hidden md:block text-slate-400/60 dark:text-slate-500/40 text-sm lg:text-base font-serif px-3 py-1.5 rounded-xl border border-slate-200/40 dark:border-slate-800/40 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[2px] shadow-sm ${item.class}`}
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

      {/* Interactive Funny Newton's Apple 🍎 */}
      <div
        className="pointer-events-auto absolute top-20 end-8 sm:end-20 cursor-pointer group"
        onClick={() => setAppleBounces((b) => b + 1)}
        title="اضغط على تفاحة نيوتن! 🍎"
      >
        <div className="relative flex flex-col items-center">
          <span className="text-3xl sm:text-4xl animate-bounce-apple transform transition-transform group-hover:scale-125 select-none drop-shadow-md">
            🍎
          </span>
          <span className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800 shadow-sm pointer-events-none">
            {appleBounces === 0 ? 'جاذبية نيوتن!' : `وقعت ${appleBounces} مرة! 😄`}
          </span>
        </div>
      </div>
    </div>
  )
}
