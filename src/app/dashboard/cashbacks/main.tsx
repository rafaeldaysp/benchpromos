'use client'

import { gql, useMutation } from '@apollo/client'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

import { DashboardItemCard } from '@/components/dashboard-item-card'
import { CashbackForm } from '@/components/forms/cashback-form'
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
import { type Cashback, type Retailer } from '@/types'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const DELETE_CASHBACK = gql`
  mutation DeleteCashback($cashbackId: ID!) {
    removeCashback(id: $cashbackId) {
      id
    }
  }
`

interface CashbacksMainProps {
  cashbacks: (Cashback & { retailer: Retailer })[]
}

export function CashbacksMain({ cashbacks }: CashbacksMainProps) {
  const [selectedCashback, setSelectedCashback] =
    React.useState<(typeof cashbacks)[number]>()
  const { openDialogs, setOpenDialog } = useFormStore()
  const router = useRouter()

  const [deleteCashback] = useMutation(DELETE_CASHBACK, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      toast.success('Cashback deletado com sucesso.')
      router.refresh()
    },
  })

  return (
    <div className="space-y-8">
      {/* Cashbacks Actions */}
      <div className="flex justify-end gap-x-2">
        <Sheet
          open={openDialogs['cashbackCreateForm']}
          onOpenChange={(open) => setOpenDialog('cashbackCreateForm', open)}
        >
          <SheetTrigger asChild>
            <Button variant="outline">Adicionar</Button>
          </SheetTrigger>
          <SheetContent
            className="w-full space-y-4 overflow-auto sm:max-w-xl"
            side="left"
          >
            <SheetHeader>
              <SheetTitle>ADICIONAR CASHBACK</SheetTitle>
            </SheetHeader>
            <CashbackForm />
          </SheetContent>
        </Sheet>
      </div>

      {selectedCashback && (
        <DashboardItemCard.Root className="border">
          <DashboardItemCard.Content>
            <p className="text-sm leading-7">{selectedCashback.provider}</p>
            <span className="text-xs text-muted-foreground">
              {selectedCashback.retailer.name} • {selectedCashback.value}%
            </span>
          </DashboardItemCard.Content>

          <DashboardItemCard.Actions>
            <DashboardItemCard.Action
              variant="destructive"
              icon={Icons.X}
              onClick={() => setSelectedCashback(undefined)}
            />
          </DashboardItemCard.Actions>
        </DashboardItemCard.Root>
      )}

      {/* Cashbacks */}
      {cashbacks.length > 0 ? (
        <ScrollArea
          className={cn('rounded-md border', {
            'h-[600px]': cashbacks.length > 8,
          })}
        >
          {cashbacks.map((cashback) => (
            <DashboardItemCard.Root key={cashback.id}>
              <DashboardItemCard.Content
                className="cursor-pointer"
                onClick={() => setSelectedCashback(cashback)}
              >
                <p className="text-sm leading-7">{cashback.provider}</p>
                <span className="text-xs text-muted-foreground">
                  {cashback.retailer.name} • {cashback.value}% • Atualizado{' '}
                  {dayjs(cashback.updatedAt).fromNow()}
                </span>
              </DashboardItemCard.Content>

              <DashboardItemCard.Actions>
                <Sheet
                  open={openDialogs[`cashbackUpdateForm.${cashback.id}`]}
                  onOpenChange={(open) =>
                    setOpenDialog(`cashbackUpdateForm.${cashback.id}`, open)
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
                      <SheetTitle>EDITAR CASHBACK</SheetTitle>
                    </SheetHeader>
                    <CashbackForm mode="update" cashback={cashback} />
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
                          deleteCashback({
                            variables: { cashbackId: cashback.id },
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
          <p className="text-muted-foreground">Nenhum cashback encontrado.</p>
        </div>
      )}
    </div>
  )
}
