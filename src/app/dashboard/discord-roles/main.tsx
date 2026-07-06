'use client'

import { gql, useMutation } from '@apollo/client'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

import { DashboardItemCard } from '@/components/dashboard-item-card'
import { DiscordRoleForm } from '@/components/forms/discord-role-form'
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
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { env } from '@/env.mjs'
import { useFormStore } from '@/hooks/use-form-store'
import { cn } from '@/lib/utils'
import { type DiscordRole } from '@/types'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const DELETE_DISCORD_ROLE = gql`
  mutation DeleteDiscordRole($discordRoleId: ID!) {
    removeDiscordRole(id: $discordRoleId) {
      id
    }
  }
`

interface DiscordRolesMainProps {
  discordRoles: DiscordRole[]
}

export function DiscordRolesMain({ discordRoles }: DiscordRolesMainProps) {
  const { openDialogs, setOpenDialog } = useFormStore()
  const router = useRouter()

  const [deleteDiscordRole] = useMutation(DELETE_DISCORD_ROLE, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      toast.success('Cargo deletado com sucesso.')
      router.refresh()
    },
  })

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Sheet
          open={openDialogs['discordRoleCreateForm']}
          onOpenChange={(open) => setOpenDialog('discordRoleCreateForm', open)}
        >
          <SheetTrigger asChild>
            <Button variant="outline">Adicionar</Button>
          </SheetTrigger>
          <SheetContent
            className="w-full space-y-4 overflow-auto sm:max-w-xl"
            side="left"
          >
            <SheetHeader>
              <SheetTitle>ADICIONAR CARGO</SheetTitle>
            </SheetHeader>
            <DiscordRoleForm />
          </SheetContent>
        </Sheet>
      </div>

      {discordRoles.length > 0 ? (
        <ScrollArea
          className={cn('rounded-md border', {
            'h-[600px]': discordRoles.length > 8,
          })}
        >
          {discordRoles.map((discordRole) => (
            <DashboardItemCard.Root key={discordRole.id}>
              <DashboardItemCard.Content>
                <p className="text-sm leading-7">{discordRole.name}</p>
                <span className="text-xs text-muted-foreground">
                  {discordRole.value} • Atualizado{' '}
                  {dayjs(discordRole.updatedAt).fromNow()}
                </span>
              </DashboardItemCard.Content>

              <DashboardItemCard.Actions>
                <Sheet
                  open={openDialogs[`discordRoleUpdateForm.${discordRole.id}`]}
                  onOpenChange={(open) =>
                    setOpenDialog(
                      `discordRoleUpdateForm.${discordRole.id}`,
                      open,
                    )
                  }
                >
                  <SheetTrigger asChild>
                    <DashboardItemCard.Action icon={Icons.Edit} />
                  </SheetTrigger>
                  <SheetContent
                    className="w-full space-y-4 overflow-auto sm:max-w-xl"
                    side="left"
                  >
                    <SheetHeader>
                      <SheetTitle>EDITAR CARGO</SheetTitle>
                    </SheetHeader>
                    <DiscordRoleForm mode="update" discordRole={discordRole} />
                  </SheetContent>
                </Sheet>

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
                          deleteDiscordRole({
                            variables: { discordRoleId: discordRole.id },
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
          ))}
        </ScrollArea>
      ) : (
        <div className="flex justify-center">
          <p className="text-muted-foreground">Nenhum cargo encontrado.</p>
        </div>
      )}
    </div>
  )
}
