'use client'

import { gql, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

import { DashboardItemCard } from '@/components/dashboard-item-card'
import { RecommendationCategoryForm } from '@/components/forms/recommendation-category-form'
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
import { useFormStore } from '@/hooks/use-form-store'
import { cn } from '@/lib/utils'
import { type Product, type RecommendedProduct } from '@/types'
import { priceFormatter } from '@/utils/formatter'

const DELETE_RECOMMENDATION_CATEGORY = gql`
  mutation RemoveRecommendationCategory($id: ID!) {
    removeRecommendationCategory(id: $id) {
      id
    }
  }
`

const DELETE_RECOMMENDED_PRODUCT = gql`
  mutation RemoveRecommendedProduct($id: ID!) {
    removeRecommendedProduct(id: $id) {
      id
    }
  }
`

interface RecommendationMainProps {
  recommendationCategories: {
    id: string
    name: string
    priceRangeProduct: (RecommendedProduct & { product: Product })[]
  }[]
}

export function DashboardRecommendationMain({
  recommendationCategories,
}: RecommendationMainProps) {
  const [selectedCategory, setSelectedCategory] =
    React.useState<(typeof recommendationCategories)[number]>()
  const { openDialogs, setOpenDialog } = useFormStore()
  const router = useRouter()

  const [deleteRecommendationCategory] = useMutation(
    DELETE_RECOMMENDATION_CATEGORY,
    {
      context: {
        headers: {
          'api-key': env.NEXT_PUBLIC_API_KEY,
        },
      },
      onError(error, _clientOptions) {
        toast.error(error.message)
      },
      onCompleted(_data, _clientOptions) {
        toast.success('Cupom deletado com sucesso.')
        router.refresh()
      },
    },
  )

  const [deleteRecommendedProduct] = useMutation(DELETE_RECOMMENDED_PRODUCT, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(data, _clientOptions) {
      toast.success('Recomendação removida com sucesso.')
      setSelectedCategory(data.removeRecommendedProduct)
      router.refresh()
    },
  })

  return (
    <div className="space-y-8">
      <div className="flex justify-end gap-x-2">
        <Sheet
          open={openDialogs['recommendationCategoryCreateForm']}
          onOpenChange={(open) =>
            setOpenDialog('recommendationCategoryCreateForm', open)
          }
        >
          <SheetTrigger asChild>
            <Button variant="outline">Adicionar</Button>
          </SheetTrigger>
          <SheetContent
            className="w-full space-y-4 overflow-auto sm:max-w-xl"
            side="left"
          >
            <SheetHeader>
              <SheetTitle>ADICIONAR CATEGORIA DE RECOMENDAÇÃO</SheetTitle>
            </SheetHeader>
            <RecommendationCategoryForm />
          </SheetContent>
        </Sheet>
      </div>

      {selectedCategory?.priceRangeProduct?.length && (
        <ScrollArea
          className={cn('rounded-md border', {
            'h-[600px]': selectedCategory.priceRangeProduct.length > 8,
          })}
        >
          {selectedCategory.priceRangeProduct.map((recommendedProduct) => (
            <DashboardItemCard.Root key={recommendedProduct.id}>
              <DashboardItemCard.Content className="cursor-pointer">
                <p className="text-sm leading-7">
                  {recommendedProduct.product.name}
                </p>
                <span className="text-xs text-muted-foreground">
                  {priceFormatter.formatRange(
                    recommendedProduct.minPrice / 100,
                    recommendedProduct.maxPrice / 100,
                  )}
                </span>
              </DashboardItemCard.Content>

              <DashboardItemCard.Actions>
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
                          deleteRecommendedProduct({
                            variables: { id: recommendedProduct.id },
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
      )}

      {recommendationCategories.length > 0 ? (
        <ScrollArea
          className={cn('rounded-md border', {
            'h-[600px]': recommendationCategories.length > 8,
          })}
        >
          {recommendationCategories.map((category) => (
            <DashboardItemCard.Root key={category.id}>
              <DashboardItemCard.Content
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                <p className="text-sm leading-7">{category.name}</p>
                <span className="text-xs text-muted-foreground">
                  {category.priceRangeProduct.length} recomendações
                </span>
              </DashboardItemCard.Content>

              <DashboardItemCard.Actions>
                <Sheet
                  open={
                    openDialogs[
                      `recommendationCategoryUpdateForm.${category.id}`
                    ]
                  }
                  onOpenChange={(open) =>
                    setOpenDialog(
                      `recommendationCategoryUpdateForm.${category.id}`,
                      open,
                    )
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
                      <SheetTitle>EDITAR CATEGORIA DE RECOMENDAÇÃO</SheetTitle>
                    </SheetHeader>
                    <RecommendationCategoryForm
                      mode="update"
                      recommendationCategory={category}
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
                          deleteRecommendationCategory({
                            variables: { id: category.id },
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
          <p className="text-muted-foreground">Nenhum cupom encontrado.</p>
        </div>
      )}
    </div>
  )
}
