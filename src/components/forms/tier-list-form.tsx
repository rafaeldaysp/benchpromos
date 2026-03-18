'use client'

import { gql, useMutation } from '@apollo/client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { type z } from 'zod'

import { Check, ChevronsUpDown, X } from 'lucide-react'

import { Icons } from '@/components/icons'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { env } from '@/env.mjs'
import { tierListSchema } from '@/lib/validations/tier-list'
import type { Category } from '@/types'

const CREATE_TIER_LIST = gql`
  mutation CreateTierList($createTierListInput: CreateTierListInput!) {
    createTierList(createTierListInput: $createTierListInput) {
      id
      slug
    }
  }
`

type Inputs = z.infer<typeof tierListSchema>

const defaultValues: Partial<Inputs> = {
  title: '',
  description: '',
  categoryId: '',
  categoryIds: [],
}

interface TierListFormProps {
  categories: Pick<Category, 'id' | 'name'>[]
  onSuccess?: (slug: string) => void
}

export function TierListForm({ categories, onSuccess }: TierListFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(tierListSchema),
    defaultValues,
  })
  const router = useRouter()

  const [createTierList, { loading: isLoading }] = useMutation(
    CREATE_TIER_LIST,
    {
      context: {
        headers: {
          'api-key': env.NEXT_PUBLIC_API_KEY,
        },
      },
      onError(error) {
        toast.error(error.message)
      },
      onCompleted(data) {
        form.reset()
        toast.success('Tier list criada com sucesso.')
        const slug = data.createTierList.slug
        onSuccess?.(slug)
        router.push(`/tier-lists/${slug}`)
        router.refresh()
      },
    },
  )

  async function onSubmit(data: Inputs) {
    const categoryIds =
      data.categoryIds && data.categoryIds.length > 0
        ? data.categoryIds
        : [data.categoryId]

    await createTierList({
      variables: {
        createTierListInput: {
          title: data.title,
          description: data.description || undefined,
          categoryId: categoryIds[0],
          categoryIds,
          tiers: [],
        },
      },
    })
  }

  const selectedCategoryIds = form.watch('categoryIds') ?? []

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Melhores Notebooks 2026"
                  aria-invalid={!!form.formState.errors.title}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Uma breve descrição da tier list..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categorias</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedCategoryIds.length > 0
                        ? `${selectedCategoryIds.length} categoria${selectedCategoryIds.length > 1 ? 's' : ''} selecionada${selectedCategoryIds.length > 1 ? 's' : ''}`
                        : 'Selecione categorias...'}
                      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" side="top">
                  <Command>
                    <CommandInput placeholder="Pesquisar categorias..." />
                    <CommandList>
                      <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-60">
                          {categories.map((category) => {
                            const isSelected = selectedCategoryIds.includes(
                              category.id,
                            )
                            return (
                              <CommandItem
                                key={category.id}
                                value={category.name}
                                onSelect={() => {
                                  const current = field.value ?? []
                                  const updated = isSelected
                                    ? current.filter((id) => id !== category.id)
                                    : [...current, category.id]
                                  field.onChange(updated)
                                  form.setValue('categoryId', updated[0] ?? '')
                                }}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    'mr-2 size-4',
                                    isSelected ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                                {category.name}
                              </CommandItem>
                            )
                          })}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedCategoryIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {selectedCategoryIds.map((id) => {
                    const cat = categories.find((c) => c.id === id)
                    if (!cat) return null
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {cat.name}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="size-4 p-0 hover:bg-transparent"
                          onClick={() => {
                            const updated = selectedCategoryIds.filter(
                              (cid) => cid !== id,
                            )
                            field.onChange(updated)
                            form.setValue('categoryId', updated[0] ?? '')
                          }}
                        >
                          <X className="size-3" />
                        </Button>
                      </Badge>
                    )
                  })}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="button"
          onClick={form.handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading && (
            <Icons.Spinner
              className="mr-2 size-4 animate-spin"
              aria-hidden="true"
            />
          )}
          Criar
        </Button>
      </form>
    </Form>
  )
}
