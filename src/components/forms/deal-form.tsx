'use client'

import { gql, useMutation } from '@apollo/client'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { env } from '@/env.mjs'
import { dealSchema } from '@/lib/validations/deal'
import { Checkbox } from '@/components/ui/checkbox'

const CREATE_DEAL = gql`
  mutation CreateDeal($input: CreateDealInput!) {
    createDeal(createDealInput: $input) {
      id
    }
  }
`

const UPDATE_DEAL = gql`
  mutation UpdateDeal($input: UpdateDealInput!) {
    updateDeal(updateDealInput: $input) {
      id
    }
  }
`

const GET_COUPONS_BY_RETAILER = gql``

const GET_CASHBACKS_BY_RETAILER = gql``

type Inputs = z.infer<typeof dealSchema>

const defaultValues: Partial<Inputs> = {}

interface DealFormProps {
  mode?: 'create' | 'update'
  productId: string
  retailerId: string
  deal?: { id?: string } & Partial<Inputs>
}

export function DealForm({ mode = 'create', deal }: DealFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(dealSchema),
    defaultValues: deal ?? defaultValues,
  })

  const [mutateDeal, { loading: isLoading }] = useMutation(
    mode === 'create' ? CREATE_DEAL : UPDATE_DEAL,
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
            ? 'Anúncio cadastrado com sucesso.'
            : 'Anúncio atualizado com sucesso.'

        toast.success(message)
      },
    },
  )

  async function onSubmit(data: Inputs) {
    await mutateDeal({
      variables: {
        input: {
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
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço</FormLabel>
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
              <FormLabel>Quantidade de Parcelas</FormLabel>
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
              <FormLabel>Preço Parcelado</FormLabel>
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
          name="availability"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormLabel>Disponibilidade</FormLabel>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  // @ts-ignore
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sku</FormLabel>
              <FormControl>
                <Input aria-invalid={!!form.formState.errors.sku} {...field} />
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
