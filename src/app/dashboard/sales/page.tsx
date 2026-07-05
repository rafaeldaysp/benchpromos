import { Separator } from '@/components/ui/separator'
import { env } from '@/env.mjs'
import { getWhatsmiauServerConfig } from '@/lib/whatsmiau'
import { SalesMain } from './main'

export default async function SalesDashboardPage() {
  const whatsappEnabled = getWhatsmiauServerConfig() !== null
  const discordEnabled = Boolean(env.DISCORD_WEBHOOK_URL)

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
