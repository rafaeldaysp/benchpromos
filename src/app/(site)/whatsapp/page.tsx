import { gql } from '@apollo/client'
import { type Metadata } from 'next'
import Link from 'next/link'

import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { getClient } from '@/lib/apollo'
import type { WhatsappGroup } from '@/types'

export const metadata: Metadata = {
  title: 'Grupo do WhatsApp',
  description:
    'Entre no grupo do WhatsApp do Bench Promos e receba as melhores ofertas, cupons exclusivos e alertas de preço em primeira mão.',
}

const GET_ACTIVE_WHATSAPP_GROUP = gql`
  query GetActiveWhatsappGroup {
    activeWhatsappGroup {
      id
      url
      active
    }
  }
`

const benefits = [
  {
    icon: Icons.DollarSign,
    title: 'Ofertas em primeira mão',
    description: 'As melhores promoções de tecnologia assim que saem do forno.',
  },
  {
    icon: Icons.Tag,
    title: 'Cupons exclusivos',
    description: 'Descontos extras que a gente garimpa e compartilha no grupo.',
  },
  {
    icon: Icons.BellRing,
    title: 'Alertas de preço',
    description: 'Avisamos quando aquele produto que você quer baixa de preço.',
  },
]

export default async function WhatsappGroupPage() {
  const { data } = await getClient().query<{
    activeWhatsappGroup: WhatsappGroup | null
  }>({
    query: GET_ACTIVE_WHATSAPP_GROUP,
  })

  const group = data?.activeWhatsappGroup ?? null

  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-16">
      {/* Ambient brand glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#25D366]/15 via-background to-background"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 size-[640px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#25D366]/20 blur-3xl"
      />

      <section className="w-full max-w-lg">
        <div className="rounded-3xl border bg-card/80 p-8 text-center shadow-[0_1px_1px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-10">
          {/* Brand mark */}
          <div className="flex justify-center duration-700 animate-in fade-in-0 zoom-in-95 fill-mode-both">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-[0_8px_24px_-8px_rgba(37,211,102,0.7)]">
              <Icons.WhatsApp className="size-10" />
            </div>
          </div>

          {/* Headline */}
          <div
            className="mt-6 space-y-3 duration-700 animate-in fade-in-0 slide-in-from-bottom-3 fill-mode-both"
            style={{ animationDelay: '120ms' }}
          >
            <h1 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
              Entre no grupo do WhatsApp do Bench Promos
            </h1>
            <p className="text-pretty text-muted-foreground">
              Faça parte da comunidade e seja o primeiro a saber das melhores
              ofertas de tecnologia.
            </p>
          </div>

          {/* Benefits */}
          <ul
            className="mt-8 space-y-3 text-left duration-700 animate-in fade-in-0 slide-in-from-bottom-3 fill-mode-both"
            style={{ animationDelay: '240ms' }}
          >
            {benefits.map((benefit) => (
              <li
                key={benefit.title}
                className="flex items-start gap-3 rounded-xl bg-muted/50 p-3"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#25D366]/15 text-[#128C7E] dark:text-[#25D366]">
                  <benefit.icon className="size-4" aria-hidden="true" />
                </span>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium leading-none">
                    {benefit.title}
                  </p>
                  <p className="text-pretty text-xs text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div
            className="mt-8 duration-700 animate-in fade-in-0 slide-in-from-bottom-3 fill-mode-both"
            style={{ animationDelay: '360ms' }}
          >
            {group ? (
              <>
                <Button
                  asChild
                  size="lg"
                  className="h-12 w-full gap-2 rounded-xl bg-[#25D366] text-base font-semibold text-white shadow-[0_8px_20px_-8px_rgba(37,211,102,0.8)] transition-[transform,background-color] hover:bg-[#1fb457] active:scale-[0.96]"
                >
                  <Link
                    href={group.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icons.WhatsApp className="size-5" aria-hidden="true" />
                    Entrar no grupo
                  </Link>
                </Button>
                <p className="mt-3 text-xs text-muted-foreground">
                  O link abre o WhatsApp em uma nova aba.
                </p>
              </>
            ) : (
              <div className="rounded-xl border border-dashed bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
                Nosso grupo estará disponível em breve. Volte logo! 💚
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
