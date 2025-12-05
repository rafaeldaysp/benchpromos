'use client'

import { gql, useMutation } from '@apollo/client'
import { useQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { type z } from 'zod'

import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { env } from '@/env.mjs'
import { useDebounce } from '@/hooks/use-debounce'
import { useFormStore } from '@/hooks/use-form-store'
import { cn } from '@/lib/utils'
import { awardsCategorySchema } from '@/lib/validations/awards-category'
import type { AwardsCategory, AwardsCategoryOption, Product } from '@/types'
import Image from 'next/image'
import { DashboardItemCard } from '../dashboard-item-card'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command'
import { Label } from '../ui/label'
import { Skeleton } from '../ui/skeleton'
import { removeNullValues } from '@/utils'

const CREATE_AWARDS_CATEGORY = gql`
  mutation CreateAwardsCategory($input: CreateAwardsCategoryInput!) {
    createAwardsCategory(createAwardsCategoryInput: $input) {
      title
    }
  }
`

const UPDATE_AWARDS_CATEGORY = gql`
  mutation UpdateAwardsCategory($input: UpdateAwardsCategoryInput!) {
    updateAwardsCategory(updateAwardsCategoryInput: $input) {
      id
    }
  }
`

type Inputs = z.infer<typeof awardsCategorySchema>

const defaultValues: Partial<Inputs> = {
  title: '',
  description: '',
  icon: '',
  shortTitle: '',
}

interface AwardsCategoryFormProps {
  mode?: 'create' | 'update'
  awardsId?: string
  awardsCategory?: AwardsCategory & {
    options: (AwardsCategoryOption & {
      product: Pick<Product, 'id' | 'imageUrl' | 'name'>
    })[]
  } & Partial<Inputs>
}

export function AwardsCategoryForm({
  mode = 'create',
  awardsId,
  awardsCategory,
}: AwardsCategoryFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(awardsCategorySchema),
    defaultValues: {
      ...defaultValues,
      ...removeNullValues(awardsCategory),
      awardsId: awardsId || awardsCategory?.awardsId,
    },
  })

  const [selectedProducts, setSelectedProducts] = React.useState<
    (Pick<Product, 'id' | 'imageUrl' | 'name'> & {
      title?: string
      brand?: string
      subtitle?: string
      badge?: string
    })[]
  >(
    awardsCategory?.options.map((option) => ({
      ...option.product,
      title: option.title,
      brand: option.brand ?? undefined,
      subtitle: option.subtitle ?? undefined,
      badge: option.badge ?? undefined,
    })) ?? [],
  )

  const { setOpenDialog } = useFormStore()
  const router = useRouter()

  const [mutateAwardsCategory, { loading: isLoading }] = useMutation(
    mode === 'create' ? CREATE_AWARDS_CATEGORY : UPDATE_AWARDS_CATEGORY,
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
        form.reset()

        setOpenDialog(
          mode === 'create'
            ? 'awardsCategoryCreateForm'
            : `awardsCategoryUpdateForm.${awardsCategory?.id}`,
          false,
        )

        const message =
          mode === 'create'
            ? 'Categoria de prêmio cadastrada com sucesso.'
            : 'Categoria de prêmio atualizada com sucesso.'

        toast.success(message)
        router.refresh()
      },
      refetchQueries: ['GetAllAwards'],
    },
  )
  async function onSubmit(data: Inputs) {
    console.log(data)
    await mutateAwardsCategory({
      variables: {
        input: {
          id: awardsCategory?.id,
          productOptions: selectedProducts.map((product) => ({
            productId: product.id,
            title: product.title ?? product.name,
            brand: product.brand,
            subtitle: product.subtitle,
            badge: product.badge,
          })),
          ...data,
        },
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título da categoria</FormLabel>
              <FormControl>
                <Input
                  placeholder="Melhor notebook gamer (?)"
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
          name="shortTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título Curto (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Gamer"
                  aria-invalid={!!form.formState.errors.shortTitle}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ícone (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="🎮"
                  aria-invalid={!!form.formState.errors.icon}
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
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <>
          <div className="space-y-2">
            <Label>
              Selecionar opções (produtos) • {selectedProducts.length}
            </Label>

            {selectedProducts.map((product) => (
              <DashboardItemCard.Root className="border" key={product.id}>
                <DashboardItemCard.Image src={product.imageUrl} alt="" />

                <DashboardItemCard.Content className="space-y-2">
                  <p className="text-sm leading-7">{product.name}</p>
                  <Input
                    placeholder="Nome do modelo resumido"
                    value={product.title ?? ''}
                    onChange={(e) =>
                      setSelectedProducts((prev) =>
                        prev.map((current) =>
                          current.id == product.id
                            ? { ...current, title: e.target.value }
                            : current,
                        ),
                      )
                    }
                  />
                  <Input
                    placeholder="Marca (opcional)"
                    value={product.brand ?? ''}
                    onChange={(e) =>
                      setSelectedProducts((prev) =>
                        prev.map((current) =>
                          current.id == product.id
                            ? { ...current, brand: e.target.value }
                            : current,
                        ),
                      )
                    }
                  />
                  <Input
                    placeholder="Subtítulo (opcional)"
                    value={product.subtitle ?? ''}
                    onChange={(e) =>
                      setSelectedProducts((prev) =>
                        prev.map((current) =>
                          current.id == product.id
                            ? { ...current, subtitle: e.target.value }
                            : current,
                        ),
                      )
                    }
                  />
                  <Input
                    placeholder="Badge (opcional)"
                    value={product.badge ?? ''}
                    onChange={(e) =>
                      setSelectedProducts((prev) =>
                        prev.map((current) =>
                          current.id == product.id
                            ? { ...current, badge: e.target.value }
                            : current,
                        ),
                      )
                    }
                  />
                </DashboardItemCard.Content>

                <DashboardItemCard.Actions>
                  <DashboardItemCard.Action
                    variant="destructive"
                    icon={Icons.X}
                    onClick={() =>
                      setSelectedProducts((prev) =>
                        prev.filter((selected) => selected.id !== product.id),
                      )
                    }
                    type="button"
                  />
                </DashboardItemCard.Actions>
              </DashboardItemCard.Root>
            ))}
          </div>

          <Combobox setSelectedProducts={setSelectedProducts} />
        </>

        <Button type="submit" disabled={isLoading}>
          {isLoading && (
            <Icons.Spinner
              className="mr-2 size-4 animate-spin"
              aria-hidden="true"
            />
          )}
          {mode === 'create' ? 'Criar' : 'Atualizar'}
        </Button>
      </form>
    </Form>
  )
}

const GET_PRODUCTS_BY_SEARCH = gql`
  query GetProductsBySearch($input: GetProductsInput) {
    productsList: products(getProductsInput: $input) {
      categorySlug: slug
      products {
        id
        name
        imageUrl
        slug
        category {
          name
          slug
        }
        subcategory {
          name
        }
      }
    }
  }
`

type SearchedProduct = {
  id: string
  name: string
  imageUrl: string
  slug: string
  category: {
    name: string
    slug: string
  }
  subcategory: {
    name: string
  }
}

function Combobox({
  setSelectedProducts,
}: {
  setSelectedProducts: React.Dispatch<
    React.SetStateAction<Pick<Product, 'id' | 'name' | 'imageUrl'>[]>
  >
}) {
  const [query, setQuery] = React.useState('')
  const debouncedQuery = useDebounce(query, 200)
  const [data, setData] = React.useState<{
    categorySlug: string
    products: SearchedProduct[]
  } | null>(null)
  const [isPending, startTransition] = React.useTransition()

  const { refetch } = useQuery<{
    productsList: {
      categorySlug: string
      products: SearchedProduct[]
    }
  }>(GET_PRODUCTS_BY_SEARCH, {
    skip: true,
    fetchPolicy: 'network-only',
    refetchWritePolicy: 'overwrite',
  })

  const products = data?.products ?? []

  React.useEffect(() => {
    if (debouncedQuery.trim().length === 0) setData(null)

    if (debouncedQuery.trim().length > 1) {
      startTransition(async () => {
        const { data } = await refetch({
          input: {
            search: debouncedQuery,
            sortBy: 'relevance',
            pagination: {
              limit: 5,
              page: 1,
            },
          },
        })
        setData({
          categorySlug: data.productsList.categorySlug,
          products: data.productsList.products,
        })
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  return (
    <Command>
      <CommandInput
        placeholder="Procurar produtos..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty
          className={cn(isPending ? 'hidden' : 'py-6 text-center text-sm')}
        >
          Nenhum produto encontrado.
        </CommandEmpty>
        {isPending && products.length === 0 ? (
          <div className="space-y-1 overflow-hidden px-1 py-2">
            <Skeleton className="h-20 rounded-sm" />
            <Skeleton className="h-20 rounded-sm" />
          </div>
        ) : (
          products.length > 0 && (
            <CommandGroup heading="Sugestões">
              {products?.map((product) => (
                <CommandItem
                  key={product.id}
                  value={`${product.name.replace(/"/g, '')} ${product.category.name} ${product.subcategory?.name}`}
                  className="h-16 space-x-4"
                  onSelect={() => {
                    setSelectedProducts((prev) =>
                      prev.some((value) => value.id === product.id)
                        ? prev
                        : [...prev, product],
                    )
                  }}
                >
                  <div className="relative aspect-square h-full">
                    <Image
                      src={product.imageUrl}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-contain"
                    />
                  </div>

                  <span className="line-clamp-2">
                    {product.name.replace(/"/g, '”')}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )
        )}
      </CommandList>
    </Command>
  )
}
