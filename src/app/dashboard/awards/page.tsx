import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AwardsDashboardMain } from './main'
import { AwardsRevealMain } from './reveal-main'

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
      <Tabs defaultValue="manage" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="manage">Gerenciar</TabsTrigger>
          <TabsTrigger value="reveal">Revelar</TabsTrigger>
        </TabsList>

        <TabsContent value="manage">
          <AwardsDashboardMain />
        </TabsContent>

        <TabsContent value="reveal">
          <AwardsRevealMain />
        </TabsContent>
      </Tabs>
    </div>
  )
}
