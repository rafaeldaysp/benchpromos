'use client'

import { gql, useMutation } from '@apollo/client'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { DashboardItemCard } from '@/components/dashboard-item-card'
import { WhatsappGroupForm } from '@/components/forms/whatsapp-group-form'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { env } from '@/env.mjs'
import { useFormStore } from '@/hooks/use-form-store'
import { cn } from '@/lib/utils'
import type { WhatsappGroup } from '@/types'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const UPDATE_WHATSAPP_GROUP = gql`
  mutation UpdateWhatsappGroupActive($input: UpdateWhatsappGroupInput!) {
    updateWhatsappGroup(updateWhatsappGroupInput: $input) {
      id
      active
    }
  }
`

const DELETE_WHATSAPP_GROUP = gql`
  mutation DeleteWhatsappGroup($whatsappGroupId: ID!) {
    removeWhatsappGroup(id: $whatsappGroupId) {
      id
    }
  }
`

interface WhatsappGroupsMainProps {
  whatsappGroups: WhatsappGroup[]
}

export function WhatsappGroupsMain({
  whatsappGroups,
}: WhatsappGroupsMainProps) {
  const { openDialogs, setOpenDialog } = useFormStore()
  const router = useRouter()

  const mutationContext = {
    headers: {
      'api-key': env.NEXT_PUBLIC_API_KEY,
    },
  }

  const [updateWhatsappGroup, { loading: isUpdating }] = useMutation(
    UPDATE_WHATSAPP_GROUP,
    {
      context: mutationContext,
      onError(error) {
        toast.error(error.message)
      },
      onCompleted() {
        router.refresh()
      },
    },
  )

  const [deleteWhatsappGroup] = useMutation(DELETE_WHATSAPP_GROUP, {
    context: mutationContext,
    onError(error) {
      toast.error(error.message)
    },
    onCompleted() {
      toast.success('Grupo deletado com sucesso.')
      router.refresh()
    },
  })

  return (
    <div className="space-y-8">
      {/* WhatsApp Groups Actions */}
      <div className="flex justify-end gap-x-2">
        <Sheet
          open={openDialogs['whatsappGroupCreateForm']}
          onOpenChange={(open) =>
            setOpenDialog('whatsappGroupCreateForm', open)
          }
        >
          <SheetTrigger asChild>
            <Button variant="outline">Adicionar</Button>
          </SheetTrigger>
          <SheetContent
            className="w-full space-y-4 overflow-auto sm:max-w-xl"
            side="left"
          >
            <SheetHeader>
              <SheetTitle>ADICIONAR GRUPO</SheetTitle>
            </SheetHeader>
            <WhatsappGroupForm />
          </SheetContent>
        </Sheet>
      </div>

      {/* WhatsApp Groups */}
      {whatsappGroups.length > 0 ? (
        <ScrollArea
          className={cn('rounded-md border', {
            'h-[600px]': whatsappGroups.length > 8,
          })}
        >
          {whatsappGroups.map((whatsappGroup) => (
            <DashboardItemCard.Root key={whatsappGroup.id}>
              <DashboardItemCard.Content>
                <div className="flex items-center gap-2">
                  <p className="break-all text-sm leading-7">
                    {whatsappGroup.url}
                  </p>
                  {whatsappGroup.active && (
                    <Badge variant="success">Ativo</Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  Atualizado {dayjs(whatsappGroup.updatedAt).fromNow()}
                </span>
              </DashboardItemCard.Content>

              <DashboardItemCard.Actions>
                <div className="flex items-center gap-2 self-center rounded-md border border-input px-3 py-1.5 shadow-sm">
                  <Label
                    htmlFor={`whatsapp-group-active-${whatsappGroup.id}`}
                    className="text-xs font-normal text-muted-foreground"
                  >
                    Ativo
                  </Label>
                  <Switch
                    id={`whatsapp-group-active-${whatsappGroup.id}`}
                    checked={whatsappGroup.active}
                    disabled={isUpdating}
                    onCheckedChange={(checked) =>
                      updateWhatsappGroup({
                        variables: {
                          input: { id: whatsappGroup.id, active: checked },
                        },
                      })
                    }
                  />
                </div>

                <Sheet
                  open={
                    openDialogs[`whatsappGroupUpdateForm.${whatsappGroup.id}`]
                  }
                  onOpenChange={(open) =>
                    setOpenDialog(
                      `whatsappGroupUpdateForm.${whatsappGroup.id}`,
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
                      <SheetTitle>EDITAR GRUPO</SheetTitle>
                    </SheetHeader>
                    <WhatsappGroupForm
                      mode="update"
                      whatsappGroup={whatsappGroup}
                    />
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
                          deleteWhatsappGroup({
                            variables: { whatsappGroupId: whatsappGroup.id },
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
          <p className="text-muted-foreground">Nenhum grupo encontrado.</p>
        </div>
      )}
    </div>
  )
}
