import { gql } from '@apollo/client'
import { ArrowUpRight, Users } from 'lucide-react'
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
      description
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
    <main className="relative overflow-hidden px-4 py-16 sm:py-20">
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-background to-background"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 size-[560px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl"
      />

      <div className="mx-auto w-full max-w-2xl">
        {/* Hero */}
        <header className="text-center">
          <div className="flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)]">
              <Users className="size-8" aria-hidden="true" />
            </div>
          </div>

          <h1 className="mt-6 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Acompanhe o Bench Promos onde você preferir
          </h1>
          <p className="mx-auto mt-3 max-w-md text-pretty text-muted-foreground">
            Entre nas nossas comunidades e seja o primeiro a saber das melhores
            ofertas de tecnologia.
          </p>

          <div className="mx-auto mt-6 flex max-w-fit flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-2xl border bg-card/50 px-5 py-2.5 backdrop-blur-sm">
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

        {/* Stacked type cards */}
        {groups.length > 0 ? (
          <div className="mt-12 space-y-5">
            {groups.map((group) => (
              <section
                key={group.type}
                className="rounded-3xl border bg-card/80 p-5 shadow-[0_1px_1px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-6"
              >
                <div className="mb-4">
                  <h2 className="font-semibold tracking-tight">
                    {group.meta.label}
                  </h2>
                  <p className="mt-0.5 text-pretty text-sm text-muted-foreground">
                    {group.meta.description}
                  </p>
                </div>

                <ul className="space-y-2.5">
                  {group.links.map((link) => {
                    const platform = socialMediaPlatformMeta[link.platform]

                    return (
                      <li key={link.id}>
                        <Link
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${platform.label} — ${platform.cta}`}
                          className="group flex items-center gap-3 rounded-xl bg-muted/50 p-3 transition-colors hover:bg-muted"
                        >
                          <span
                            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-white"
                            style={{ backgroundColor: platform.color }}
                          >
                            <platform.icon
                              className="size-5"
                              aria-hidden="true"
                            />
                          </span>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-tight">
                              {platform.label}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                              {link.description || platform.tagline}
                            </p>
                          </div>

                          <ArrowUpRight
                            className="size-4 shrink-0 text-muted-foreground transition-[transform,color] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
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
          <div className="mx-auto mt-12 max-w-md rounded-3xl border bg-card/80 px-6 py-12 text-center shadow-[0_1px_1px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="size-7" aria-hidden="true" />
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
