'use client'

import { gql, useMutation } from '@apollo/client'
import { useQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { env } from '@/env.mjs'
import { useDebounce } from '@/hooks/use-debounce'
import { useFormStore } from '@/hooks/use-form-store'
import { cn } from '@/lib/utils'
import { benchmarkResultSchema } from '@/lib/validations/benchmark'
import type { Benchmark, Product } from '@/types'
import Image from 'next/image'
import { DashboardItemCard } from '../dashboard-item-card'
import { Checkbox } from '../ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command'
import { Label } from '../ui/label'
import { ScrollArea } from '../ui/scroll-area'
import { Skeleton } from '../ui/skeleton'

const CREATE_BENCHMARK_RESULT = gql`
  mutation CreateBenchmarkResult($input: CreateBenchmarkResultInput!) {
    createBenchmarkResult(createBenchmarkResultInput: $input) {
      id
    }
  }
`

const UPDATE_BENCHMARK_RESULT = gql`
  mutation UpdateBenchmarkResult($input: UpdateBenchmarkResultInput!) {
    updateBenchmarkResult(updateBenchmarkResultInput: $input) {
      id
    }
  }
`

const GET_BENCHMARKS = gql`
  query GetBenchmarks {
    benchmarks {
      id
      name
    }
  }
`

type Inputs = z.infer<typeof benchmarkResultSchema>

const defaultValues: Partial<Inputs> = {
  description: '',
  unit: 'FPS',
}

interface BenchmarkResultFormProps {
  mode?: 'create' | 'update'
  benchmarkResult?: {
    id?: string
    products?: Pick<Product, 'id' | 'imageUrl' | 'name'>[]
  } & Partial<Inputs>
}

export function BenchmarkResultForm({
  mode = 'create',
  benchmarkResult,
}: BenchmarkResultFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(benchmarkResultSchema),
    defaultValues: {
      ...defaultValues,
      ...benchmarkResult,
    },
  })

  const [selectedProducts, setSelectedProducts] = React.useState<
    Pick<Product, 'id' | 'imageUrl' | 'name'>[]
  >(benchmarkResult?.products ?? [])

  const { setOpenDialog } = useFormStore()
  const router = useRouter()

  const { data } = useQuery<{
    benchmarks: Benchmark[]
  }>(GET_BENCHMARKS)

  const benchmarkItems = React.useMemo(() => {
    const benchmarkItems = data?.benchmarks.map((benchmark) => ({
      label: benchmark.name,
      value: benchmark.id,
    }))

    return benchmarkItems
  }, [data])

  const [mutateBenchmarkResult, { loading: isLoading }] = useMutation(
    mode === 'create' ? CREATE_BENCHMARK_RESULT : UPDATE_BENCHMARK_RESULT,
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
            ? `benchmarkResultCreateForm.${benchmarkResult?.benchmarkId}`
            : `benchmarkResultUpdateForm.${benchmarkResult?.id}`,
          false,
        )

        const message =
          mode === 'create'
            ? 'Resultado cadastrado com sucesso.'
            : 'Resultado atualizado com sucesso.'

        toast.success(message)
        router.refresh()
      },
      refetchQueries: ['GetBenchmarksWithResults'],
    },
  )
  async function onSubmit(data: Inputs) {
    await mutateBenchmarkResult({
      variables: {
        input: {
          id: benchmarkResult?.id,
          productsIds: selectedProducts.map((product) => product.id),
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
          name="benchmarkId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Benchmark</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um benchmark" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <ScrollArea className="h-[600px]">
                    {benchmarkItems?.map((benchmarkItem) => (
                      <SelectItem
                        key={benchmarkItem.value}
                        value={benchmarkItem.value}
                      >
                        {benchmarkItem.label}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="productAlias"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome público do produto</FormLabel>
              <FormControl>
                <Input
                  placeholder="Dell G15 RTX 3050 I5..."
                  aria-invalid={!!form.formState.errors.productAlias}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-x-2">
          <FormField
            control={form.control}
            name="result"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resultado</FormLabel>
                <FormControl>
                  <NumericFormat
                    customInput={Input}
                    displayType="input"
                    placeholder="100"
                    decimalScale={0}
                    value={field.value ? field.value : undefined}
                    onValueChange={({ floatValue }) =>
                      field.onChange(floatValue ?? 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medida</FormLabel>
                <FormControl>
                  <Input
                    placeholder="FPS"
                    aria-invalid={!!form.formState.errors.unit}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="video"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vídeo (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://youtube.com/embed/<id>"
                  aria-invalid={!!form.formState.errors.video}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hidden"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start justify-between space-x-3 space-y-0">
              <FormLabel>Privado</FormLabel>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
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

        <div className="space-y-2">
          <Label>Vincular produtos • {selectedProducts.length}</Label>

          {selectedProducts.map((product) => (
            <DashboardItemCard.Root className="border" key={product.id}>
              <DashboardItemCard.Image src={product.imageUrl} alt="" />

              <DashboardItemCard.Content>
                <p className="text-sm leading-7">{product.name}</p>
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

        <Button type="submit" disabled={isLoading}>
          {isLoading && (
            <Icons.Spinner
              className="mr-2 size-4 animate-spin"
              aria-hidden="true"
            />
          )}
          {mode === 'create' ? 'Cadastrar' : 'Atualizar'}
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
                  value={`${product.name} ${product.category.name} ${product.subcategory?.name}`}
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

                  <span className="line-clamp-2">{product.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )
        )}
      </CommandList>
    </Command>
  )
}
