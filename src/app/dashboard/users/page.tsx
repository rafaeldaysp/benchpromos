import { Separator } from '@/components/ui/separator'
import UsersMain from './main'

export default async function SalesDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Usuários</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie os usuários que possuem cadastro no site.
        </p>
      </div>
      <Separator />
      <UsersMain />
    </div>
  )
}
