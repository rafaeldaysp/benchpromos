import { Separator } from '@/components/ui/separator'

export default async function DealsDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Anúncios</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de um anúncio.
        </p>
      </div>
      <Separator />
    </div>
  )
}
