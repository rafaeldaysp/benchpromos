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
import { Checkbox } from '@/components/ui/checkbox'
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
import { dealSchema } from '@/lib/validations/deal'
import { type Cashback, type Coupon } from '@/types'

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

const GET_COUPONS_AND_CASHBACKS_BY_RETAILER = gql`
  query GetCouponsByRetailer($retailerId: ID) {
    coupons(retailerId: $retailerId) {
      id
      code
    }
    cashbacks(retailerId: $retailerId) {
      id
      provider
      value
    }
  }
`

type Inputs = z.infer<typeof dealSchema>

const defaultValues: Partial<Inputs> = {
  price: 0,
  availability: true,
  url: '',
}

interface DealFormProps {
  mode?: 'create' | 'update'
  productId: string
  retailerId: string
  deal?: { id?: string } & Partial<Inputs>
}

export function DealForm({
  mode = 'create',
  productId,
  retailerId,
  deal,
}: DealFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(dealSchema),
    defaultValues: deal ?? defaultValues,
  })
  const router = useRouter()

  const { data } = useQuery<{
    coupons: Pick<Coupon, 'id' | 'code'>[]
    cashbacks: Pick<Cashback, 'id' | 'provider' | 'value'>[]
  }>(GET_COUPONS_AND_CASHBACKS_BY_RETAILER, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    variables: {
      retailerId,
    },
  })

  const couponItems = React.useMemo(() => {
    const couponItems = data?.coupons.map((coupon) => ({
      label: coupon.code,
      value: coupon.id,
    }))

    return couponItems
  }, [data])

  const cashbackItems = React.useMemo(() => {
    const cashbackItems = data?.cashbacks.map((cashback) => ({
      label: `${cashback.provider} - ${cashback.value}%`,
      value: cashback.id,
    }))

    return cashbackItems
  }, [data])

  const [mutateDeal, { loading: isLoading }] = useMutation(
    mode === 'create' ? CREATE_DEAL : UPDATE_DEAL,
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
            ? 'Anúncio cadastrado com sucesso.'
            : 'Anúncio atualizado com sucesso.'

        toast.success(message)
        router.refresh()
      },
    },
  )

  async function onSubmit(data: Inputs) {
    await mutateDeal({
      variables: {
        input: {
          id: deal?.id,
          productId,
          retailerId,
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
          name="couponId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cupom</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {couponItems?.map((couponItem) => (
                    <SelectItem key={couponItem.value} value={couponItem.value}>
                      {couponItem.label}
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
          name="cashbackId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cashback</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="" />
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
          name="availability"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormLabel>Disponibilidade</FormLabel>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  // @ts-expect-error ...
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
