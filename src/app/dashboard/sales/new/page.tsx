import { Separator } from '@/components/ui/separator'
import { env } from '@/env.mjs'
import { getEvolutionGoServerConfig } from '@/lib/evolution-go'
import { NewSaleForm } from './new-sale-form'

export default function NewSalePage() {
  // Same share capabilities as the sheet in /dashboard/sales.
  const whatsappEnabled = getEvolutionGoServerConfig('tech') !== null
  const discordEnabled =
    Boolean(env.DISCORD_GERAIS_WEBHOOK_URL) ||
    Boolean(env.DISCORD_PROMOCOES_WEBHOOK_URL)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Nova promoção</h3>
        <p className="text-sm text-muted-foreground">
          Cadastre uma promoção e compartilhe nos canais selecionados.
        </p>
      </div>
      <Separator />
      <div className="max-w-xl">
        <NewSaleForm
          whatsappEnabled={whatsappEnabled}
          discordEnabled={discordEnabled}
        />
      </div>
    </div>
  )
}
