'use client'

import { gql, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

import { DashboardItemCard } from '@/components/dashboard-item-card'
import { DealForm } from '@/components/forms/deal-form'
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
import {
  type Cashback,
  type Coupon,
  type Deal,
  type Product,
  type Retailer,
} from '@/types'
import { priceFormatter } from '@/utils/formatter'
import { priceCalculator } from '@/utils/price-calculator'

const DELETE_DEAL = gql`
  mutation DeleteDeal($dealId: ID!) {
    removeDeal(id: $dealId) {
      id
    }
  }
`

interface DealsMainProps {
  deals: (Deal & { cashback?: Pick<Cashback, 'value'> } & {
    coupon?: Pick<Coupon, 'discount'>
  })[]
  products: Pick<Product, 'id' | 'name' | 'imageUrl'>[]
  retailers: Retailer[]
}

export function DealsMain({ deals, products, retailers }: DealsMainProps) {
  const [selectedProduct, setSelectedProduct] =
    React.useState<(typeof products)[number]>()
  const [selectedRetailer, setSelectedRetailer] =
    React.useState<(typeof retailers)[number]>()
  const router = useRouter()

  const filteredDeals = deals
    .filter((deal) => {
      if (selectedProduct && selectedRetailer) {
        return (
          deal.productId === selectedProduct.id &&
          deal.retailerId === selectedRetailer.id
        )
      }

      return (
        deal.productId === selectedProduct?.id ||
        deal.retailerId === selectedRetailer?.id
      )
    })
    .map((deal) => {
      const product = products.find(
        (product) => product.id === deal.productId,
      ) as (typeof products)[number]

      const retailer = retailers.find(
        (retailer) => retailer.id === deal.retailerId,
      ) as (typeof retailers)[number]

      return {
        ...deal,
        product,
        retailer,
      }
    })

  const [deleteDeal] = useMutation(DELETE_DEAL, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      toast.success('Anúncio deletado com sucesso.')
      router.refresh()
    },
  })

  return (
    <div className="space-y-8">
      {selectedProduct && selectedRetailer && (
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
                <SheetTitle>ADICIONAR ANÚNCIO</SheetTitle>
              </SheetHeader>
              <DealForm
                productId={selectedProduct.id}
                retailerId={selectedRetailer.id}
              />
            </SheetContent>
          </Sheet>
        </div>
      )}

      <div className="space-y-2">
        {selectedProduct && (
          <DashboardItemCard.Root className="border">
            <DashboardItemCard.Image src={selectedProduct.imageUrl} alt="" />

            <DashboardItemCard.Content>
              <p className="text-sm leading-7">{selectedProduct.name}</p>
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
      </div>

      {filteredDeals.length > 0 ? (
        <div className="space-y-4">
          <div></div>
          <h4 className="font-medium tracking-tight">
            Anúncios • {filteredDeals.length}
          </h4>
          <ScrollArea className="rounded-md border bg-primary-foreground">
            {filteredDeals.map((deal) => (
              <DashboardItemCard.Root key={deal.id}>
                <DashboardItemCard.Image src={deal.product.imageUrl} alt="" />

                <DashboardItemCard.Content className="cursor-pointer">
                  <p className="text-sm leading-7">{deal.product.name}</p>
                  <span className="text-xs text-muted-foreground">
                    {deal.retailer.name} •{' '}
                    {priceFormatter.format(
                      priceCalculator(
                        deal.price,
                        deal.coupon?.discount,
                        deal.cashback?.value,
                      ) / 100,
                    )}
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
                        <SheetTitle>EDITAR ANÚNCIO</SheetTitle>
                      </SheetHeader>
                      <DealForm
                        mode="update"
                        productId={deal.productId}
                        retailerId={deal.retailerId}
                        deal={deal}
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
                            deleteDeal({
                              variables: { dealId: deal.id },
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
          <p className="text-muted-foreground">Nenhum anúncio encontrado.</p>
        </div>
      )}

      <Tabs defaultValue="products">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="retailers">Anunciantes</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          {products.length > 0 ? (
            <div className="space-y-4">
              <Input placeholder="Pesquise por um produto..." />
              <ScrollArea className="rounded-md border bg-primary-foreground">
                {products.map((product) => (
                  <DashboardItemCard.Root
                    key={product.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
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

        <TabsContent value="retailers">
          {retailers.length > 0 ? (
            <div className="space-y-4">
              <Input placeholder="Pesquise por um anunciante..." />
              <ScrollArea className="rounded-md border bg-primary-foreground">
                {retailers.map((retailer) => (
                  <DashboardItemCard.Root
                    key={retailer.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedRetailer(retailer)}
                  >
                    <DashboardItemCard.Content>
                      <p className="text-sm leading-7">{retailer.name}</p>
                    </DashboardItemCard.Content>
                  </DashboardItemCard.Root>
                ))}
              </ScrollArea>
            </div>
          ) : (
            <div className="flex justify-center">
              <p className="text-muted-foreground">
                Nenhum anunciante encontrado.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
