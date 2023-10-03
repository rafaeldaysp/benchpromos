'use client'

import { gql, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

import { DashboardItemCard } from '@/components/dashboard-item-card'
import { RetailerForm } from '@/components/forms/retailer-form'
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
import { type Retailer } from '@/types'
import { cn } from '@/lib/utils'

const DELETE_RETAILER = gql`
  mutation DeleteRetailer($retailerId: ID!) {
    removeRetailer(id: $retailerId) {
      id
    }
  }
`

interface RetailersMainProps {
  retailers: Retailer[]
}

export function RetailersMain({ retailers }: RetailersMainProps) {
  const [selectedRetailer, setSelectedRetailer] = React.useState<Retailer>()
  const { openDialogs, setOpenDialog } = useFormStore()
  const router = useRouter()

  const [deleteRetailer] = useMutation(DELETE_RETAILER, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      toast.success('Varejista deletado com sucesso.')
      router.refresh()
    },
  })

  return (
    <div className="space-y-8">
      {/* Retailers Actions */}
      <div className="flex justify-end gap-x-2">
        <Sheet
          open={openDialogs['retailerCreateForm']}
          onOpenChange={(open) => setOpenDialog('retailerCreateForm', open)}
        >
          <SheetTrigger asChild>
            <Button variant="outline">Adicionar</Button>
          </SheetTrigger>
          <SheetContent
            className="w-full space-y-4 overflow-auto sm:max-w-xl"
            side="left"
          >
            <SheetHeader>
              <SheetTitle>ADICIONAR VAREJISTA</SheetTitle>
            </SheetHeader>
            <RetailerForm />
          </SheetContent>
        </Sheet>
      </div>

      {selectedRetailer && (
        <DashboardItemCard.Root className="border">
          <DashboardItemCard.Content>
            <p className="text-sm leading-7">{selectedRetailer.name}</p>
          </DashboardItemCard.Content>
          <DashboardItemCard.Actions>
            <DashboardItemCard.Action
              variant="destructive"
              icon={Icons.X}
              onClick={() => setSelectedRetailer(undefined)}
            />
          </DashboardItemCard.Actions>
        </DashboardItemCard.Root>
      )}

      {/* Retailers */}
      {retailers.length > 0 ? (
        <ScrollArea
          className={cn('rounded-md border', {
            'h-[600px]': retailers.length > 8,
          })}
        >
          {retailers.map((retailer) => (
            <DashboardItemCard.Root key={retailer.id}>
              <DashboardItemCard.Content
                className="cursor-pointer"
                onClick={() => setSelectedRetailer(retailer)}
              >
                <p className="text-sm leading-7">{retailer.name}</p>
              </DashboardItemCard.Content>

              <DashboardItemCard.Actions>
                <Sheet
                  open={openDialogs[`retailerUpdateForm.${retailer.id}`]}
                  onOpenChange={(open) =>
                    setOpenDialog(`retailerUpdateForm.${retailer.id}`, open)
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
                      <SheetTitle>EDITAR VAREJISTA</SheetTitle>
                    </SheetHeader>
                    <RetailerForm mode="update" retailer={retailer} />
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
                          deleteRetailer({
                            variables: { retailerId: retailer.id },
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
          <p className="text-muted-foreground">Nenhum varejista encontrado.</p>
        </div>
      )}
    </div>
  )
}
