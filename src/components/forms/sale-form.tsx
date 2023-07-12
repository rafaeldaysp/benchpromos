'use client'

import { gql, useMutation, useQuery } from '@apollo/client'
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
  FormDescription,
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
import { saleSchema } from '@/lib/validations/sale'
import { Category } from '@/types'

const saleLabels = ['LANÇAMENTO', 'BAIXOU', 'PREÇÃO', 'PARCELADO']

const CREATE_SALE = gql`
  mutation CreateSale($input: CreateSaleInput!) {
    createSale(createSaleInput: $input) {
      id
    }
  }
`

const UPDATE_SALE = gql`
  mutation UpdateSale($input: UpdateSaleInput!) {
    updateSale(updateSaleInput: $input) {
      id
    }
  }
`

const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
    }
  }
`

type Inputs = z.infer<typeof saleSchema>

const defaultValues: Partial<Inputs> = {
  title: '',
  imageUrl: '',
  categoryId: '',
  price: 0,
  url: '',
}

interface SaleFormProps {
  mode?: 'create' | 'update'
  sale?: { id?: string } & Partial<Inputs>
}

export function SaleForm({ mode = 'create', sale }: SaleFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(saleSchema),
    defaultValues: sale ?? defaultValues,
  })
  const router = useRouter()

  const { data } = useQuery<{ categories: Omit<Category, 'subcategories'>[] }>(
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

  const [mutateSale, { loading: isLoading }] = useMutation(
    mode === 'create' ? CREATE_SALE : UPDATE_SALE,
    {
      context: {
        headers: {
          'api-key': env.NEXT_PUBLIC_API_KEY,
        },
      },
      onError(error, clientOptions) {
        toast.error(error.message)
      },
      onCompleted(data, clientOptions) {
        form.reset()

        const message =
          mode === 'create'
            ? 'Promoção cadastrada com sucesso.'
            : 'Promoção atualizada com sucesso.'

        toast.success(message)
        router.refresh()
      },
    },
  )

  async function onSubmit(data: Inputs) {
    await mutateSale({
      variables: {
        input: {
          id: sale?.id,
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
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input
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
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagem</FormLabel>
              <FormControl>
                <Input
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
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
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
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço à Vista</FormLabel>
              <FormControl>
                <Input
                  aria-invalid={!!form.formState.errors.price}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link</FormLabel>
              <FormControl>
                <Input aria-invalid={!!form.formState.errors.url} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="installments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantidade de Parcelas (opcional)</FormLabel>
              <FormControl>
                <Input
                  aria-invalid={!!form.formState.errors.installments}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="totalInstallmentPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço Total Parcelado (opcional)</FormLabel>
              <FormControl>
                <Input
                  aria-invalid={!!form.formState.errors.totalInstallmentPrice}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="caption"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Legenda (opcional)</FormLabel>
              <FormControl>
                <Input
                  aria-invalid={!!form.formState.errors.caption}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Coloque as especificações do produto ou algo de extrema
                importância sobre a promoção.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destaque (opcional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um destaque" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {saleLabels.map((label) => (
                    <SelectItem key={label} value={label}>
                      {label}
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
          name="coupon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cupom (opcional)</FormLabel>
              <FormControl>
                <Input
                  aria-invalid={!!form.formState.errors.coupon}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cashback"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cashback (opcional)</FormLabel>
              <FormControl>
                <Input
                  aria-invalid={!!form.formState.errors.cashback}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="review"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comentários (opcional)</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormDescription>Famoso textinho.</FormDescription>
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
