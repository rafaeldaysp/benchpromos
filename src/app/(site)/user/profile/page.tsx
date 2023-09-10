import { Separator } from '@/components/ui/separator'

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium">Perfil</h3>
        <p className="text-sm text-muted-foreground">
          Atualize as informações da sua conta e defina como os outros irão ver
          você.
        </p>
      </div>
      <Separator />
      {/* <AccountForm /> */}
    </div>
  )
}
