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
import { env } from '@/env.mjs'
import { useFormStore } from '@/hooks/use-form-store'
import { cashbackSchema } from '@/lib/validations/cashback'
import type { Retailer } from '@/types'

const CREATE_CASHBACK = gql`
  mutation CreateCashback($input: CreateCashbackInput!) {
    createCashback(createCashbackInput: $input) {
      id
    }
  }
`

const UPDATE_CASHBACK = gql`
  mutation UpdateCashback($input: UpdateCashbackInput!) {
    updateCashback(updateCashbackInput: $input) {
      id
    }
  }
`

const GET_RETAILERS = gql`
  query GetRetailers {
    retailers {
      id
      name
    }
  }
`

type Inputs = z.infer<typeof cashbackSchema>

const defaultValues: Partial<Inputs> = {
  affiliatedUrl: '',
  provider: '',
  url: '',
  video: '',
}

interface CashbackFormProps {
  mode?: 'create' | 'update'
  cashback?: { id?: string } & Partial<Inputs>
}

export function CashbackForm({ mode = 'create', cashback }: CashbackFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(cashbackSchema),
    defaultValues: {
      ...defaultValues,
      ...cashback,
    },
  })
  const { setOpenDialog } = useFormStore()
  const router = useRouter()

  const { data } = useQuery<{ retailers: Retailer[] }>(GET_RETAILERS, {
    fetchPolicy: 'network-only',
  })

  const retailerItems = React.useMemo(() => {
    const retailerItems = data?.retailers.map((retailer) => ({
      label: retailer.name,
      value: retailer.id,
    }))

    return retailerItems
  }, [data])

  const [mutateCashback, { loading: isLoading }] = useMutation(
    mode === 'create' ? CREATE_CASHBACK : UPDATE_CASHBACK,
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
            ? 'cashbackCreateForm'
            : `cashbackUpdateForm.${cashback?.id}`,
          false,
        )

        const message =
          mode === 'create'
            ? 'Cashback cadastrado com sucesso.'
            : 'Cashback atualizado com sucesso.'

        toast.success(message)
        router.refresh()
      },
    },
  )

  async function onSubmit(data: Inputs) {
    await mutateCashback({
      variables: {
        input: {
          id: cashback?.id,
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
          name="retailerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Varejista</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um varejista" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {retailerItems?.map((retailerItem) => (
                    <SelectItem
                      key={retailerItem.value}
                      value={retailerItem.value}
                    >
                      {retailerItem.label}
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
          name="provider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provedor</FormLabel>
              <FormControl>
                <Input
                  placeholder="Cuponomia"
                  aria-invalid={!!form.formState.errors.provider}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor (%)</FormLabel>
              <FormControl>
                <NumericFormat
                  customInput={Input}
                  displayType="input"
                  placeholder="5"
                  decimalScale={1}
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
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Página do Cashback</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://www.cuponomia.com.br"
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
          name="affiliatedUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link de Afiliado</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://www.cuponomia.com.br/ref/<id>"
                  aria-invalid={!!form.formState.errors.affiliatedUrl}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="video"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vídeo (Opcional)</FormLabel>
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
