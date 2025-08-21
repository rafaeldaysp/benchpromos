import { notFound } from 'next/navigation'

import { getCurrentUser } from '@/app/_actions/user'
import { UserProfileForm } from '@/components/forms/user-profile-form'
import { Separator } from '@/components/ui/separator'
import { removeNullValues } from '@/utils'

export default async function ProfilePage() {
  const user = removeNullValues(await getCurrentUser()) as {
    id: string
    name: string
    image?: string
  }
  if (!user) return notFound()

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
      <UserProfileForm user={user} />
    </div>
  )
}
