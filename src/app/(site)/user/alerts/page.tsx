import { Separator } from '@/components/ui/separator'

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Alertas</h3>
        <p className="text-sm text-muted-foreground">
          Ative ou desative alertas desejados.
        </p>
      </div>
      <Separator />
      {/* <AccountForm /> */}
    </div>
  )
}
