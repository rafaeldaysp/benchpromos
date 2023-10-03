'client'

import { gql, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from 'react-beautiful-dnd'
import { toast } from 'sonner'

import { DashboardItemCard } from '@/components/dashboard-item-card'
import { SubcategoryForm } from '@/components/forms/subcategory-form'
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
import { type Category } from '@/types'
import { reorder } from '@/utils'

const UPDATE_SUBCATEGORIES_ORDER = gql`
  mutation UpdateSubcategoriesOrder($input: [UpdateSubcategoryInput!]!) {
    updateSubcategories(updateSubcategoriesInput: $input) {
      id
    }
  }
`

const DELETE_SUBCATEGORY = gql`
  mutation DeleteSubcategory($subcategoryId: ID!) {
    removeSubcategory(id: $subcategoryId) {
      id
    }
  }
`

interface SubcategoriesMainProps {
  category: Category
}

export function SubcategoriesMain({ category }: SubcategoriesMainProps) {
  const [subcategories, setSubcategories] = React.useState(
    category.subcategories,
  )
  const { openDialogs, setOpenDialog } = useFormStore()
  const router = useRouter()

  const [updateSubcategoriesOrder] = useMutation(UPDATE_SUBCATEGORIES_ORDER, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      toast.success('Subcategorias reordenadas com sucesso.')
      router.refresh()
    },
  })

  const [deleteSubcategory] = useMutation(DELETE_SUBCATEGORY, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      toast.success('Subcategoria deletada com sucesso.')
      router.refresh()
    },
  })

  React.useEffect(() => {
    setSubcategories(category.subcategories)
  }, [category.subcategories])

  function onDragEnd(result: DropResult) {
    if (!result.destination) {
      return
    }

    const reorderedSubcategories = reorder(
      subcategories,
      result.source.index,
      result.destination.index,
    )

    setSubcategories(reorderedSubcategories)
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* Subcategories Actions */}
      <div className="flex justify-end gap-x-2">
        <Button
          variant="outline"
          onClick={() =>
            updateSubcategoriesOrder({
              variables: {
                input: subcategories.map((subcategory, index) => ({
                  id: subcategory.id,
                  priority: index,
                })),
              },
            })
          }
        >
          Salvar Ordenação
        </Button>

        <Sheet
          open={openDialogs['subcategoryCreateForm']}
          onOpenChange={(open) => setOpenDialog('subcategoryCreateForm', open)}
        >
          <SheetTrigger asChild>
            <Button variant="outline">Adicionar</Button>
          </SheetTrigger>
          <SheetContent
            className="w-full space-y-4 overflow-auto sm:max-w-xl"
            side="left"
          >
            <SheetHeader>
              <SheetTitle>ADICIONAR SUBCATEGORIA</SheetTitle>
            </SheetHeader>
            <SubcategoryForm categoryId={category.id} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Subcategories */}
      {subcategories.length > 0 ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <ScrollArea
            className={cn('rounded-md border bg-muted-foreground/5 p-2', {
              'h-[300px]': subcategories.length > 4,
            })}
          >
            <Droppable droppableId="subcategories-droppable">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {subcategories.map((subcategory, index) => (
                    <Draggable
                      key={subcategory.id}
                      draggableId={subcategory.id}
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
                            <DashboardItemCard.Content>
                              <p className="text-sm leading-7">
                                {subcategory.name}
                              </p>
                            </DashboardItemCard.Content>

                            <DashboardItemCard.Actions>
                              <Sheet
                                open={
                                  openDialogs[
                                    `subcategoryUpdateForm.${subcategory.id}`
                                  ]
                                }
                                onOpenChange={(open) =>
                                  setOpenDialog(
                                    `subcategoryUpdateForm.${subcategory.id}`,
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
                                    <SheetTitle>EDITAR SUBCATEGORIA</SheetTitle>
                                  </SheetHeader>
                                  <SubcategoryForm
                                    mode="update"
                                    categoryId={category.id}
                                    subcategory={subcategory}
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
                                        deleteSubcategory({
                                          variables: {
                                            subcategoryId: subcategory.id,
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
          <p className="text-muted-foreground">
            Nenhuma subcategoria encontrada.
          </p>
        </div>
      )}
    </div>
  )
}
