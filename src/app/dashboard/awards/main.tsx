'use client'

import { gql, useMutation } from '@apollo/client'

import { DashboardItemCard } from '@/components/dashboard-item-card'
import { AwardsCategoryForm } from '@/components/forms/create-awards.form'
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
import { useFormStore } from '@/hooks/use-form-store'
import { cn } from '@/lib/utils'
import {
  type AwardsCategory,
  type AwardsCategoryOption,
  type Product,
  type AwardsCategoryOptionVote,
} from '@/types'
import { env } from '@/env.mjs'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const DELETE_AWARDS_CATEGORY = gql`
  mutation DeleteAwardsCategory($id: ID!) {
    removeAwardsCategory(id: $id) {
      id
    }
  }
`

interface AwardsDashboardMainProps {
  awardsCategories: (AwardsCategory & {
    options: (AwardsCategoryOption & {
      product: Product
      votes: AwardsCategoryOptionVote[]
    })[]
  })[]
}

export function AwardsDashboardMain({
  awardsCategories,
}: AwardsDashboardMainProps) {
  const { openDialogs, setOpenDialog } = useFormStore()
  const router = useRouter()

  const [deleteAwardsCategory] = useMutation(DELETE_AWARDS_CATEGORY, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      toast.success('Categoria de prêmios deletada com sucesso.')
      router.refresh()
    },
  })

  return (
    <div className="space-y-8">
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
          <AwardsCategoryForm />
        </SheetContent>
      </Sheet>
      {awardsCategories.length > 0 ? (
        <ScrollArea
          className={cn('rounded-md border', {
            'h-[600px]': awardsCategories.length > 8,
          })}
        >
          {awardsCategories.map((awardsCategory) => (
            <DashboardItemCard.Root key={awardsCategory.id}>
              <DashboardItemCard.Content
                className="cursor-pointer"
                // onClick={() => setSelectedCategory(category)}
              >
                <p className="text-sm leading-7">{awardsCategory.title}</p>
              </DashboardItemCard.Content>

              <DashboardItemCard.Actions>
                <Sheet
                  open={
                    openDialogs[`awardsCategoryUpdateForm.${awardsCategory.id}`]
                  }
                  onOpenChange={(open) =>
                    setOpenDialog(
                      `awardsCategoryUpdateForm.${awardsCategory.id}`,
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
                    <AwardsCategoryForm
                      mode="update"
                      awardsCategory={awardsCategory}
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
                          deleteAwardsCategory({
                            variables: { id: awardsCategory.id },
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
            Nenhuma recomendação encontrado.
          </p>
        </div>
      )}
    </div>
  )
}
