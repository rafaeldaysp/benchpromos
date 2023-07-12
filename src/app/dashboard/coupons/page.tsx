import { Separator } from '@/components/ui/separator'

export default function CouponsDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Cupons</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de um cupom.
        </p>
      </div>
      <Separator />
    </div>
  )
}
