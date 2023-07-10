import { ProductForm } from '@/components/forms/product-form'
import { ProductsSelect } from '@/components/products-select'
import { Separator } from '@/components/ui/separator'

export default function ProductsDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Produtos</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, atualização ou remoção dos produtos. Para atualizar
          um produto, basta selecioná-lo e iniciar as modificações.
        </p>
      </div>
      <Separator />
      <div className="flex flex-col-reverse gap-8 lg:flex-row">
        <div className="flex-1">
          <ProductForm />
        </div>
        <div className="h-96 lg:h-[768px] lg:w-2/5">
          <ProductsSelect />
        </div>
      </div>
    </div>
  )
}
