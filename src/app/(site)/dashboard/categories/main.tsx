'use client'

import { gql, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import {
  DragDropContext,
  Draggable,
  Droppable,
  resetServerContext,
  type DropResult,
} from 'react-beautiful-dnd'
import { toast } from 'sonner'

import { DashboardItemCard } from '@/components/dashboard-item-card'
import { CategoryForm } from '@/components/forms/category-form'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { env } from '@/env.mjs'
import { useFormStore } from '@/hooks/use-form-store'
import { cn } from '@/lib/utils'
import { type Category, type Filter } from '@/types'
import { reorder } from '@/utils'
import { FiltersMain } from './filters-main'
import { SubcategoriesMain } from './subcategories-main'

const UPDATE_CATEGORIES_ORDER = gql`
  mutation UpdateCategoriesOrder($input: [UpdateCategoryInput!]!) {
    updateCategories(updateCategoriesInput: $input) {
      id
    }
  }
`

const DELETE_CATEGORY = gql`
  mutation DeleteCategory($categoryId: ID!) {
    removeCategory(id: $categoryId) {
      id
    }
  }
`

interface CategoriesMainProps {
  categories: (Category & { filters: Omit<Filter, 'categoryId'>[] })[]
}

export function CategoriesMain({
  categories: initialCategories,
}: CategoriesMainProps) {
  resetServerContext()

  const [categories, setCategories] = React.useState(initialCategories)
  const [selectedCategory, setSelectedCategory] =
    React.useState<(typeof categories)[number]>()
  const { openDialogs, setOpenDialog } = useFormStore()
  const router = useRouter()

  const [updateCategoriesOrder] = useMutation(UPDATE_CATEGORIES_ORDER, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      toast.success('Categorias reordenadas com sucesso.')
      router.refresh()
    },
  })

  const [deleteCategory] = useMutation(DELETE_CATEGORY, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      toast.success('Categoria deletada com sucesso.')
      router.refresh()
    },
  })

  // update states only after server refresh
  React.useEffect(() => {
    setCategories(initialCategories)

    setSelectedCategory((prev) =>
      initialCategories.find((category) => category.id === prev?.id),
    )
  }, [initialCategories])

  function onDragEnd(result: DropResult) {
    if (!result.destination) {
      return
    }

    const reorderedCategories = reorder(
      categories,
      result.source.index,
      result.destination.index,
    )

    setCategories(reorderedCategories)
  }

  return (
    <div className="space-y-8">
      {/* Categories Actions */}
      <div className="flex justify-end gap-x-2">
        <Button
          variant="outline"
          onClick={() =>
            updateCategoriesOrder({
              variables: {
                input: categories.map((category, index) => ({
                  id: category.id,
                  priority: index,
                })),
              },
            })
          }
        >
          Salvar Ordenação
        </Button>

        <Sheet
          open={openDialogs['categoryCreateForm']}
          onOpenChange={(open) => setOpenDialog('categoryCreateForm', open)}
        >
          <SheetTrigger asChild>
            <Button variant="outline">Adicionar</Button>
          </SheetTrigger>
          <SheetContent
            className="w-full space-y-4 overflow-auto sm:max-w-xl"
            side="left"
          >
            <SheetHeader>
              <SheetTitle>ADICIONAR CATEGORIA</SheetTitle>
            </SheetHeader>
            <CategoryForm />
          </SheetContent>
        </Sheet>
      </div>

      {selectedCategory && (
        <div className="space-y-2">
          <DashboardItemCard.Root className="border">
            <DashboardItemCard.Content>
              <p className="text-sm leading-7">{selectedCategory.name}</p>
            </DashboardItemCard.Content>

            <DashboardItemCard.Actions>
              <DashboardItemCard.Action
                variant="destructive"
                icon={Icons.X}
                onClick={() => setSelectedCategory(undefined)}
              />
            </DashboardItemCard.Actions>
          </DashboardItemCard.Root>

          <Tabs defaultValue="subcategories" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="subcategories">Subcategorias</TabsTrigger>
              <TabsTrigger value="filters">Filtros</TabsTrigger>
            </TabsList>

            <TabsContent value="subcategories" className="ml-4">
              <SubcategoriesMain category={selectedCategory} />
            </TabsContent>

            <TabsContent value="filters" className="ml-4">
              <FiltersMain category={selectedCategory} />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <ScrollArea
            className={cn('rounded-md border bg-muted-foreground/5 p-2', {
              'h-[600px]': categories.length > 8,
            })}
          >
            <Droppable droppableId="categories-droppable">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {categories.map((category, index) => (
                    <Draggable
                      key={category.id}
                      draggableId={category.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          className="mb-2"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <DashboardItemCard.Root>
                            <DashboardItemCard.Content
                              className="cursor-pointer"
                              onClick={() => setSelectedCategory(category)}
                            >
                              <p className="text-sm leading-7">
                                {category.name}
                              </p>
                            </DashboardItemCard.Content>

                            <DashboardItemCard.Actions>
                              <Sheet
                                open={
                                  openDialogs[
                                    `categoryUpdateForm.${category.id}`
                                  ]
                                }
                                onOpenChange={(open) =>
                                  setOpenDialog(
                                    `categoryUpdateForm.${category.id}`,
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
                                    <SheetTitle>EDITAR CATEGORIA</SheetTitle>
                                  </SheetHeader>
                                  <CategoryForm
                                    mode="update"
                                    category={category}
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
                                    <AlertDialogTitle>
                                      Você tem certeza?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Essa ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        deleteCategory({
                                          variables: {
                                            categoryId: category.id,
                                          },
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
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </ScrollArea>
        </DragDropContext>
      ) : (
        <div className="flex justify-center">
          <p className="text-muted-foreground">Nenhuma categoria encontrada.</p>
        </div>
      )}
    </div>
  )
}
