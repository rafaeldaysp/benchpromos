'use client'

import { Expand, FlaskConical } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export type DemoView =
  | 'inicio'
  | 'testes'
  | 'ficha'
  | 'monitor'
  | 'preparo'
  | 'bateria'

type DemoFrameProps = {
  view: DemoView
  title: string
  theme?: 'raiox' | 'painel' | 'bento'
  color?: string
  detail?: 'sensores' | 'tela' | 'laudo'
  height?: number
  width?: number
  className?: string
  preview?: boolean
}

export function DemoFrame({
  view,
  title,
  theme = 'raiox',
  color = '',
  detail,
  height = 820,
  width = 1280,
  className,
  preview = false,
}: DemoFrameProps) {
  const container = React.useRef<HTMLDivElement>(null)
  const dialogFrame = React.useRef<HTMLIFrameElement>(null)
  const [containerWidth, setContainerWidth] = React.useState(0)
  const [nearViewport, setNearViewport] = React.useState(false)
  const [expanded, setExpanded] = React.useState(false)
  const [loadedSource, setLoadedSource] = React.useState('')
  const params = new URLSearchParams({
    aba: view,
    fixo: '1',
    trilho: '0',
    tema: theme,
  })
  if (color) params.set('cor', color)
  if (detail) params.set('bloco', detail)
  const src = `/bench-labs/app/inicio.html?${params}`
  const canvasWidth = Math.max(containerWidth, width)
  const scale = containerWidth ? Math.min(1, containerWidth / canvasWidth) : 1

  React.useEffect(() => {
    const element = container.current
    if (!element) return
    const resize = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    resize.observe(element)
    // Offscreen demos are removed so their sensor timers stop running.
    const visibility = new IntersectionObserver(
      ([entry]) => setNearViewport(entry.isIntersecting),
      { rootMargin: '400px' },
    )
    visibility.observe(element)
    return () => {
      resize.disconnect()
      visibility.disconnect()
    }
  }, [])

  React.useEffect(() => {
    if (!expanded) return
    const closeFromFrame = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.source === dialogFrame.current?.contentWindow &&
        event.data?.type === 'bench-demo:escape'
      )
        setExpanded(false)
    }
    window.addEventListener('message', closeFromFrame)
    return () => window.removeEventListener('message', closeFromFrame)
  }, [expanded])

  return (
    <Dialog open={expanded} onOpenChange={setExpanded}>
      <div
        className={cn(
          'min-w-0 overflow-hidden rounded-2xl bg-[#120b1c] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] ring-1 ring-white/10',
          className,
        )}
      >
        {!preview && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
            <span className="flex items-center gap-2 text-xs text-white/60">
              <FlaskConical
                className="size-3.5 text-[#ffe01b]"
                aria-hidden="true"
              />
              Demonstração · dados fictícios
            </span>
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffe01b]"
              >
                <Expand className="size-4" aria-hidden="true" />
                Ampliar demonstração
              </button>
            </DialogTrigger>
          </div>
        )}
        <div
          ref={container}
          className="relative overflow-hidden"
          style={{
            height: containerWidth ? height * scale : undefined,
            aspectRatio: containerWidth ? undefined : `${width} / ${height}`,
          }}
        >
          {nearViewport && containerWidth > 0 ? (
            <iframe
              key={src}
              src={src}
              title={title}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
              tabIndex={preview ? -1 : undefined}
              aria-hidden={preview || undefined}
              onLoad={() => setLoadedSource(src)}
              className={cn(
                'block origin-top-left border-0',
                preview && 'pointer-events-none',
              )}
              style={{
                width: canvasWidth,
                height,
                transform: `scale(${scale})`,
              }}
            />
          ) : null}
          {(!nearViewport || loadedSource !== src) && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#120b1c] text-xs text-white/50">
              {preview ? title : 'Carregando demonstração…'}
            </div>
          )}
        </div>
        {!preview && (
          <p className="border-t border-white/10 px-4 py-2 text-[11px] leading-relaxed text-white/45">
            Explore a interface. As leituras são simuladas; os testes do seu
            notebook rodam no aplicativo para Windows.
          </p>
        )}
      </div>
      {!preview && (
        <DialogContent className="flex h-dvh w-screen max-w-[1600px] flex-col gap-0 overflow-hidden border-white/10 bg-[#120b1c] p-0 text-white sm:h-[90dvh] sm:w-[calc(100%-2rem)] sm:rounded-2xl [&>button]:right-2 [&>button]:top-2 [&>button]:grid [&>button]:size-10 [&>button]:place-items-center">
          <div className="shrink-0 border-b border-white/10 px-5 py-4 pr-14">
            <DialogTitle className="text-left text-base leading-snug">
              {title}
            </DialogTitle>
            <DialogDescription className="mt-2 text-left text-xs text-white/60">
              Demonstração com dados fictícios. Em telas menores, deslize para
              explorar a interface.
            </DialogDescription>
          </div>
          <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
            {expanded && (
              <iframe
                ref={dialogFrame}
                src={src}
                title={`${title} — demonstração ampliada`}
                sandbox="allow-scripts allow-same-origin"
                className="mx-auto block h-full min-h-[420px] border-0"
                style={{
                  width: detail === 'tela' ? width : '100%',
                  minWidth: width,
                }}
              />
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
}
