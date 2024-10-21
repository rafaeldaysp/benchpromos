'use client'

import { gql, useMutation, useSuspenseQuery } from '@apollo/client'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

import { DashboardItemCard } from '@/components/dashboard-item-card'
import { DashboardProducts } from '@/components/dashboard-products'
import { ProductFiltersForm } from '@/components/forms/product-filters-form'
import { ProductForm } from '@/components/forms/product-form'
import { RecommendedProductForm } from '@/components/forms/recommended-product-form'
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
import { env } from '@/env.mjs'
import { useFormStore } from '@/hooks/use-form-store'
import { useQueryString } from '@/hooks/use-query-string'
import { cn } from '@/lib/utils'
import type { Category, Filter, Product } from '@/types'
import { FileUploaderDialog } from '@/components/files/file-uploader-dialog'

const DELETE_PRODUCT = gql`
  mutation DeleteProduct($productId: ID!) {
    removeProduct(id: $productId) {
      id
    }
  }
`

const UPADTE_SUGGESTIONS = gql`
  mutation ($updateProductInput: UpdateProductInput!) {
    updateProduct(updateProductInput: $updateProductInput) {
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

  const [productSuggestions, setProductSuggestions] = React.useState<
    (Product & { category: { name: string } })[]
  >([])

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

  const [updateSuggestions, { loading: isUpdatind }] = useMutation(
    UPADTE_SUGGESTIONS,
    {
      context: {
        headers: {
          'api-key': env.NEXT_PUBLIC_API_KEY,
        },
      },
      refetchQueries: ['GetProductSuggestions'],
      onError(error, _clientOptions) {
        toast.error(error.message)
      },
      onCompleted(_data, _clientOptions) {
        toast.success('Sugestões atualizadas com sucesso.')
      },
    },
  )

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
      <div className="flex flex-col justify-between gap-2 sm:flex-row">
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
          <SelectTrigger className="w-full sm:w-60">
            <SelectValue placeholder="Selecione a ordem dos produtos" />
          </SelectTrigger>
          <SelectContent className="w-full sm:w-60">
            {selectOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-col justify-end gap-2 sm:flex-row">
          {selectedProduct && (
            <>
              <FileUploaderDialog path={selectedProduct.slug} />
              <Dialog
                open={openDialogs['recommendedProductForm']}
                onOpenChange={(open) =>
                  setOpenDialog('recommendedProductForm', open)
                }
              >
                <DialogTrigger asChild>
                  <Button variant="outline">Recomendar</Button>
                </DialogTrigger>

                <DialogContent className="">
                  <DialogHeader>
                    <DialogTitle>RECOMENDAR</DialogTitle>
                  </DialogHeader>

                  <RecommendedProductForm productId={selectedProduct.id} />
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                disabled={isUpdatind}
                onClick={() =>
                  updateSuggestions({
                    variables: {
                      updateProductInput: {
                        id: selectedProduct.id,
                        suggestionSlugs: productSuggestions.map(
                          (product) => product.slug,
                        ),
                      },
                    },
                  })
                }
              >
                Salvar Sugestões
                {isUpdatind && (
                  <Icons.Spinner className="h-4 w-4 animate-spin" />
                )}
              </Button>
              <Dialog
                open={openDialogs['productFiltersForm']}
                onOpenChange={(open) =>
                  setOpenDialog('productFiltersForm', open)
                }
              >
                <DialogTrigger asChild>
                  <Button variant="outline">Editar Filtros</Button>
                </DialogTrigger>

                <DialogContent className="">
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
            </>
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

      {selectedProduct && (
        <Suggestions
          slug={selectedProduct?.slug}
          suggestions={productSuggestions}
          setSuggestions={setProductSuggestions}
        />
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
                {selectedProduct && product.id !== selectedProduct.id && (
                  <DashboardItemCard.Action
                    icon={Icons.Plus}
                    onClick={() =>
                      setProductSuggestions((prev) => [
                        ...prev.filter((p) => p.id !== product.id),
                        product,
                      ])
                    }
                  />
                )}

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

const GET_SUGGESTIONS = gql`
  query GetProductSuggestions($slug: ID!) {
    productSuggestions(slug: $slug) {
      id
      slug
      imageUrl
      name
      category {
        name
      }
    }
  }
`

function Suggestions({
  slug,
  suggestions,
  setSuggestions,
}: {
  slug: string
  suggestions: (Product & {
    category: {
      name: string
    }
  })[]
  setSuggestions: React.Dispatch<
    React.SetStateAction<
      (Product & {
        category: {
          name: string
        }
      })[]
    >
  >
}) {
  const { data } = useSuspenseQuery<{
    productSuggestions: (Product & { category: { name: string } })[]
  }>(GET_SUGGESTIONS, {
    variables: {
      slug,
    },
  })
  const serverProducts = data.productSuggestions
  const products = suggestions

  React.useEffect(() => {
    setSuggestions(serverProducts)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverProducts])

  if (suggestions.length === 0) return

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold  ">Sugeridos • {products.length}</h2>
      <ScrollArea
        className={cn('rounded-md border', {
          'h-[400px]': products.length > 4,
        })}
      >
        {products.map((product) => (
          <DashboardItemCard.Root key={product.id} className="cursor-pointer">
            <DashboardItemCard.Image src={product.imageUrl} alt="" />

            <DashboardItemCard.Content>
              <p className="text-sm leading-7">{product.name}</p>
              <span className="text-xs text-muted-foreground">
                {product.category.name}
              </span>
            </DashboardItemCard.Content>

            <DashboardItemCard.Actions>
              <DashboardItemCard.Action
                icon={Icons.Minus}
                onClick={() =>
                  setSuggestions((prev) =>
                    prev.filter((p) => p.slug !== product.slug),
                  )
                }
              />
            </DashboardItemCard.Actions>
          </DashboardItemCard.Root>
        ))}
      </ScrollArea>
    </div>
  )
}
