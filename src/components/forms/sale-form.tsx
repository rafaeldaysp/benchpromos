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
import { PriceInput } from '@/components/price-input'
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
import { useFormStore } from '@/hooks/use-form-store'
import { saleSchema } from '@/lib/validations/sale'
import type { Cashback, Category } from '@/types'

const saleLabels = ['LANÇAMENTO', 'BAIXOU', 'PREÇÃO', 'PARCELADO']

const CREATE_SALE = gql`
  mutation ($input: CreateSaleInput!) {
    createSale(createSaleInput: $input) {
      id
    }
  }
`

const UPDATE_SALE = gql`
  mutation ($input: UpdateSaleInput!) {
    updateSale(updateSaleInput: $input) {
      id
    }
  }
`

const GET_CATEGORIES_AND_CASHBACKS = gql`
  query GetCategories {
    categories {
      id
      name
    }
    cashbacks {
      id
      provider
      value
    }
  }
`

type Inputs = z.infer<typeof saleSchema>

const defaultValues: Partial<Inputs> = {
  caption: '',
  coupon: '',
  imageUrl: '',
  label: '',
  review: '',
  title: '',
  url: '',
}

interface SaleFormProps {
  mode?: 'create' | 'update'
  productSlug?: string | null
  sale?: { id?: string } & Partial<Inputs>
}

export function SaleForm({
  mode = 'create',
  productSlug,
  sale,
}: SaleFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      ...defaultValues,
      ...sale,
    },
  })
  const { setOpenDialog } = useFormStore()
  const router = useRouter()

  const { data } = useQuery<{
    categories: Omit<Category, 'subcategories'>[]
    cashbacks: Pick<Cashback, 'id' | 'provider' | 'value'>[]
  }>(GET_CATEGORIES_AND_CASHBACKS, {
    fetchPolicy: 'network-only',
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
  })

  const categoryItems = React.useMemo(() => {
    const categoryItems = data?.categories.map((category) => ({
      label: category.name,
      value: category.id,
    }))

    return categoryItems
  }, [data])

  const cashbackItems = React.useMemo(() => {
    const cashbackItems = data?.cashbacks.map((cashback) => ({
      label: `${cashback.provider} • ${cashback.value}%`,
      value: cashback.id,
    }))

    return cashbackItems
  }, [data])

  const [mutateSale, { loading: isLoading }] = useMutation(
    mode === 'create' ? CREATE_SALE : UPDATE_SALE,
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
          mode === 'create' ? 'saleCreateForm' : `saleUpdateForm.${sale?.id}`,
          false,
        )

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
          productSlug,
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
                  placeholder="Dell G15 5530 I5 13450HX..."
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
                  placeholder="https://media.discordapp.net/attachments/**/*.png"
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
                <PriceInput
                  placeholder="4.447,00"
                  value={field.value ? field.value / 100 : undefined}
                  onValueChange={({ floatValue }) =>
                    field.onChange(~~((floatValue ?? 0) * 100))
                  }
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
                <Input
                  placeholder="https://tidd.ly/<id>"
                  aria-invalid={!!form.formState.errors.url}
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
                <PriceInput
                  placeholder="4.447,00"
                  value={field.value ? field.value / 100 : undefined}
                  onValueChange={({ floatValue }) =>
                    field.onChange(~~((floatValue ?? 0) * 100))
                  }
                />
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
                <NumericFormat
                  customInput={Input}
                  displayType="input"
                  placeholder="12"
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
                Preencha com as especifições do produto ou uma informação
                essencial sobre a promoção.
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
                  placeholder="BENCHPROMOSGM"
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
          name="cashbackId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cashback (opcional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cashback" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {cashbackItems?.map((cashbackItem) => (
                    <SelectItem
                      key={cashbackItem.value}
                      value={cashbackItem.value}
                    >
                      {cashbackItem.label}
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
          name="review"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comentários (opcional)</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormDescription>
                Adicione comentários extras sobre a promoção, cupom, cashback
                etc.
              </FormDescription>
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
