'use client'

import { gql, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

import { DashboardItemCard } from '@/components/dashboard-item-card'
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { cn } from '@/lib/utils'
import type { Category, Filter } from '@/types'

const CREATE_FILTER = gql`
  mutation CreateFilter($input: CreateFilterInput!) {
    createFilter(createFilterInput: $input) {
      id
    }
  }
`

const UPDATE_FILTER = gql`
  mutation UpdateFilter($input: UpdateFilterInput!) {
    updateFilter(updateFilterInput: $input) {
      id
    }
  }
`

const DELETE_FILTER = gql`
  mutation DeleteFilter($filterId: ID!) {
    removeFilter(id: $filterId) {
      id
    }
  }
`

const CREATE_FILTER_OPTION = gql`
  mutation CreateFilterOption($input: CreateFilterOptionInput!) {
    createFilterOption(createFilterOptionInput: $input) {
      id
    }
  }
`

const DELETE_FILTER_OPTION = gql`
  mutation DeleteFilterOption($filterOptionId: ID!) {
    removeFilterOption(id: $filterOptionId) {
      id
    }
  }
`

interface FiltersMainProps {
  category: Omit<Category, 'subcategories'> & {
    filters: Omit<Filter, 'categoryId'>[]
  }
}

// arquivo ficou grande, posteriormente da pra melhorar ¯\_(ツ)_/¯

export function FiltersMain({ category }: FiltersMainProps) {
  const router = useRouter()

  const [deleteFilter] = useMutation(DELETE_FILTER, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      toast.success('Filtro deletado com sucesso.')
      router.refresh()
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <FilterModal categoryId={category.id} />
      </div>

      {category.filters.length > 0 ? (
        <ScrollArea
          className={cn('rounded-md border bg-muted-foreground/5 p-2', {
            'h-[300px]': category.filters.length > 4,
          })}
        >
          {category.filters.map((filter) => (
            <DashboardItemCard.Root key={filter.id}>
              <DashboardItemCard.Content>
                <p className="text-sm leading-7">{filter.name}</p>
                <span className="text-xs text-muted-foreground">
                  {filter.options.map((option) => option.value).join(' • ')}
                </span>
              </DashboardItemCard.Content>
              <DashboardItemCard.Actions>
                <FilterOptionModal filter={filter} />

                <FilterModal categoryId={category.id} filter={filter} />

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
                          deleteFilter({
                            variables: { filterId: filter.id },
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
          <p className="text-muted-foreground">Nenhum filtro encontrado.</p>
        </div>
      )}
    </div>
  )
}

interface FilterModalProps {
  categoryId: string
  filter?: Pick<Filter, 'id' | 'name'>
}

export function FilterModal({ categoryId, filter }: FilterModalProps) {
  const [filterInput, setFilterInput] = React.useState(filter?.name ?? '')
  const router = useRouter()

  const [mutateFilter, { loading: isLoading }] = useMutation(
    !filter ? CREATE_FILTER : UPDATE_FILTER,
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
        const message = !filter?.id
          ? 'Filtro cadastrado com sucesso.'
          : 'Filtro atualizado com sucesso.'

        setFilterInput('')

        toast.success(message)

        router.refresh()
      },
    },
  )

  return (
    <Dialog>
      <DialogTrigger asChild>
        {!filter ? (
          <Button variant="outline">Adicionar</Button>
        ) : (
          <Button variant="outline" size="icon">
            <Icons.Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {!filter ? 'CRIAR FILTRO' : 'EDITAR FILTRO'}
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <form className="flex gap-x-2">
          <Input
            placeholder="Processador"
            value={filterInput}
            onChange={(e) => setFilterInput(e.target.value)}
          />
          <Button
            type="submit"
            disabled={!filterInput || isLoading}
            onClick={() =>
              mutateFilter({
                variables: {
                  input: {
                    id: filter?.id,
                    name: filterInput,
                    categoryId,
                  },
                },
              })
            }
          >
            {!filter ? 'Cadastrar' : 'Atualizar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface FilterOptionModalProps {
  filter: Omit<Filter, 'categoryId'>
}

export function FilterOptionModal({ filter }: FilterOptionModalProps) {
  const [filterOptionInput, setFilterOptionInput] = React.useState('')
  const router = useRouter()

  const [createFilterOption] = useMutation(CREATE_FILTER_OPTION, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      setFilterOptionInput('')

      toast.success('Opção criada com sucesso.')

      router.refresh()
    },
  })

  const [deleteFilterOption] = useMutation(DELETE_FILTER_OPTION, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      toast.success('Opção deletada com successo.')
      router.refresh()
    },
  })

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Icons.Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        className="w-full space-y-4 overflow-auto sm:max-w-xl"
        side="left"
      >
        <SheetHeader>
          <SheetTitle>ATUALIZAR OPÇÕES DO FILTRO</SheetTitle>
        </SheetHeader>
        <div className="space-y-8">
          <form className="flex gap-x-2" onSubmit={(e) => e.preventDefault()}>
            <Input
              placeholder="I5 13450HX"
              value={filterOptionInput}
              onChange={(e) => setFilterOptionInput(e.target.value)}
            />
            <Button
              type="submit"
              disabled={!filterOptionInput}
              onClick={() =>
                createFilterOption({
                  variables: {
                    input: {
                      filterId: filter.id,
                      value: filterOptionInput,
                    },
                  },
                })
              }
            >
              Adicionar
            </Button>
          </form>
          {filter.options.length > 0 ? (
            <div className="rounded-md border">
              {filter.options?.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between rounded-md px-4 py-2"
                >
                  <p className="text-sm">{option.value}</p>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() =>
                      deleteFilterOption({
                        variables: {
                          filterOptionId: option.id,
                        },
                      })
                    }
                  >
                    <Icons.Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center">
              <p className="text-muted-foreground">Nenhuma opção encontrada.</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
