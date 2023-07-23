'use client'

import { gql, useMutation } from '@apollo/client'
import { useSuspenseQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
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
import { labelVariants } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { env } from '@/env.mjs'
import { productSchema } from '@/lib/validations/product'
import { type Category } from '@/types'

const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(createProductInput: $input) {
      id
    }
  }
`

const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($input: UpdateProductInput!) {
    updateProduct(updateProductInput: $input) {
      id
    }
  }
`

const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      subcategories {
        id
        name
      }
    }
  }
`

type Inputs = z.infer<typeof productSchema>

const defaultValues: Partial<Inputs> = {
  description: '',
  imageUrl: '',
  name: '',
  reviewUrl: '',
}

interface ProductFormProps {
  mode?: 'create' | 'update'
  product?: { id?: string } & Partial<Inputs>
}

export function ProductForm({ mode = 'create', product }: ProductFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(productSchema),
    defaultValues: product ?? defaultValues,
  })
  const router = useRouter()

  const {
    fields: specsFields,
    append: specsAppend,
    remove: specsRemove,
  } = useFieldArray({
    control: form.control,
    name: 'specs',
  })

  const { data } = useSuspenseQuery<{ categories: Category[] }>(
    GET_CATEGORIES,
    {
      context: {
        headers: {
          'api-key': env.NEXT_PUBLIC_API_KEY,
        },
      },
    },
  )

  const categoryItems = React.useMemo(() => {
    const categoryItems = data?.categories.map((category) => ({
      label: category.name,
      value: category.id,
    }))

    return categoryItems
  }, [data])

  const selectedCategoryId = form.watch('categoryId')

  const subcategoryItems = React.useMemo(() => {
    const subcategoryItems = data?.categories
      .find((category) => category.id === selectedCategoryId)
      ?.subcategories.map((category) => ({
        label: category.name,
        value: category.id,
      }))

    return subcategoryItems
  }, [data, selectedCategoryId])

  const [mutateProduct, { loading: isLoading }] = useMutation(
    mode === 'create' ? CREATE_PRODUCT : UPDATE_PRODUCT,
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

        const message =
          mode === 'create'
            ? 'Produto cadastrado com sucesso.'
            : 'Produto atualizado com sucesso.'

        toast.success(message)
        router.refresh()
      },
    },
  )

  async function onSubmit(data: Inputs) {
    await mutateProduct({
      variables: {
        input: {
          id: product?.id,
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input aria-invalid={!!form.formState.errors.name} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagem</FormLabel>
              <FormControl>
                <Input
                  aria-invalid={!!form.formState.errors.imageUrl}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categoryItems?.map((categoryItem) => (
                    <SelectItem
                      key={categoryItem.value}
                      value={categoryItem.value}
                    >
                      {categoryItem.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subcategoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subcategoria (opcional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger disabled={!selectedCategoryId}>
                    <SelectValue placeholder="" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {subcategoryItems?.map((subcategoryItem) => (
                    <SelectItem
                      key={subcategoryItem.value}
                      value={subcategoryItem.value}
                    >
                      {subcategoryItem.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="referencePrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço de Referência (opcional)</FormLabel>
              <FormControl>
                <Input
                  aria-invalid={!!form.formState.errors.referencePrice}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reviewUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Review (opcional)</FormLabel>
              <FormControl>
                <Input
                  aria-invalid={!!form.formState.errors.reviewUrl}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className={labelVariants()}>Especificações (opcional)</label>
            <div className="space-x-2">
              <Button
                type="button"
                size="icon"
                variant="secondary"
                onClick={() => specsAppend({ title: '', value: '' })}
              >
                <Icons.Plus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                onClick={() => specsRemove(-1)}
              >
                <Icons.Minus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {specsFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-2 gap-x-2">
                <FormField
                  control={form.control}
                  name={`specs.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`specs.${index}.value`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </div>
        </div>

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

        <Button type="submit" disabled={isLoading}>
          {isLoading && (
            <Icons.Spinner
              className="mr-2 h-4 w-4 animate-spin"
              aria-hidden="true"
            />
          )}
          {mode === 'create' ? 'Cadastrar' : 'Atualizar'}
        </Button>
      </form>
    </Form>
  )
}
