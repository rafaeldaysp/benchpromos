import { Separator } from '@/components/ui/separator'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Dashboard</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie as informações do site, crie produtos, promoções, benchmarks
          e mais...
        </p>
      </div>
      <Separator />
    </div>
  )
}
