import { SaleForm } from '@/components/forms/sale-form'
import { ProductsSelect } from '@/components/products-select'
import { Separator } from '@/components/ui/separator'

export default function SalesDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Promoções</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, atualização ou remoção das promoções. Para criar
          uma nova promoção, selecione um produto como base ou escolha uma
          promoção existente. Caso queira editar uma promoção, selecione-a para
          fazer as modificações necessárias.
        </p>
      </div>
      <Separator />
      <div className="flex flex-col-reverse gap-8 lg:flex-row">
        <div className="flex-1">
          <SaleForm />
        </div>
        <div className="h-96 lg:h-[768px] lg:w-2/5">
          <ProductsSelect />
        </div>
      </div>
    </div>
  )
}
