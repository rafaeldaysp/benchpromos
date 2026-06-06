import { Separator } from '@/components/ui/separator'
import { getWhatsmiauServerConfig } from '@/lib/whatsmiau'
import { TelegramMain } from './main'

export default function TelegramDashboardPage() {
  const whatsappEnabled = getWhatsmiauServerConfig() !== null

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">
          {whatsappEnabled ? 'Telegram e WhatsApp' : 'Telegram'}
        </h3>
        <p className="text-sm text-muted-foreground">
          Envie promoções rápidas para os canais configurados.
        </p>
      </div>
      <Separator />
      <TelegramMain whatsappEnabled={whatsappEnabled} />
    </div>
  )
}
