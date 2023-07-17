'use client'

import { gql, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

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
import { Retailer } from '@/types'

const DELETE_RETAILER = gql`
  mutation ($retailerId: ID!) {
    removeRetailer(id: $retailerId) {
      __typename
      ... on Retailer {
        id
      }
      ... on Error {
        message
      }
    }
  }
`

interface RetailersMainProps {
  retailers: Retailer[]
}

export function RetailersMain({ retailers }: RetailersMainProps) {
  const [selectedRetailer, setSelectedRetailer] = React.useState<Retailer>()
  const router = useRouter()

  const [deleteRetailer] = useMutation(DELETE_RETAILER, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, clientOptions) {
      toast.error(error.message)
    },
    onCompleted(data, clientOptions) {
      toast.success('Anunciante deletado com sucesso.')
      router.refresh()
    },
  })

  return (
    <div className="space-y-8">
      {/* Retailers Actions */}
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
              <SheetTitle>ADICIONAR ANUNCIANTE</SheetTitle>
            </SheetHeader>
            <RetailerForm />
          </SheetContent>
        </Sheet>
      </div>

      {selectedRetailer && (
        <div className="flex items-start gap-6 rounded-md bg-muted px-8 py-4">
          {/* Content */}
          <div className="flex flex-1 flex-col gap-y-2">
            <p className="text-sm leading-7">{selectedRetailer.name}</p>
          </div>
          <div className="self-center">
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setSelectedRetailer(undefined)}
            >
              <Icons.X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Retailers */}
      {retailers.length > 0 ? (
        <ScrollArea className="rounded-md border bg-primary-foreground">
          {retailers.map((retailer) => (
            <div
              key={retailer.id}
              className="flex items-start gap-6 rounded-md px-8 py-4 hover:bg-muted"
            >
              {/* Content */}
              <div
                className="flex flex-1 cursor-pointer flex-col gap-y-2"
                onClick={() => setSelectedRetailer(retailer)}
              >
                <p className="text-sm leading-7">{retailer.name}</p>
              </div>

              {/* Retailer Actions */}
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
                      <SheetTitle>EDITAR ANUNCIANTE</SheetTitle>
                    </SheetHeader>
                    <RetailerForm mode="update" retailer={retailer} />
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
              </div>
            </div>
          ))}
        </ScrollArea>
      ) : (
        <div className="flex justify-center">
          <p className="text-muted-foreground">Nenhum anunciante encontrado.</p>
        </div>
      )}
    </div>
  )
}
