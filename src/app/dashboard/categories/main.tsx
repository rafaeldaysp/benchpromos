'use client'

import { gql, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

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
import { env } from '@/env.mjs'
import { Category } from '@/types'

const DELETE_CATEGORY = gql`
  mutation RemoveCategory($id: String!) {
    removeCategory(id: $id) {
      id
    }
  }
`

interface CategoriesMainProps {
  categories: Category[]
}

export function CategoriesMain({ categories }: CategoriesMainProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<Category>()
  const router = useRouter()

  const [deleteCategory] = useMutation(DELETE_CATEGORY, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, clientOptions) {
      toast.error(error.message)
    },
    onCompleted(data, clientOptions) {
      toast.success('Categoria deletada com sucesso.')
      router.refresh()
    },
  })

  return (
    <div className="space-y-8">
      {/* Categories Actions */}
      <div className="flex justify-end gap-x-2">
        <Sheet>
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
        <div className="flex items-start gap-6 rounded-md bg-muted px-8 py-4">
          {/* Content */}
          <div className="flex flex-1 flex-col gap-y-2">
            <p className="text-sm leading-7">{selectedCategory.name}</p>
          </div>
          <div className="self-center">
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setSelectedCategory(undefined)}
            >
              <Icons.X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Categories */}
      <ScrollArea className="rounded-md border bg-primary-foreground">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-start gap-6 rounded-md px-8 py-4 hover:bg-muted"
          >
            {/* Content */}
            <div
              className="flex flex-1 cursor-pointer flex-col gap-y-2"
              onClick={() => setSelectedCategory(category)}
            >
              <p className="text-sm leading-7">{category.name}</p>
            </div>

            {/* Product Actions */}
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
                    <SheetTitle>EDITAR CATEGORIA</SheetTitle>
                  </SheetHeader>
                  <CategoryForm mode="update" category={category} />
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
                      This action cannot be undone. This will permanently delete
                      your account and remove your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        deleteCategory({ variables: { id: category.id } })
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
    </div>
  )
}
