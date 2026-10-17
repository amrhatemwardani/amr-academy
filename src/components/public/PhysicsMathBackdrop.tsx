'use client'

import React from 'react'
import 'katex/dist/katex.min.css'
import katex from 'katex'

const FLOATING_FORMULAS = [
  { formula: 'E = m c^2', top: '8%', left: '4%', delay: '0s', color: 'bg-amber-100 text-amber-900 border-amber-300', class: 'animate-float-math' },
  { formula: '\\sum \\vec{F} = m \\vec{a}', top: '18%', right: '5%', delay: '1.2s', color: 'bg-blue-100 text-blue-900 border-blue-300', class: 'animate-float-math-alt' },
  { formula: '\\lambda = \\frac{v}{f}', top: '35%', left: '5%', delay: '2.5s', color: 'bg-pink-100 text-pink-900 border-pink-300', class: 'animate-float-math' },
  { formula: 'V = I \\cdot R', top: '48%', right: '4%', delay: '0.8s', color: 'bg-emerald-100 text-emerald-900 border-emerald-300', class: 'animate-float-math-alt' },
  { formula: 'p = m \\cdot v', top: '62%', left: '3%', delay: '1.8s', color: 'bg-purple-100 text-purple-900 border-purple-300', class: 'animate-float-math' },
  { formula: 'F_g = G \\frac{m_1 m_2}{r^2}', top: '78%', right: '6%', delay: '3.0s', color: 'bg-red-100 text-red-900 border-red-300', class: 'animate-float-math' },
  { formula: '\\Delta x = v_0 t + \\frac{1}{2} a t^2', top: '90%', left: '5%', delay: '1.5s', color: 'bg-indigo-100 text-indigo-900 border-indigo-300', class: 'animate-float-math-alt' },
]

export function PhysicsMathBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none -z-10">
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
            className={`absolute hidden md:inline-flex items-center gap-1.5 text-xs lg:text-sm font-serif px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-xs ${item.color} ${item.class}`}
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

      {/* Playful Floating Physics Icons */}
      {/* Newton's Bouncing Apple */}
      <div
        className="absolute hidden md:block top-[26%] left-[2%] text-2xl animate-bounce-apple"
        style={{ animationDuration: '4s' }}
        title="Newton's Apple"
      >
        🍎
      </div>

      {/* Orbiting / Spinning Atom */}
      <div
        className="absolute hidden md:block top-[42%] right-[3%] text-3xl animate-orbit-slow"
        title="Rutherford Atom"
      >
        ⚛️
      </div>

      {/* Floating Magnet */}
      <div
        className="absolute hidden md:block top-[70%] left-[2%] text-2xl animate-float-math"
        style={{ animationDelay: '2s' }}
        title="Magnetic Field"
      >
        🧲
      </div>

      {/* Rocket */}
      <div
        className="absolute hidden md:block top-[85%] right-[3%] text-3xl animate-float-math-alt"
        style={{ animationDelay: '1s' }}
        title="Momentum & Velocity"
      >
        🚀
      </div>
    </div>
  )
}
