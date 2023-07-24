'use client'

import { gql, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

import { DashboardItemCard } from '@/components/dashboard-item-card'
import { SaleForm } from '@/components/forms/sale-form'
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
import { type Category, type Product, type Sale } from '@/types'
import { priceFormatter } from '@/utils/formatter'

const DELETE_SALE = gql`
  mutation ($saleId: ID!) {
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
  const [selectedSale, setSelectedSale] =
    React.useState<(typeof sales)[number]>()
  const [selectedProduct, setSelectedProduct] =
    React.useState<(typeof products)[number]>()
  const router = useRouter()

  const [deleteSale] = useMutation(DELETE_SALE, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
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
            <SaleForm
              sale={{ ...selectedSale, ...selectedProduct, id: undefined }}
            />
          </SheetContent>
        </Sheet>
      </div>

      {selectedSale && (
        <DashboardItemCard.Root className="border">
          <DashboardItemCard.Image src={selectedSale.imageUrl} alt="" />

          <DashboardItemCard.Content>
            <p className="text-sm leading-7">{selectedSale.title}</p>
            <span className="text-xs text-muted-foreground">
              {selectedSale.createdAt} •{' '}
              {priceFormatter.format(selectedSale.price / 100)}
            </span>
          </DashboardItemCard.Content>

          <DashboardItemCard.Actions>
            <DashboardItemCard.Action
              variant="destructive"
              icon={Icons.X}
              onClick={() => setSelectedSale(undefined)}
            />
          </DashboardItemCard.Actions>
        </DashboardItemCard.Root>
      )}

      {selectedProduct && (
        <DashboardItemCard.Root className="border">
          <DashboardItemCard.Image src={selectedProduct.imageUrl} alt="" />

          <DashboardItemCard.Content>
            <p className="text-sm leading-7">{selectedProduct.name}</p>
            <span className="text-xs text-muted-foreground">
              {selectedProduct.category.name}
            </span>
          </DashboardItemCard.Content>

          <DashboardItemCard.Actions>
            <DashboardItemCard.Action
              variant="destructive"
              icon={Icons.X}
              onClick={() => setSelectedProduct(undefined)}
            />
          </DashboardItemCard.Actions>
        </DashboardItemCard.Root>
      )}

      <Tabs defaultValue="sales">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sales">Promoções</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          {sales.length > 0 ? (
            <div className="space-y-4">
              <Input placeholder="Pesquise por uma promoção..." />
              <ScrollArea className="rounded-md border bg-primary-foreground">
                {sales.map((sale) => (
                  <DashboardItemCard.Root key={sale.id}>
                    <DashboardItemCard.Image src={sale.imageUrl} alt="" />

                    <DashboardItemCard.Content
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedProduct(undefined)
                        setSelectedSale(sale)
                      }}
                    >
                      <p className="text-sm leading-7">{sale.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {sale.createdAt} •{' '}
                        {priceFormatter.format(sale.price / 100)}
                      </span>
                    </DashboardItemCard.Content>

                    <DashboardItemCard.Actions>
                      <Sheet>
                        <SheetTrigger asChild>
                          <DashboardItemCard.Action icon={Icons.Edit} />
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
                          <DashboardItemCard.Action
                            variant="destructive"
                            icon={Icons.Trash}
                          />
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Você tem certeza?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Essa ação não pode ser desfeita.
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
                    </DashboardItemCard.Actions>
                  </DashboardItemCard.Root>
                ))}
              </ScrollArea>
            </div>
          ) : (
            <div className="flex justify-center">
              <p className="text-muted-foreground">
                Nenhuma promoção encontrada.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="products">
          {products.length > 0 ? (
            <div className="space-y-4">
              <Input placeholder="Pesquise por um produto..." />
              <ScrollArea className="rounded-md border bg-primary-foreground">
                {products.map((product) => (
                  <DashboardItemCard.Root
                    key={product.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedSale(undefined)
                      setSelectedProduct(product)
                    }}
                  >
                    <DashboardItemCard.Image src={product.imageUrl} alt="" />
                    <DashboardItemCard.Content>
                      <p className="text-sm leading-7">{product.name}</p>
                    </DashboardItemCard.Content>
                  </DashboardItemCard.Root>
                ))}
              </ScrollArea>
            </div>
          ) : (
            <div className="flex justify-center">
              <p className="text-muted-foreground">
                Nenhum produto encontrado.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
