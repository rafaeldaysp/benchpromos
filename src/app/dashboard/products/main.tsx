'use client'

import { gql, useMutation } from '@apollo/client'
import { useSuspenseQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import * as React from 'react'
import { InView } from 'react-intersection-observer'
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
import { useFormStore } from '@/hooks/use-form-store'
import type { Category, Filter, Product } from '@/types'
import { removeNullValues } from '@/utils'

const PRODUCTS_PER_PAGE = 10

const GET_PRODUCTS = gql`
  query GetProducts($input: GetProductsInput) {
    productsList: products(getProductsInput: $input) {
      pages
      products {
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

export function ProductsMain({ filters }: ProductsMainProps) {
  const [isPending, startTransition] = React.useTransition()
  const { openDialogs, setOpenDialog } = useFormStore()
  const [page, setPage] = React.useState(1)

  const { data, fetchMore } = useSuspenseQuery<{
    productsList: {
      pages: number
      products: (Product & {
        category: Pick<Category, 'name'>
        filters: { optionId: string }[]
      })[]
    }
  }>(GET_PRODUCTS, {
    refetchWritePolicy: 'overwrite',
    variables: {
      input: {
        pagination: {
          limit: PRODUCTS_PER_PAGE,
          page: 1,
        },
      },
    },
  })

  const pageCount = data.productsList.pages
  const initialProducts = data.productsList.products.map((product) =>
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

  const categoryFilters = React.useMemo(
    () =>
      filters.filter(
        (filter) => filter.categoryId === selectedProduct?.categoryId,
      ),
    [filters, selectedProduct],
  )

  function onEntry() {
    startTransition(async () => {
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

      setProducts([
        ...products,
        ...data.productsList.products.map((product) =>
          removeNullValues(product),
        ),
      ])
      setPage((prev) => prev + 1)
    })
  }

  const hasMoreProducts = page < pageCount

  return (
    <div className="space-y-8">
      {/* Products Actions */}
      <div className="flex justify-end gap-x-2">
        {selectedProduct && (
          <Dialog
            open={openDialogs['productFiltersForm']}
            onOpenChange={(open) => setOpenDialog('productFiltersForm', open)}
          >
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

        <Sheet
          open={openDialogs['productCreateForm']}
          onOpenChange={(open) => setOpenDialog('productCreateForm', open)}
        >
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
            <ProductForm product={{ ...selectedProduct, id: undefined }} />
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
          <ScrollArea className="rounded-md border">
            {products.map((product) => (
              <DashboardItemCard.Root key={product.id}>
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
                  <Sheet
                    open={openDialogs[`productUpdateForm.${product.id}`]}
                    onOpenChange={(open) =>
                      setOpenDialog(`productUpdateForm.${product.id}`, open)
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
            {isPending ? (
              <div className="flex justify-center py-4">
                <Icons.Spinner
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              </div>
            ) : (
              <InView
                as="div"
                delay={500}
                hidden={!hasMoreProducts}
                onChange={(_, entry) => {
                  if (entry.isIntersecting) onEntry()
                }}
              />
            )}
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
