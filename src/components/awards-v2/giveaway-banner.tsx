'use client'

import {
  Gift,
  Youtube,
  Mail,
  Clock,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react'
import { useState } from 'react'

interface GiveawayBannerProps {
  hasVoted: boolean
}

export function GiveawayBanner({ hasVoted }: GiveawayBannerProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (hasVoted) {
    // User has voted - show participation confirmation
    return (
      <div className="relative overflow-hidden rounded-xl border border-green-500/30 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900">
        {/* Animated background glow */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 size-40 animate-pulse rounded-full bg-green-500/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 size-40 animate-pulse rounded-full bg-green-400/15 blur-3xl delay-700" />
        </div>

        <div className="relative flex flex-col gap-4 p-4 sm:px-6 sm:py-4">
          {/* Success Header */}
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:flex">
              <div className="absolute inset-0 rounded-full bg-green-500/30 blur-md" />
              <div className="relative flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/25">
                <CheckCircle2 className="size-6 text-zinc-900" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-400 sm:hidden" />
                <span className="text-xs font-semibold uppercase tracking-wider text-green-400">
                  Você está participando!
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                Sorteio Bench Awards 2025
              </h3>
            </div>
          </div>

          {/* Rules */}
          <div className="space-y-2 rounded-lg bg-zinc-900/50 p-4">
            <p className="text-sm font-semibold text-white">
              Regras do Sorteio:
            </p>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li className="flex items-start gap-2">
                <Youtube className="mt-0.5 size-4 shrink-0 text-red-500" />
                <span>
                  <strong className="text-white">Live ao vivo</strong> no dia{' '}
                  <strong className="text-white">12/12 às 19h</strong> no canal{' '}
                  <strong className="text-white">Lucas Ishii</strong> no YouTube
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 size-4 shrink-0 text-blue-400" />
                <span>
                  O vencedor será sorteado durante a live e deverá{' '}
                  <strong className="text-white">
                    responder o e-mail com a palavra-chave
                  </strong>{' '}
                  que será revelada ao vivo
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-amber-400" />
                <span>
                  Fique atento ao seu e-mail e à live para não perder o sorteio!
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
      </div>
    )
  }

  // User hasn't voted yet - show invitation
  return (
    <div className="relative overflow-hidden rounded-xl border border-purple-500/30 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Animated background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 size-40 animate-pulse rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 size-40 animate-pulse rounded-full bg-pink-400/15 blur-3xl delay-700" />
      </div>

      <div className="relative flex flex-col gap-4 p-4 sm:px-6 sm:py-4">
        {/* Header - Always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between gap-3 text-left transition-opacity hover:opacity-80"
        >
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:flex">
              <div className="absolute inset-0 rounded-full bg-purple-500/30 blur-md" />
              <div className="relative flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-600 shadow-lg shadow-purple-500/25">
                <Gift className="size-6 text-zinc-900" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Gift className="size-4 text-purple-400 sm:hidden" />
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                  Participe do Sorteio
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                Vote e Concorra a Prêmios!
              </h3>
            </div>
          </div>

          {/* Chevron */}
          <ChevronDown
            className={`size-5 shrink-0 text-purple-400 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Collapsible Description and Rules */}
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            isExpanded
              ? 'grid-rows-[1fr] opacity-100'
              : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="space-y-3 pb-1">
              <p className="text-sm text-zinc-300">
                Ao votar no Bench Awards, você automaticamente participa dos
                sorteios que acontecerão durante a live de premiação!
              </p>

              <div className="space-y-2 rounded-lg bg-zinc-900/50 p-4">
                <p className="text-sm font-semibold text-white">
                  Como Participar:
                </p>
                <ul className="space-y-2 text-sm text-zinc-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-purple-400" />
                    <span>
                      <strong className="text-white">Vote agora</strong> nas
                      categorias do Bench Awards
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Youtube className="mt-0.5 size-4 shrink-0 text-red-500" />
                    <span>
                      Assista à live no dia{' '}
                      <strong className="text-white">12/12 às 19h</strong> no
                      canal <strong className="text-white">Lucas Ishii</strong>{' '}
                      no YouTube
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Mail className="mt-0.5 size-4 shrink-0 text-blue-400" />
                    <span>
                      Se sorteado,{' '}
                      <strong className="text-white">
                        responda o e-mail com a palavra-chave
                      </strong>{' '}
                      revelada na live
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
    </div>
  )
}
