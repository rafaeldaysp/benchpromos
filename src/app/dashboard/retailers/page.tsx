import { RetailerForm } from '@/components/forms/retailer-form'
import { Separator } from '@/components/ui/separator'

export default async function RetailersDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Anunciantes</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, atualização ou remoção dos anunciantes. Para
          atualizar um anunciante, basta selecioná-lo e iniciar as modificações.
        </p>
      </div>
      <Separator />
      <div className="flex flex-col-reverse gap-8 lg:flex-row">
        <div className="flex-1">
          <RetailerForm />
        </div>
        <div className="h-96 lg:h-[768px] lg:w-2/5">SomethingHere</div>
      </div>
    </div>
  )
}
