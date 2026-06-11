import { gql } from '@apollo/client'

import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'
import type { SocialMediaLink } from '@/types'
import { SocialMediaLinksMain } from './main'

const GET_SOCIAL_MEDIA_LINKS = gql`
  query GetSocialMediaLinks {
    socialMediaLinks {
      id
      url
      title
      description
      platform
      type
      active
      createdAt
      updatedAt
    }
  }
`

export default async function SocialMediaDashboardPage() {
  const { data } = await getClient().query<{
    socialMediaLinks: SocialMediaLink[]
  }>({
    query: GET_SOCIAL_MEDIA_LINKS,
  })

  const socialMediaLinks = data.socialMediaLinks ?? []

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Redes sociais</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção dos links de redes sociais. Os
          links ativos são exibidos na página pública de comunidades.
        </p>
      </div>
      <Separator />
      <SocialMediaLinksMain socialMediaLinks={socialMediaLinks} />
    </div>
  )
}
