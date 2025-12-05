import { Separator } from '@/components/ui/separator'
import { AwardsDashboardMain } from './main'

export default async function AwardsDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Awards</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie os prêmios anuais e suas categorias de votação.
        </p>
      </div>
      <Separator />
      <AwardsDashboardMain />
    </div>
  )
}
