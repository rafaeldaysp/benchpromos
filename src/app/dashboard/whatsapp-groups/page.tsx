import { gql } from '@apollo/client'

import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'
import type { WhatsappGroup } from '@/types'
import { WhatsappGroupsMain } from './main'

const GET_WHATSAPP_GROUPS = gql`
  query GetWhatsappGroups {
    whatsappGroups {
      id
      url
      active
      createdAt
      updatedAt
    }
  }
`

export default async function WhatsappGroupsDashboardPage() {
  const { data } = await getClient().query<{
    whatsappGroups: WhatsappGroup[]
  }>({
    query: GET_WHATSAPP_GROUPS,
  })

  const whatsappGroups = data.whatsappGroups ?? []

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Grupo WhatsApp</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de um grupo do WhatsApp. O grupo
          ativo é exibido na página pública.
        </p>
      </div>
      <Separator />
      <WhatsappGroupsMain whatsappGroups={whatsappGroups} />
    </div>
  )
}
