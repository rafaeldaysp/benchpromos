import { Separator } from '@/components/ui/separator'
import { TelegramMain } from './main'

export default function TelegramDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Telegram</h3>
        <p className="text-sm text-muted-foreground">
          Envie promoções rápidas para o canal configurado.
        </p>
      </div>
      <Separator />
      <TelegramMain />
    </div>
  )
}
