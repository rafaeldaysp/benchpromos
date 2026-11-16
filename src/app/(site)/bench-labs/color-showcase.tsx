'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { DemoFrame } from './demo-frame'

const colors = [
  { id: '', label: 'Bench', swatch: '#ffe500' },
  { id: 'claro', label: 'Claro', swatch: '#f5f3f8' },
  { id: 'grafite', label: 'Grafite', swatch: '#8b8e97' },
  { id: 'meianoite', label: 'Meia-noite', swatch: '#3ee6ff' },
  { id: 'pista', label: 'Pista', swatch: '#ff2e2e' },
]

export function ColorShowcase() {
  const [color, setColor] = React.useState('pista')
  return (
    <div className="min-w-0">
      <div
        role="group"
        aria-label="Cor da demonstração"
        className="mb-4 flex flex-wrap gap-2"
      >
        {colors.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={color === option.id}
            onClick={() => setColor(option.id)}
            className={cn(
              'inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-xs font-semibold ring-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white',
              color === option.id
                ? 'bg-white/10 text-white ring-white/40'
                : 'text-white/60 ring-white/10 hover:bg-white/5',
            )}
          >
            <span
              aria-hidden="true"
              className="size-3 rounded-full"
              style={{ backgroundColor: option.swatch }}
            />
            {option.label}
          </button>
        ))}
      </div>
      <DemoFrame
        view="inicio"
        title="Bench Labs com a sua cor"
        detail="sensores"
        color={color}
        height={640}
      />
    </div>
  )
}
