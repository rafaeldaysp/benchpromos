'use client'

import { gql, useMutation } from '@apollo/client'
import { useSuspenseQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import * as React from 'react'
import { useInView } from 'react-intersection-observer'
import { toast } from 'sonner'

import { DashboardItemCard } from '@/components/dashboard-item-card'
import { ProductFiltersForm } from '@/components/forms/product-filters-form'
import { ProductForm } from '@/components/forms/product-form'
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { env } from '@/env.mjs'
import type { Category, Filter, Product } from '@/types'
import { removeNullValues } from '@/utils'

const PRODUCTS_PER_PAGE = 1

const GET_PRODUCTS = gql`
  query GetProducts($input: GetProductsInput) {
    products(getProductsInput: $input) {
      id
      name
      imageUrl
      specs
      reviewUrl
      description
      referencePrice
      categoryId
      slug
      subcategoryId
      recommended
      category {
        name
      }
      filters {
        optionId
      }
    }
  }
`

const DELETE_PRODUCT = gql`
  mutation DeleteProduct($productId: ID!) {
    removeProduct(id: $productId) {
      id
    }
  }
`

interface ProductsMainProps {
  filters: Filter[]
}

// esse infinite scroll é uma bomba, cada linha tem seu motivo de ser, tire uma e tudo para de funcionar
// ainda falta atualizar os estados depois aconteceu algum submit (product form ou filter form)

export function ProductsMain({ filters }: ProductsMainProps) {
  const [lastCardRef, , entry] = useInView({ threshold: 1 })
  const [page, setPage] = React.useState(1)
  const [isPending, startTransition] = React.useTransition()

  const { data, fetchMore } = useSuspenseQuery<{
    products: (Product & {
      category: Pick<Category, 'name'>
      filters: { optionId: string }[]
    })[]
  }>(GET_PRODUCTS, {
    variables: {
      input: {
        pagination: {
          limit: PRODUCTS_PER_PAGE,
          page: 1,
        },
      },
    },
  })

  const initialProducts = data.products.map((product) =>
    removeNullValues(product),
  )
  const [products, setProducts] = React.useState(initialProducts)
  const [selectedProduct, setSelectedProduct] =
    React.useState<(typeof products)[number]>()

  const [deleteProduct] = useMutation(DELETE_PRODUCT, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      toast.success('Produto deletado com sucesso.')
    },
  })

  React.useEffect(() => {
    startTransition(async () => {
      if (entry?.isIntersecting) {
        const { data } = await fetchMore({
          variables: {
            input: {
              pagination: {
                limit: PRODUCTS_PER_PAGE,
                page: page + 1,
              },
            },
          },
        })

        if (data.products.length === 0) return

        setProducts([
          ...products,
          ...data.products.map((product) => removeNullValues(product)),
        ])
        setPage((prev) => prev + 1)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry])

  const categoryFilters = React.useMemo(
    () =>
      filters.filter(
        (filter) => filter.categoryId === selectedProduct?.categoryId,
      ),
    [filters, selectedProduct],
  )

  return (
    <div className="space-y-8">
      {/* Products Actions */}
      <div className="flex justify-end gap-x-2">
        {selectedProduct && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Editar Filtros</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>FILTROS</DialogTitle>
              </DialogHeader>
              <ProductFiltersForm
                categoryFilters={categoryFilters}
                productId={selectedProduct.id}
                productFilters={selectedProduct.filters}
              />
            </DialogContent>
          </Dialog>
        )}

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Adicionar</Button>
          </SheetTrigger>
          <SheetContent
            className="w-full space-y-4 overflow-auto sm:max-w-xl"
            side="left"
          >
            <SheetHeader>
              <SheetTitle>ADICIONAR PRODUTO</SheetTitle>
            </SheetHeader>
            <ProductForm
              product={{ ...selectedProduct, id: undefined, name: '' }}
            />
          </SheetContent>
        </Sheet>
      </div>

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

      {/* Products */}
      {products.length > 0 ? (
        <div className="space-y-4">
          <Input placeholder="Pesquise por um produto..." />
          <ScrollArea className="rounded-md border bg-primary-foreground">
            {products.map((product, index) => (
              <DashboardItemCard.Root
                key={product.id}
                ref={index === products.length - 1 ? lastCardRef : undefined}
              >
                <DashboardItemCard.Image src={product.imageUrl} alt="" />

                <DashboardItemCard.Content
                  className="cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <p className="text-sm leading-7">{product.name}</p>
                  <span className="text-xs text-muted-foreground">
                    {product.category.name}
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
                        <SheetTitle>EDITAR PRODUTO</SheetTitle>
                      </SheetHeader>
                      <ProductForm mode="update" product={product} />
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
                            deleteProduct({
                              variables: { productId: product.id },
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
          <p className="text-muted-foreground">Nenhum produto encontrado.</p>
        </div>
      )}
    </div>
  )
}
