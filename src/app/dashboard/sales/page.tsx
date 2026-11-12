import { Separator } from '@/components/ui/separator'
import { env } from '@/env.mjs'
import { getEvolutionGoServerConfig } from '@/lib/evolution-go'
import { SalesMain } from './main'

export default async function SalesDashboardPage() {
  // Sale posts go to the tech WhatsApp chats (WHATSAPP_TECH_CHAT_IDS).
  const whatsappEnabled = getEvolutionGoServerConfig('tech') !== null
  const discordEnabled =
    Boolean(env.DISCORD_GERAIS_WEBHOOK_URL) ||
    Boolean(env.DISCORD_PROMOCOES_WEBHOOK_URL)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Promoções</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de uma promoção.
        </p>
      </div>
      <Separator />
      <SalesMain
        whatsappEnabled={whatsappEnabled}
        discordEnabled={discordEnabled}
      />
    </div>
  )
}
