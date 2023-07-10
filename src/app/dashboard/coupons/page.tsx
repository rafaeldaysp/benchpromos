import { Separator } from '@/components/ui/separator'

export default function CouponsDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Cupons</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, atualização ou remoção dos cupons. Para atualizar
          um cupom, basta selecioná-lo e iniciar as modificações.
        </p>
      </div>
      <Separator />
      <div className="flex flex-col-reverse gap-8 lg:flex-row">
        <div className="flex-1">
          {/* <CouponForm /> */}
          CouponForm
        </div>
        <div className="h-96 lg:h-[768px] lg:w-2/5">SomethingHere</div>
      </div>
    </div>
  )
}
