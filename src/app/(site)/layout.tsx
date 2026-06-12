import { gql } from '@apollo/client'
import * as React from 'react'

import { SiteHeader } from '@/components/layouts/site-header'
import { SocialMediaFab } from '@/components/social-media-fab'
import { getClient } from '@/lib/apollo'
import type { SocialMediaLink } from '@/types'

interface SiteLayoutProps {
  children: React.ReactNode
}

const GET_ACTIVE_SOCIAL_MEDIA_LINKS = gql`
  query GetActiveSocialMediaLinksForFab {
    activeSocialMediaLinks {
      id
      url
      platform
    }
  }
`

async function getActiveSocialMediaLinks() {
  try {
    const { data } = await getClient().query<{
      activeSocialMediaLinks: SocialMediaLink[]
    }>({
      query: GET_ACTIVE_SOCIAL_MEDIA_LINKS,
    })

    return data?.activeSocialMediaLinks ?? []
  } catch {
    return []
  }
}

export default async function SiteLayout({ children }: SiteLayoutProps) {
  const socialMediaLinks = await getActiveSocialMediaLinks()

  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SocialMediaFab links={socialMediaLinks} />
    </div>
  )
}
