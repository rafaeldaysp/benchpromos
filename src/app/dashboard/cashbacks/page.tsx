import { Separator } from '@/components/ui/separator'

export default function CashbacksDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Cashbacks</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de um cashback.
        </p>
      </div>
      <Separator />
    </div>
  )
}
