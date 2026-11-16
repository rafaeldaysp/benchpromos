'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
import { DemoFrame } from './demo-frame'

const themes: {
  id: string
  label: string
  caption: string
  theme: 'raiox' | 'painel' | 'bento'
}[] = [
  {
    id: 'raio-x',
    label: 'Raio-X',
    caption:
      'Um desenho do seu notebook por dentro: as ventoinhas giram mais rápido conforme o consumo e cada componente muda de cor com a temperatura.',
    theme: 'raiox',
  },
  {
    id: 'painel',
    label: 'Painel',
    caption:
      'Mostradores no estilo painel de carro para processador, consumo e placa de vídeo, com faixa vermelha acima de 90 °C.',
    theme: 'painel',
  },
  {
    id: 'blocos',
    label: 'Blocos',
    caption:
      'Todos os números lado a lado, com gráficos dos últimos 60 segundos, o laudo de saúde e o checklist antes de testar.',
    theme: 'bento',
  },
]

export function MonitorShowcase() {
  const [activeId, setActiveId] = React.useState(themes[1].id)
  const active = themes.find((theme) => theme.id === activeId) ?? themes[0]

  return (
    <div>
      <div className="flex flex-col items-center gap-4">
        <div
          role="tablist"
          aria-label="Temas do monitor"
          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1"
        >
          <span className="px-3 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
            Tema
          </span>
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              role="tab"
              aria-selected={theme.id === active.id}
              aria-controls="bench-labs-monitor-panel"
              onClick={() => setActiveId(theme.id)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-semibold transition-[background-color,color,transform] active:scale-[0.96]',
                theme.id === active.id
                  ? 'bg-white text-[#120d1a]'
                  : 'text-white/70 hover:text-white',
              )}
            >
              {theme.label}
            </button>
          ))}
        </div>
        <p
          aria-live="polite"
          className="min-h-12 max-w-xl text-pretty text-center text-sm text-white/60"
        >
          {active.caption}
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)]">
        <div
          id="bench-labs-monitor-panel"
          role="tabpanel"
          className="min-w-0 self-start"
        >
          <DemoFrame
            view="inicio"
            theme={active.theme}
            title={`Monitor do Bench Labs no tema ${active.label}`}
            detail="sensores"
            height={640}
          />
        </div>
        <div
          role="group"
          aria-label="Prévia dos temas do monitor"
          className="grid grid-cols-3 gap-3 self-start lg:col-start-1 lg:row-start-1 lg:grid-cols-1"
        >
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              aria-label={`Ver tema ${theme.label}`}
              aria-pressed={theme.id === active.id}
              aria-controls="bench-labs-monitor-panel"
              onClick={() => setActiveId(theme.id)}
              className={cn(
                'min-w-0 overflow-hidden rounded-xl bg-[#16111f] p-1.5 text-left ring-2 transition-[background-color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#0f0b16] active:scale-[0.96]',
                theme.id === active.id
                  ? 'bg-[#ffe01b]/10 ring-[#ffe01b]'
                  : 'ring-transparent hover:bg-white/[0.06] hover:ring-white/30',
              )}
            >
              <DemoFrame
                view="inicio"
                theme={theme.theme}
                title={theme.label}
                detail="sensores"
                height={640}
                preview
              />
              <span
                className={cn(
                  'block px-1 py-2 text-xs font-semibold sm:text-sm',
                  theme.id === active.id ? 'text-[#ffe01b]' : 'text-white/70',
                )}
              >
                {theme.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
