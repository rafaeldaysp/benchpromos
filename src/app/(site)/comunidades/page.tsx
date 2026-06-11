import { gql } from '@apollo/client'
import { type Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
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
        className="pointer-events-none absolute left-1/2 top-0 -z-10 size-[640px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl"
      />

      <div className="mx-auto w-full max-w-4xl">
        {/* Hero */}
        <header className="space-y-3 text-center duration-700 animate-in fade-in-0 slide-in-from-bottom-3 fill-mode-both">
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Faça parte das nossas comunidades
          </h1>
          <p className="mx-auto max-w-xl text-pretty text-muted-foreground">
            Escolha onde você quer acompanhar o Bench Promos e seja o primeiro a
            saber das melhores ofertas de tecnologia.
          </p>
        </header>

        {groups.length > 0 ? (
          <div className="mt-12 space-y-12">
            {groups.map((group, groupIndex) => (
              <section
                key={group.type}
                className="space-y-5 duration-700 animate-in fade-in-0 slide-in-from-bottom-3 fill-mode-both"
                style={{ animationDelay: `${120 + groupIndex * 120}ms` }}
              >
                <div className="space-y-1">
                  <h2 className="text-balance text-xl font-semibold tracking-tight">
                    {group.meta.label}
                  </h2>
                  <p className="text-pretty text-sm text-muted-foreground">
                    {group.meta.description}
                  </p>
                </div>

                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.links.map((link) => {
                    const platform = socialMediaPlatformMeta[link.platform]

                    return (
                      <li
                        key={link.id}
                        className="flex flex-col items-center gap-4 rounded-2xl border bg-card/80 p-6 text-center shadow-[0_1px_1px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.18)] backdrop-blur-sm transition-transform hover:-translate-y-0.5"
                      >
                        <div
                          className="flex size-14 items-center justify-center rounded-2xl text-white"
                          style={{
                            backgroundColor: platform.color,
                            boxShadow: `0 8px 24px -8px ${platform.color}b3`,
                          }}
                        >
                          <platform.icon className="size-7" />
                        </div>
                        <p className="font-semibold">{platform.label}</p>
                        <Button
                          asChild
                          className="w-full gap-2 rounded-xl text-white transition-[transform,opacity] hover:opacity-90 active:scale-[0.96]"
                          style={{ backgroundColor: platform.color }}
                        >
                          <Link
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <platform.icon
                              className="size-4"
                              aria-hidden="true"
                            />
                            {platform.cta}
                          </Link>
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <div className="mx-auto mt-12 max-w-md rounded-2xl border border-dashed bg-muted/40 px-4 py-10 text-center text-sm text-muted-foreground">
            Nossas comunidades estarão disponíveis em breve. Volte logo! 💚
          </div>
        )}
      </div>
    </main>
  )
}
