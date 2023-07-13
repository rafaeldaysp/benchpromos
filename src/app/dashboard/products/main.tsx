'use client'

import { gql, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

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
import { Category, Product } from '@/types'

const DELETE_PRODUCT = gql`
  mutation DeleteProduct($productId: String!) {
    removeProduct(id: $productId) {
      id
    }
  }
`

interface ProductsMainProps {
  products: (Product & { category: Pick<Category, 'name'> })[]
}

export function ProductsMain({ products }: ProductsMainProps) {
  const [selectedProduct, setSelectedProduct] =
    React.useState<(typeof products)[0]>()
  const router = useRouter()

  const [deleteProduct] = useMutation(DELETE_PRODUCT, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, clientOptions) {
      toast.error(error.message)
    },
    onCompleted(data, clientOptions) {
      toast.success('Produto deletado com sucesso.')
      router.refresh()
    },
  })

  return (
    <div className="space-y-8">
      {/* Products Actions */}
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
              <SheetTitle>ADICIONAR PRODUTO</SheetTitle>
            </SheetHeader>
            <ProductForm
              mode="create"
              product={{ ...selectedProduct, id: undefined, name: '' }}
            />
          </SheetContent>
        </Sheet>
      </div>

      {selectedProduct && (
        <div className="flex items-start gap-6 rounded-md bg-muted px-8 py-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-md border">
            <Icons.Image />
          </div>
          {/* Content */}
          <div className="flex flex-1 flex-col gap-y-2">
            <p className="text-sm leading-7">{selectedProduct.name}</p>
            <span className="text-xs text-muted-foreground">
              {selectedProduct.category.name}
            </span>
          </div>
          <div className="self-center">
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setSelectedProduct(undefined)}
            >
              <Icons.X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Products */}
      <div className="space-y-4">
        <Input placeholder="Pesquisar por um produto..." />
        <ScrollArea className="rounded-md border bg-primary-foreground">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-start gap-6 rounded-md px-8 py-4 hover:bg-muted"
            >
              <div className="relative flex h-16 w-16 items-center justify-center rounded-md border">
                <Icons.Image />
              </div>

              {/* Content */}
              <div
                className="flex flex-1 cursor-pointer flex-col gap-y-2"
                onClick={() => setSelectedProduct(product)}
              >
                <p className="text-sm leading-7">{product.name}</p>
                <span className="text-xs text-muted-foreground">
                  {product.category.name}
                </span>
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
                      <SheetTitle>EDITAR PRODUTO</SheetTitle>
                    </SheetHeader>
                    <ProductForm mode="update" product={product} />
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
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>
    </div>
  )
}
