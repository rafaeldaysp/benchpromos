'client'

import { gql, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

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
import { Category } from '@/types'

const DELETE_SUBCATEGORY = gql`
  mutation DeleteSubcategory($subcategoryId: String!) {
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
    onError(error, clientOptions) {
      toast.error(error.message)
    },
    onCompleted(data, clientOptions) {
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
            <div
              key={subcategory.id}
              className="flex items-start gap-6 rounded-md px-8 py-4 hover:bg-muted/20"
            >
              {/* Content */}
              <div className="flex flex-1 flex-col gap-y-2">
                <p className="text-sm leading-7">{subcategory.name}</p>
              </div>

              {/* Subcategory Actions */}
              <div className="flex gap-2 self-center">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Icons.Edit className="h-4 w-4" />
                    </Button>
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
                    <Button variant="destructive" size="icon">
                      <Icons.Trash className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete your account and remove your data from our
                        servers.
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
              </div>
            </div>
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
