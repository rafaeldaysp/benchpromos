'use client'

import { gql, useMutation } from '@apollo/client'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

import { DashboardItemCard } from '@/components/dashboard-item-card'
import { DashboardProducts } from '@/components/dashboard-products'
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
import { env } from '@/env.mjs'
import { useFormStore } from '@/hooks/use-form-store'
import { useQueryString } from '@/hooks/use-query-string'
import type { Category, Filter, Product } from '@/types'

const DELETE_PRODUCT = gql`
  mutation DeleteProduct($productId: ID!) {
    removeProduct(id: $productId) {
      id
    }
  }
`

const selectOptions = [
  {
    label: 'Relevância',
    value: 'relevance',
  },
  {
    label: 'Última atualização',
    value: 'lastUpdate',
  },
]

interface ProductsMainProps {
  filters: Filter[]
}

export function ProductsMain({ filters }: ProductsMainProps) {
  const [isLoading, startTransition] = React.useTransition()
  const router = useRouter()
  const pathname = usePathname()
  const { openDialogs, setOpenDialog } = useFormStore()
  const { createQueryString } = useQueryString()

  const searchParams = useSearchParams()

  const initialSorting = searchParams.get('sort')

  const [selectedProduct, setSelectedProduct] = React.useState<
    Product & {
      category: Pick<Category, 'name'>
      filters: { optionId: string }[]
    }
  >()

  const [deleteProduct] = useMutation(DELETE_PRODUCT, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    refetchQueries: ['GetProducts'],
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

  return (
    <div className="space-y-8">
      {/* Products Actions */}
      <div className="flex justify-between gap-x-2">
        <Select
          defaultValue={
            selectOptions.find((option) => option.value === initialSorting)
              ?.value ?? 'lastUpdate'
          }
          onValueChange={(value) => {
            startTransition(() => {
              router.push(
                `${pathname}?${createQueryString({
                  sort: value === 'relevance' ? value : null,
                })}`,
              )
            })
          }}
        >
          <SelectTrigger className="w-60">
            <SelectValue placeholder="Selecione a ordem dos produtos" />
          </SelectTrigger>
          <SelectContent className="w-60">
            {selectOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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

      <DashboardProducts>
        {({ products }) =>
          products.map((product) => (
            <DashboardItemCard.Root key={product.id}>
              <DashboardItemCard.Image src={product.imageUrl} alt="" />

              <DashboardItemCard.Content
                className="cursor-pointer"
                onClick={() => setSelectedProduct(product)}
              >
                <p className="text-sm leading-7">{product.name}</p>
                <span className="text-xs text-muted-foreground">
                  <div className="space-x-1">
                    {product.category.name} • {` `}
                    {product.filters.map((filter) => (
                      <span key={filter.optionId}>{filter.option.value} •</span>
                    ))}
                    {` `}
                    {product.views} visualizações
                  </div>
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
          ))
        }
      </DashboardProducts>
    </div>
  )
}
