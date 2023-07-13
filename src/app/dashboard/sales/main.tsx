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
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { env } from '@/env.mjs'
import { Category, Product, Sale } from '@/types'
import { priceFormatter } from '@/utils/formatter'
import { SaleForm } from '@/components/forms/sale-form'

const DELETE_SALE = gql`
  mutation DeleteSale($saleId: String!) {
    removeSale(id: $saleId) {
      id
    }
  }
`

interface SalesMainProps {
  sales: Sale[]
  products: (Pick<Product, 'id' | 'name' | 'imageUrl'> & {
    category: Pick<Category, 'name'>
  })[]
}

export function SalesMain({ sales, products }: SalesMainProps) {
  const [selectedSale, setSelectedSale] = React.useState<(typeof sales)[0]>()
  const [selectedProduct, setSelectedProduct] =
    React.useState<(typeof products)[0]>()
  const router = useRouter()

  const [deleteSale] = useMutation(DELETE_SALE, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, clientOptions) {
      toast.error(error.message)
    },
    onCompleted(data, clientOptions) {
      toast.success('Promoção deletada com sucesso.')
      router.refresh()
    },
  })

  return (
    <div className="space-y-8">
      {/* Sales Actions */}
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
              <SheetTitle>ADICIONAR PROMOÇÃO</SheetTitle>
            </SheetHeader>
            <SaleForm />
          </SheetContent>
        </Sheet>
      </div>

      {selectedSale && (
        <div className="flex items-start gap-6 rounded-md bg-muted px-8 py-4">
          {/* Content */}
          <div className="flex flex-1 flex-col gap-y-2">
            <div className="flex flex-1 flex-col gap-y-2">
              <p className="text-sm leading-7">{selectedSale.title}</p>
              <span className="text-xs text-muted-foreground">
                {selectedSale.createdAt} •{' '}
                {priceFormatter.format(selectedSale.price / 100)}
              </span>
            </div>
          </div>
          <div className="self-center">
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setSelectedSale(undefined)}
            >
              <Icons.X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="flex items-start gap-6 rounded-md bg-muted px-8 py-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-md border">
            <Icons.Image />
          </div>
          {/* Content */}
          <div className="flex flex-1 flex-col gap-y-2">
            <p className="text-sm leading-7">{selectedProduct.name}</p>
            <span className="text-xs text-muted-foreground">
              {selectedProduct.category.name}
            </span>
          </div>
          <div className="self-center">
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setSelectedProduct(undefined)}
            >
              <Icons.X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="sales">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sales">Promoções</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Input placeholder="Pesquise por uma promoção..." />
          <ScrollArea className="rounded-md border bg-primary-foreground">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="flex cursor-pointer items-start gap-6 rounded-md px-8 py-4 hover:bg-muted"
              >
                <div className="relative flex h-16 w-16 items-center justify-center rounded-md border">
                  <Icons.Image />
                </div>

                {/* Content */}
                <div
                  className="flex flex-1 flex-col gap-y-2"
                  onClick={() => {
                    setSelectedProduct(undefined)
                    setSelectedSale(sale)
                  }}
                >
                  <p className="text-sm leading-7">{sale.title}</p>
                  <span className="text-xs text-muted-foreground">
                    {sale.createdAt} • {priceFormatter.format(sale.price / 100)}
                  </span>
                </div>

                {/* Sale Actions */}
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
                        <SheetTitle>EDITAR PROMOÇÃO</SheetTitle>
                      </SheetHeader>
                      <SaleForm mode="update" sale={sale} />
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
                            deleteSale({
                              variables: { saleId: sale.id },
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
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Input placeholder="Pesquise por um produto..." />
          <ScrollArea className="rounded-md border bg-primary-foreground">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex cursor-pointer items-start gap-6 rounded-md px-8 py-4 hover:bg-muted"
                onClick={() => {
                  setSelectedSale(undefined)
                  setSelectedProduct(product)
                }}
              >
                <div className="relative flex h-16 w-16 items-center justify-center rounded-md border">
                  <Icons.Image />
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col gap-y-2">
                  <p className="text-sm leading-7">{product.name}</p>
                </div>
              </div>
            ))}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
