import { Separator } from '@/components/ui/separator'
import { SalesMain } from './main'

export default async function SalesDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Promoções</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de uma promoção.
        </p>
      </div>
      <Separator />
      <SalesMain />
    </div>
  )
}
