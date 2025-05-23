'use client'

import { gql, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { DashboardItemCard } from '@/components/dashboard-item-card'
import { DashboardUsers } from '@/components/dashboard-users'
import { UserRoleForm } from '@/components/forms/user-role-form'
import { Icons } from '@/components/icons'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { env } from '@/env.mjs'
import { useFormStore } from '@/hooks/use-form-store'

const REMOVE_USER = gql`
  mutation RemoveUser($userId: ID!) {
    deleteUser(id: $userId) {
      id
    }
  }
`

export default function UsersMain() {
  const { openDialogs, setOpenDialog } = useFormStore()

  const router = useRouter()

  const [removeUser] = useMutation(REMOVE_USER, {
    refetchQueries: ['GetUsers'],
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      toast.success('Usuário removido com sucesso.')
      router.refresh()
    },
  })

  return (
    <div>
      <DashboardUsers>
        {({ users }) =>
          users.map((user, i) => (
            <DashboardItemCard.Root key={i}>
              {user.image ? (
                <DashboardItemCard.Image
                  src={user.image}
                  alt=""
                  className="rounded-full"
                />
              ) : (
                <Avatar className="size-16">
                  <AvatarFallback>
                    <span className="sr-only">{user.name}</span>
                    <Icons.User className="size-8" />
                  </AvatarFallback>
                </Avatar>
              )}

              <DashboardItemCard.Content className="cursor-pointer">
                <p className="text-xs leading-7 sm:text-sm">{user.name}</p>
                <span className="flex flex-col gap-1 text-xs text-muted-foreground sm:py-1">
                  <Badge
                    className="w-fit px-1 py-0.5 text-xs"
                    variant={
                      user.role === 'ADMIN'
                        ? 'default'
                        : user.role === 'MOD'
                        ? 'success'
                        : 'secondary'
                    }
                  >
                    {user.role}
                  </Badge>
                  <span className="w-36 max-sm:truncate">{user.email}</span>
                </span>
              </DashboardItemCard.Content>

              <DashboardItemCard.Actions>
                <Dialog
                  open={openDialogs[`changeUserRoleForm.${user.id}`]}
                  onOpenChange={(open) =>
                    setOpenDialog(`changeUserRoleForm.${user.id}`, open)
                  }
                >
                  <DialogTrigger asChild>
                    <DashboardItemCard.Action icon={Icons.Edit} />
                  </DialogTrigger>
                  <DialogContent className="w-full space-y-4 overflow-auto sm:max-w-xl">
                    <DialogHeader>
                      <DialogTitle>ALTERAR CARGO DE USUÁRIO</DialogTitle>
                    </DialogHeader>

                    <UserRoleForm user={user} />
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DashboardItemCard.Action
                      variant="destructive"
                      icon={Icons.Trash}
                    />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Essa ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          removeUser({
                            variables: { userId: user.id },
                          })
                        }
                      >
                        Continuar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DashboardItemCard.Actions>
            </DashboardItemCard.Root>
          ))
        }
      </DashboardUsers>
    </div>
  )
}
