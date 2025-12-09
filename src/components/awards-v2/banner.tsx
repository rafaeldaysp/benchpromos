'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trophy, ChevronRight, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BenchAwardsBannerProps {
  dismissible?: boolean
  href?: string
}

export function BenchAwardsBanner({
  dismissible = true,
  href = '/bench-awards',
}: BenchAwardsBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Animated background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 size-40 animate-pulse rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 size-40 animate-pulse rounded-full bg-amber-400/15 blur-3xl delay-700" />
      </div>

      {/* Sparkle decorations */}
      {/* <Sparkles className="absolute left-[15%] top-3 size-4 animate-pulse text-amber-400/40" />
      <Sparkles className="absolute bottom-3 right-[20%] size-3 animate-pulse text-amber-300/30 delay-500" /> */}

      <div className="relative flex flex-col items-center justify-between gap-4 p-4 sm:flex-row sm:px-6 sm:py-3">
        {/* Left content */}
        <div className="flex items-center gap-4">
          {/* Trophy icon with glow */}
          <div className="relative hidden sm:flex">
            <div className="absolute inset-0 rounded-full bg-amber-500/30 blur-md" />
            <div className="relative flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/25">
              <Trophy className="size-6 text-zinc-900" />
            </div>
          </div>

          {/* Text content */}
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <Trophy className="size-4 text-amber-400 sm:hidden" />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Votação Aberta
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Bench Awards 2025</h3>
            <p className="max-w-md text-sm text-zinc-400">
              Vote nos melhores notebooks do ano e ajude a eleger os campeões de
              cada categoria!
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex items-center gap-3">
          <Link href={href}>
            <Button className="group bg-gradient-to-r from-amber-500 to-amber-600 font-semibold text-zinc-900 shadow-lg shadow-amber-500/25 transition-all hover:scale-105 hover:from-amber-400 hover:to-amber-500 hover:shadow-amber-500/40">
              Votar Agora
              <ChevronRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>

          {/* Dismiss button */}
          {dismissible && (
            <button
              onClick={() => setIsVisible(false)}
              className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-700/50 hover:text-zinc-300"
              aria-label="Fechar banner"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
    </div>
  )
}
