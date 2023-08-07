'use client'

import { gql, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

import { DashboardItemCard } from '@/components/dashboard-item-card'
import { DealForm } from '@/components/forms/deal-form'
import DealsLinkForm from '@/components/forms/deals-link-form'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { env } from '@/env.mjs'
import { useFormStore } from '@/hooks/use-form-store'
import { cn } from '@/lib/utils'
import type {
  Cashback,
  Category,
  Coupon,
  Deal,
  Product,
  Retailer,
} from '@/types'
import { couponFormatter, priceFormatter } from '@/utils/formatter'
import { priceCalculator } from '@/utils/price-calculator'

const DELETE_DEAL = gql`
  mutation DeleteDeal($dealId: ID!) {
    removeDeal(id: $dealId) {
      id
    }
  }
`

interface DealsMainProps {
  deals: (Deal & { cashback?: Pick<Cashback, 'value' | 'provider'> } & {
    coupon?: Pick<Coupon, 'discount' | 'code'>
  })[]
  products: (Pick<Product, 'id' | 'name' | 'imageUrl'> & {
    category: Pick<Category, 'id' | 'name'>
  })[]
  retailers: Retailer[]
  categories: Pick<Category, 'id' | 'name'>[]
}

export function DealsMain({
  deals,
  products,
  retailers,
  categories,
}: DealsMainProps) {
  const [selectedProduct, setSelectedProduct] =
    React.useState<(typeof products)[number]>()
  const [selectedRetailer, setSelectedRetailer] =
    React.useState<(typeof retailers)[number]>()
  const [selectedDealIds, setSelectedDealIds] = React.useState<string[]>([])
  const [selectedCategory, setSelectedCategory] =
    React.useState<(typeof categories)[number]>()
  const { openDialogs, setOpenDialog } = useFormStore()
  const router = useRouter()

  const onDealSelect = (dealId: string) => {
    selectedDealIds.includes(dealId)
      ? setSelectedDealIds([
          ...selectedDealIds.filter(
            (selectedDealId) => selectedDealId !== dealId,
          ),
        ])
      : setSelectedDealIds([...selectedDealIds, dealId])
  }

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
    .filter((deal) =>
      deal.product.category.id.includes(selectedCategory?.id ?? ''),
    )

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
      toast.success('Oferta deletada com sucesso.')
      router.refresh()
    },
  })

  return (
    <div className="space-y-8">
      {selectedProduct && selectedRetailer && (
        <div className="flex justify-end gap-x-2">
          <Sheet
            open={openDialogs['dealCreateForm']}
            onOpenChange={(open) => setOpenDialog('dealCreateForm', open)}
          >
            <SheetTrigger asChild>
              <Button variant="outline">Adicionar</Button>
            </SheetTrigger>
            <SheetContent
              className="w-full space-y-4 overflow-auto sm:max-w-xl"
              side="left"
            >
              <SheetHeader>
                <SheetTitle>ADICIONAR OFERTA</SheetTitle>
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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium tracking-tight">
            Ofertas • {filteredDeals.length}
          </h4>
          <div className="flex items-center gap-2">
            {selectedRetailer && (
              <>
                <Dialog
                  open={openDialogs['dealsLinkForm']}
                  onOpenChange={(open) => setOpenDialog('dealsLinkForm', open)}
                >
                  <DialogTrigger asChild>
                    {selectedDealIds.length > 0 && selectedRetailer && (
                      <Button variant="outline">
                        Editar ({selectedDealIds.length})
                      </Button>
                    )}
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>ATUALIZAR MÚLTIPLAS OFERTAS</DialogTitle>
                      <DialogDescription>
                        Atualize o cupom e/ou cashback de múltiplas ofertas.
                      </DialogDescription>
                    </DialogHeader>
                    <DealsLinkForm
                      dealIds={selectedDealIds}
                      retailerId={selectedRetailer.id}
                    />
                  </DialogContent>
                </Dialog>

                <Select
                  onValueChange={(value) => {
                    setSelectedCategory(
                      categories.find((category) => category.id === value),
                    )
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent side="top">
                    <SelectItem value={'fdsfasfdsf'}>Todas</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant={'outline'}
                  onClick={() =>
                    selectedDealIds.length === filteredDeals.length
                      ? setSelectedDealIds([])
                      : setSelectedDealIds(filteredDeals.map((deal) => deal.id))
                  }
                >
                  {selectedDealIds.length === filteredDeals.length
                    ? 'Desmarcar todos'
                    : 'Marcar todos'}
                </Button>
              </>
            )}
          </div>
        </div>

        {filteredDeals.length > 0 ? (
          <ScrollArea className="rounded-md border">
            {filteredDeals.map((deal) => (
              <DashboardItemCard.Root
                key={deal.id}
                className={cn('cursor-pointer', {
                  'bg-muted hover:bg-muted': selectedDealIds.includes(deal.id),
                })}
              >
                {selectedRetailer && (
                  <DashboardItemCard.Select
                    checked={selectedDealIds.includes(deal.id)}
                    onCheckedChange={() => onDealSelect(deal.id)}
                  />
                )}

                <DashboardItemCard.Image src={deal.product.imageUrl} alt="" />

                <DashboardItemCard.Content
                  onClick={() => onDealSelect(deal.id)}
                >
                  <p className="text-sm leading-7">
                    {deal.product.name} | {deal.product.category.name}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {deal.retailer.name} •{' '}
                    {priceFormatter.format(
                      priceCalculator(
                        deal.price,
                        deal.coupon?.discount,
                        deal.cashback?.value,
                      ) / 100,
                    )}
                    {deal.coupon &&
                      ` • ${couponFormatter(deal.coupon.discount)} ${
                        deal.coupon.code
                      }`}
                    {deal.cashback &&
                      ` • ${deal.cashback.value}% ${deal.cashback.provider}`}
                  </span>
                </DashboardItemCard.Content>

                <DashboardItemCard.Actions>
                  <Sheet
                    open={openDialogs[`dealUpdateForm.${deal.id}`]}
                    onOpenChange={(open) =>
                      setOpenDialog(`dealUpdateForm.${deal.id}`, open)
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
                        <SheetTitle>EDITAR OFERTA</SheetTitle>
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
        ) : (
          <div className="flex justify-center">
            <p className="text-muted-foreground">Nenhuma oferta encontrada.</p>
          </div>
        )}
      </div>

      <Tabs defaultValue="products">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="retailers">Varejistas</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          {products.length > 0 ? (
            <div className="space-y-4">
              <Input placeholder="Pesquise por um produto..." />
              <ScrollArea className="rounded-md border">
                {products.map((product) => (
                  <DashboardItemCard.Root
                    key={product.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedProduct(product)
                      setSelectedDealIds([])
                      setSelectedCategory(undefined)
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

        <TabsContent value="retailers">
          {retailers.length > 0 ? (
            <div className="space-y-4">
              <Input placeholder="Pesquise por um varejista..." />
              <ScrollArea className="rounded-md border">
                {retailers.map((retailer) => (
                  <DashboardItemCard.Root
                    key={retailer.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedRetailer(retailer)
                      setSelectedDealIds([])
                      setSelectedCategory(undefined)
                    }}
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
                Nenhum varejista encontrado.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
