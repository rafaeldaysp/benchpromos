'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const sections = [
  { id: 'monitor', label: 'Ao vivo' },
  { id: 'testes', label: 'Testes' },
  { id: 'bench-monitor', label: 'Bench Monitor' },
  { id: 'bateria', label: 'Bateria' },
  { id: 'personalizacao', label: 'Personalização' },
  { id: 'atualizacoes', label: 'Atualizações' },
  { id: 'como-usar', label: 'Como usar' },
  { id: 'duvidas', label: 'Dúvidas' },
]

export function SectionNav() {
  const [active, setActive] = React.useState('monitor')
  const nav = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    let frame = 0
    const update = () => {
      let current = sections[0].id
      for (const section of sections) {
        const element = document.getElementById(section.id)
        if (element && element.getBoundingClientRect().top <= 160)
          current = section.id
      }
      setActive(current)
      frame = 0
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  React.useEffect(() => {
    const link = nav.current?.querySelector<HTMLAnchorElement>(
      `[href="#${active}"]`,
    )
    if (link && nav.current) {
      const left =
        link.offsetLeft - nav.current.clientWidth / 2 + link.offsetWidth / 2
      nav.current.scrollTo({ left, behavior: 'auto' })
    }
  }, [active])

  return (
    <div className="sticky top-[60px] z-30 border-y border-white/10 bg-[#0f0b16]/95 backdrop-blur-sm">
      <div className="container max-sm:px-4">
        <nav
          ref={nav}
          aria-label="Seções do Bench Labs"
          className="relative flex gap-1 overflow-x-auto py-2"
        >
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={active === section.id ? 'location' : undefined}
              className={cn(
                'inline-flex min-h-10 shrink-0 items-center rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#ffe01b]',
                active === section.id
                  ? 'bg-[#ffe01b]/10 text-[#ffe01b]'
                  : 'text-white/60 hover:bg-white/5 hover:text-white',
              )}
              onClick={(event) => {
                if (
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return
                const target = document.getElementById(section.id)
                if (!target) return
                event.preventDefault()
                history.replaceState(null, '', `#${section.id}`)
                target.scrollIntoView({
                  behavior: matchMedia('(prefers-reduced-motion: reduce)')
                    .matches
                    ? 'auto'
                    : 'smooth',
                  block: 'start',
                })
              }}
            >
              {section.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}
