import { gql } from '@apollo/client'
import { ArrowUpRight } from 'lucide-react'
import { type Metadata } from 'next'
import Link from 'next/link'

import { Icons } from '@/components/icons'
import {
  socialMediaPlatformMeta,
  socialMediaTypeMeta,
  socialMediaTypeOrder,
} from '@/constants/social-media'
import { getClient } from '@/lib/apollo'
import type { SocialMediaLink } from '@/types'

export const metadata: Metadata = {
  title: 'Comunidades',
  description:
    'Entre nas comunidades do Bench Promos e receba as melhores ofertas, cupons exclusivos e novidades de tecnologia em primeira mão.',
}

const GET_ACTIVE_SOCIAL_MEDIA_LINKS = gql`
  query GetActiveSocialMediaLinks {
    activeSocialMediaLinks {
      id
      url
      platform
      type
      active
    }
  }
`

const benefits = [
  { icon: Icons.DollarSign, label: 'Ofertas em primeira mão' },
  { icon: Icons.Tag, label: 'Cupons exclusivos' },
  { icon: Icons.BellRing, label: 'Alertas de preço' },
]

export default async function CommunitiesPage() {
  const { data } = await getClient().query<{
    activeSocialMediaLinks: SocialMediaLink[]
  }>({
    query: GET_ACTIVE_SOCIAL_MEDIA_LINKS,
  })

  const links = data?.activeSocialMediaLinks ?? []

  const groups = socialMediaTypeOrder
    .map((type) => ({
      type,
      meta: socialMediaTypeMeta[type],
      links: links.filter(
        (link) => socialMediaPlatformMeta[link.platform] && link.type === type,
      ),
    }))
    .filter((group) => group.links.length > 0)

  return (
    <main className="relative overflow-hidden">
      {/* Subtle ambient backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-primary/5 to-transparent"
      />

      <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:py-24">
        {/* Hero */}
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary duration-700 animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both">
            Comunidades
          </p>
          <h1
            className="mt-3 text-balance text-4xl font-bold tracking-tight duration-700 animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both sm:text-5xl"
            style={{ animationDelay: '80ms' }}
          >
            Acompanhe o Bench Promos onde você preferir
          </h1>
          <p
            className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground duration-700 animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both sm:text-lg"
            style={{ animationDelay: '160ms' }}
          >
            Entre nas nossas comunidades e seja o primeiro a saber das melhores
            ofertas de tecnologia.
          </p>

          <div
            className="mx-auto mt-8 flex max-w-fit flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border bg-card/50 px-6 py-3 backdrop-blur-sm duration-700 animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both"
            style={{ animationDelay: '240ms' }}
          >
            {benefits.map((benefit) => (
              <div
                key={benefit.label}
                className="flex items-center gap-2 text-sm font-medium"
              >
                <benefit.icon
                  className="size-4 text-primary"
                  aria-hidden="true"
                />
                {benefit.label}
              </div>
            ))}
          </div>
        </header>

        {/* Communities */}
        {groups.length > 0 ? (
          <div className="mt-16 space-y-12 sm:mt-20">
            {groups.map((group, groupIndex) => (
              <section
                key={group.type}
                className="duration-700 animate-in fade-in-0 slide-in-from-bottom-3 fill-mode-both"
                style={{ animationDelay: `${320 + groupIndex * 100}ms` }}
              >
                <div className="mb-4 flex items-baseline gap-3">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {group.meta.label}
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                </div>

                <ul className="grid gap-3 sm:grid-cols-2">
                  {group.links.map((link) => {
                    const platform = socialMediaPlatformMeta[link.platform]

                    return (
                      <li key={link.id}>
                        <Link
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${platform.label} — ${platform.cta}`}
                          className="group flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md sm:p-5"
                        >
                          <span
                            className="flex size-12 shrink-0 items-center justify-center rounded-xl text-white"
                            style={{ backgroundColor: platform.color }}
                          >
                            <platform.icon
                              className="size-6"
                              aria-hidden="true"
                            />
                          </span>

                          <div className="min-w-0 flex-1">
                            <p className="font-semibold leading-tight">
                              {platform.label}
                            </p>
                            <p className="mt-0.5 truncate text-sm text-muted-foreground">
                              {platform.tagline}
                            </p>
                          </div>

                          <ArrowUpRight
                            className="size-5 shrink-0 text-muted-foreground transition-[transform,color] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                            aria-hidden="true"
                          />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <div className="mx-auto mt-16 max-w-md rounded-2xl border bg-card px-6 py-12 text-center shadow-sm">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icons.MessageCircle className="size-7" aria-hidden="true" />
            </div>
            <p className="mt-4 font-semibold">Em breve</p>
            <p className="mt-1 text-pretty text-sm text-muted-foreground">
              Nossas comunidades estarão disponíveis em breve. Volte logo! 💚
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
