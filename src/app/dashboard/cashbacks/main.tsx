'use client'

import { gql, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

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
import { Cashback, Retailer } from '@/types'
import { CashbackForm } from '@/components/forms/cashback-form'

const DELETE_CASHBACK = gql`
  mutation DeleteCashback($cashbackId: String!) {
    removeCashback(id: $cashbackId) {
      id
    }
  }
`

interface CashbacksMainProps {
  cashbacks: (Cashback & { retailer: Pick<Retailer, 'name'> })[]
}

export function CashbacksMain({ cashbacks }: CashbacksMainProps) {
  const [selectedCashback, setSelectedCashback] =
    React.useState<(typeof cashbacks)[0]>()
  const router = useRouter()

  const [deleteCashback] = useMutation(DELETE_CASHBACK, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, clientOptions) {
      toast.error(error.message)
    },
    onCompleted(data, clientOptions) {
      toast.success('Cashback deletado com sucesso.')
      router.refresh()
    },
  })

  return (
    <div className="space-y-8">
      {/* Cashbacks Actions */}
      <div className="flex justify-end gap-x-2">
        <Sheet>
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
        <div className="flex items-start gap-6 rounded-md bg-muted px-8 py-4">
          {/* Content */}
          <div className="flex flex-1 flex-col gap-y-2">
            <p className="text-sm leading-7">{selectedCashback.percentValue}</p>
            <span className="text-xs text-muted-foreground">
              {selectedCashback.retailer.name}
            </span>
          </div>
          <div className="self-center">
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setSelectedCashback(undefined)}
            >
              <Icons.X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Cashbacks */}
      {cashbacks.length > 0 ? (
        <ScrollArea className="rounded-md border bg-primary-foreground">
          {cashbacks.map((cashback) => (
            <div
              key={cashback.id}
              className="flex items-start gap-6 rounded-md px-8 py-4 hover:bg-muted"
            >
              {/* Content */}
              <div
                className="flex flex-1 cursor-pointer flex-col gap-y-2"
                onClick={() => setSelectedCashback(cashback)}
              >
                <p className="text-sm leading-7">{cashback.percentValue}</p>
                <span className="text-xs text-muted-foreground">
                  {cashback.retailer.name}
                </span>
              </div>

              {/* Cashback Actions */}
              <div className="flex gap-2 self-center">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Icons.Edit className="h-4 w-4" />
                    </Button>
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
                    <Button variant="destructive" size="icon">
                      <Icons.Trash className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete your account and remove your data from our
                        servers.
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
              </div>
            </div>
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
