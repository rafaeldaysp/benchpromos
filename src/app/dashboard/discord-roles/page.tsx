import { gql } from '@apollo/client'

import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'
import type { DiscordRole } from '@/types'
import { DiscordRolesMain } from './main'

const GET_DISCORD_ROLES = gql`
  query GetDiscordRoles {
    discordRoles {
      id
      name
      value
      updatedAt
    }
  }
`

export default async function DiscordRolesDashboardPage() {
  const { data } = await getClient().query<{
    discordRoles: DiscordRole[]
  }>({
    query: GET_DISCORD_ROLES,
  })

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Cargos Discord</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de um cargo do Discord.
        </p>
      </div>
      <Separator />
      <DiscordRolesMain discordRoles={data.discordRoles ?? []} />
    </div>
  )
}
