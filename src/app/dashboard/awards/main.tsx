'use client'

import { gql, useMutation, useQuery } from '@apollo/client'
import { useState } from 'react'

import { DashboardItemCard } from '@/components/dashboard-item-card'
import { AwardsCategoryForm } from '@/components/forms/create-awards.form'
import { AwardsForm } from '@/components/forms/awards-form'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
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
  type Awards,
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

const DELETE_AWARDS = gql`
  mutation DeleteAwards($id: ID!) {
    removeAwards(id: $id) {
      id
    }
  }
`

const GET_ALL_AWARDS = gql`
  query GetAllAwards {
    allAwards {
      id
      year
      isActive
      showResults
      createdAt
      updatedAt
      categories {
        id
        title
        shortTitle
        icon
        expiredAt
        description
        awardsId
        options {
          id
          title
          brand
          subtitle
          badge
          product {
            id
            imageUrl
            name
          }
          _count {
            votes
          }
        }
      }
    }
  }
`

interface AwardsDashboardMainProps {
  allAwards: (Awards & {
    categories: (AwardsCategory & {
      options: (AwardsCategoryOption & {
        product: Product
      })[]
    })[]
  })[]
}

export function AwardsDashboardMain() {
  const { openDialogs, setOpenDialog } = useFormStore()
  const router = useRouter()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  )
  const [refetchingCategory, setRefetchingCategory] = useState<string | null>(
    null,
  )

  const { data, loading, refetch } = useQuery<{
    allAwards: (Awards & {
      categories: (AwardsCategory & {
        options: (AwardsCategoryOption & {
          product: Product
        })[]
      })[]
    })[]
  }>(GET_ALL_AWARDS, {
    fetchPolicy: 'cache-and-network',
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
  })

  const allAwards = data?.allAwards || []

  const handleRefresh = async () => {
    try {
      await refetch()
      toast.success('Dados atualizados com sucesso.')
    } catch (error) {
      toast.error('Erro ao atualizar dados.')
    }
  }

  const handleToggleCategoryResults = async (categoryId: string) => {
    const isExpanded = expandedCategories.has(categoryId)

    if (isExpanded) {
      // Just collapse
      setExpandedCategories((prev) => {
        const newSet = new Set(prev)
        newSet.delete(categoryId)
        return newSet
      })
    } else {
      // Expand and refetch
      setRefetchingCategory(categoryId)
      try {
        await refetch()
        setExpandedCategories((prev) => new Set(prev).add(categoryId))
        toast.success('Dados atualizados com sucesso.')
      } catch (error) {
        toast.error('Erro ao atualizar dados.')
      } finally {
        setRefetchingCategory(null)
      }
    }
  }

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
    refetchQueries: ['GetAllAwards'],
  })

  const [deleteAwards] = useMutation(DELETE_AWARDS, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      toast.success('Prêmios deletado com sucesso.')
      router.refresh()
    },
    refetchQueries: ['GetAllAwards'],
  })

  const sortedAwards = [...allAwards].sort((a, b) => b.year - a.year)

  if (loading && !data) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-40" />
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-32" />
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Sheet
          open={openDialogs['awardsCreateForm']}
          onOpenChange={(open) => setOpenDialog('awardsCreateForm', open)}
        >
          <SheetTrigger asChild>
            <Button variant="outline">Criar Prêmios</Button>
          </SheetTrigger>
          <SheetContent
            className="w-full space-y-4 overflow-auto sm:max-w-xl"
            side="left"
          >
            <SheetHeader>
              <SheetTitle>CRIAR PRÊMIOS</SheetTitle>
            </SheetHeader>
            <AwardsForm />
          </SheetContent>
        </Sheet>

        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={loading}
        >
          <Icons.Spinner className={cn('size-4', loading && 'animate-spin')} />
        </Button>
      </div>

      {sortedAwards.length > 0 ? (
        <div className="space-y-8">
          {sortedAwards.map((awards) => (
            <Card key={awards.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle>Prêmios {awards.year}</CardTitle>
                    {awards.isActive && <Badge variant="default">Ativo</Badge>}
                    {awards.showResults && (
                      <Badge variant="secondary">Mostrando Resultados</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Sheet
                      open={openDialogs[`awardsUpdateForm.${awards.id}`]}
                      onOpenChange={(open) =>
                        setOpenDialog(`awardsUpdateForm.${awards.id}`, open)
                      }
                    >
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Icons.Edit className="mr-2 size-4" />
                          Editar
                        </Button>
                      </SheetTrigger>
                      <SheetContent
                        className="w-full space-y-4 overflow-auto sm:max-w-xl"
                        side="left"
                      >
                        <SheetHeader>
                          <SheetTitle>EDITAR PRÊMIOS {awards.year}</SheetTitle>
                        </SheetHeader>
                        <AwardsForm mode="update" awards={awards} />
                      </SheetContent>
                    </Sheet>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Icons.Trash className="mr-2 size-4" />
                          Deletar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Essa ação não pode ser desfeita. Isso irá deletar
                            permanentemente os prêmios de {awards.year} e todas
                            as suas categorias.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              deleteAwards({ variables: { id: awards.id } })
                            }
                          >
                            Continuar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {awards.categories.length} categoria(s)
                    </p>
                    <Sheet
                      open={
                        openDialogs[`awardsCategoryCreateForm.${awards.id}`]
                      }
                      onOpenChange={(open) =>
                        setOpenDialog(
                          `awardsCategoryCreateForm.${awards.id}`,
                          open,
                        )
                      }
                    >
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm">
                          Adicionar Categoria
                        </Button>
                      </SheetTrigger>
                      <SheetContent
                        className="w-full space-y-4 overflow-auto sm:max-w-xl"
                        side="left"
                      >
                        <SheetHeader>
                          <SheetTitle>ADICIONAR CATEGORIA</SheetTitle>
                        </SheetHeader>
                        <AwardsCategoryForm awardsId={awards.id} />
                      </SheetContent>
                    </Sheet>
                  </div>

                  {awards.categories.length > 0 ? (
                    <div className="space-y-4">
                      {awards.categories.map((category) => {
                        const totalVotes = category.options.reduce(
                          (sum, option) => sum + (option._count?.votes || 0),
                          0,
                        )

                        const isExpanded = expandedCategories.has(category.id)
                        const isRefetching = refetchingCategory === category.id

                        return (
                          <div
                            key={category.id}
                            className="space-y-3 rounded-lg border p-4"
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  {category.icon && (
                                    <span className="text-lg">
                                      {category.icon}
                                    </span>
                                  )}
                                  <p className="text-sm font-semibold">
                                    {category.title}
                                  </p>
                                </div>
                                {category.shortTitle && (
                                  <p className="text-xs text-muted-foreground">
                                    {category.shortTitle}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Total de votos: {totalVotes}
                                </p>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleToggleCategoryResults(category.id)
                                  }
                                  disabled={isRefetching}
                                  title={
                                    isExpanded
                                      ? 'Ocultar resultados'
                                      : 'Mostrar resultados'
                                  }
                                >
                                  {isRefetching ? (
                                    <Icons.Spinner className="size-4 animate-spin" />
                                  ) : isExpanded ? (
                                    <Icons.EyeOff className="size-4" />
                                  ) : (
                                    <Icons.Eye className="size-4" />
                                  )}
                                </Button>

                                <Sheet
                                  open={
                                    openDialogs[
                                      `awardsCategoryUpdateForm.${category.id}`
                                    ]
                                  }
                                  onOpenChange={(open) =>
                                    setOpenDialog(
                                      `awardsCategoryUpdateForm.${category.id}`,
                                      open,
                                    )
                                  }
                                >
                                  <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <Icons.Edit className="size-4" />
                                    </Button>
                                  </SheetTrigger>
                                  <SheetContent
                                    className="w-full space-y-4 overflow-auto sm:max-w-xl"
                                    side="left"
                                  >
                                    <SheetHeader>
                                      <SheetTitle>EDITAR CATEGORIA</SheetTitle>
                                    </SheetHeader>
                                    <AwardsCategoryForm
                                      mode="update"
                                      awardsCategory={
                                        category as AwardsCategory & {
                                          options: (AwardsCategoryOption & {
                                            product: Product
                                          })[]
                                        }
                                      }
                                      awardsId={awards.id}
                                    />
                                  </SheetContent>
                                </Sheet>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Icons.Trash className="size-4" />
                                    </Button>
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
                                          deleteAwardsCategory({
                                            variables: { id: category.id },
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

                            {isExpanded && category.options.length > 0 && (
                              <div className="space-y-2 pt-2">
                                {Array.from(category.options)
                                  .sort(
                                    (a, b) =>
                                      (b._count?.votes || 0) -
                                      (a._count?.votes || 0),
                                  )
                                  .map((option) => {
                                    const votes = option._count?.votes || 0
                                    const percentage =
                                      totalVotes > 0
                                        ? (votes / totalVotes) * 100
                                        : 0

                                    return (
                                      <div
                                        key={option.id}
                                        className="space-y-1"
                                      >
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="font-medium">
                                            {option.brand && (
                                              <span className="text-muted-foreground">
                                                {option.brand}{' '}
                                              </span>
                                            )}
                                            {option.title ||
                                              option.product.name}
                                            {option.badge && (
                                              <Badge
                                                variant="secondary"
                                                className="ml-2 text-[10px]"
                                              >
                                                {option.badge}
                                              </Badge>
                                            )}
                                          </span>
                                          <span className="font-semibold">
                                            {percentage.toFixed(1)}% ({votes})
                                          </span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                                          <div
                                            className="h-full bg-primary transition-all duration-300"
                                            style={{
                                              width: `${percentage}%`,
                                            }}
                                          />
                                        </div>
                                        {option.subtitle && (
                                          <p className="text-[10px] text-muted-foreground">
                                            {option.subtitle}
                                          </p>
                                        )}
                                      </div>
                                    )
                                  })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex justify-center py-8">
                      <p className="text-sm text-muted-foreground">
                        Nenhuma categoria encontrada.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex justify-center py-8">
          <p className="text-muted-foreground">Nenhum prêmio encontrado.</p>
        </div>
      )}
    </div>
  )
}
