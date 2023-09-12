import { Switch } from '../ui/switch'

export function AlertsPermission() {
  return (
    <div className="space-y-2">
      <h3 className="text-base font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Permitir notificações
      </h3>
      <div className="space-y-4">
        <fieldset className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Receber notificações neste dispositivo
            </h3>
            <h6 className="text-[0.8rem] text-muted-foreground">
              Receber notificações no seu dispositivo através deste navegador.
            </h6>
          </div>

          <Switch />
        </fieldset>
      </div>
    </div>
  )
}
