'client'

import { gql, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
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
import { type Category } from '@/types'

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
  const router = useRouter()

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

  return (
    <div className="flex flex-col space-y-4">
      {/* Subcategories Actions */}
      <div className="self-end">
        <Sheet>
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
      {category.subcategories.length > 0 ? (
        <ScrollArea className="rounded-md border">
          {category.subcategories.map((subcategory) => (
            <DashboardItemCard.Root key={subcategory.id}>
              <DashboardItemCard.Content>
                <p className="text-sm leading-7">{subcategory.name}</p>
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
                      icon={Icons.Edit}
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
                          deleteSubcategory({
                            variables: { subcategoryId: subcategory.id },
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
          <p className="text-muted-foreground">
            Nenhuma subcategoria encontrada.
          </p>
        </div>
      )}
    </div>
  )
}
