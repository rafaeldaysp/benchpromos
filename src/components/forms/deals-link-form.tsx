'use clint'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { env } from '@/env.mjs'
import { useFormStore } from '@/hooks/use-form-store'
import { dealsLinkSchema } from '@/lib/validations/deal'
import type { Cashback, Coupon } from '@/types'
import { couponFormatter } from '@/utils/formatter'

const UPDATE_DEALS = gql`
  mutation UpdateDeals($input: AssignCouponAndCashbackToManyInput!) {
    updateManyDeals(updateManyInput: $input)
  }
`

const GET_COUPONS_AND_CASHBACKS_BY_RETAILER = gql`
  query GetCouponsAndCashbacksByRetailer($retailerId: ID) {
    coupons(retailerId: $retailerId) {
      id
      code
      discount
    }
    cashbacks(retailerId: $retailerId) {
      id
      provider
      value
    }
  }
`

type Inputs = z.infer<typeof dealsLinkSchema>

interface DealsLinkFormProps {
  retailerId: string
  dealIds: string[]
}

export default function DealsLinkForm({
  retailerId,
  dealIds,
}: DealsLinkFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(dealsLinkSchema),
  })
  const { setOpenDialog } = useFormStore()
  const router = useRouter()

  const { data } = useQuery<{
    coupons: Pick<Coupon, 'id' | 'code' | 'discount'>[]
    cashbacks: Pick<Cashback, 'id' | 'provider' | 'value'>[]
  }>(GET_COUPONS_AND_CASHBACKS_BY_RETAILER, {
    variables: {
      retailerId,
    },
  })

  const couponItems = React.useMemo(() => {
    const couponItems = data?.coupons.map((coupon) => ({
      label: `${coupon.code} • ${couponFormatter(coupon.discount)}`,
      value: coupon.id,
    }))

    return couponItems
  }, [data])

  const cashbackItems = React.useMemo(() => {
    const cashbackItems = data?.cashbacks.map((cashback) => ({
      label: `${cashback.provider} • ${cashback.value}%`,
      value: cashback.id,
    }))

    return cashbackItems
  }, [data])

  const [mutateDeals, { loading: isLoading }] = useMutation(UPDATE_DEALS, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      setOpenDialog('dealsLinkForm', false)
      toast.success('Ofertas atualizadas com sucesso.')
      router.refresh()
    },
  })

  // mudar para dealIds no back
  async function onSubmit({ couponId, cashbackId }: Inputs) {
    await mutateDeals({
      variables: {
        input: {
          dealsId: dealIds,
          couponId: couponId === 'none' ? null : couponId,
          cashbackId: cashbackId === 'none' ? null : cashbackId,
        },
      },
    })
  }

  const selectedCoupon = form.getValues('couponId')
  const selectedCashback = form.getValues('cashbackId')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="couponId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cupom (opcional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cupom" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
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
              <FormLabel>Cashback (opcional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cashback" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
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

        <Button
          type="submit"
          disabled={isLoading || (!selectedCoupon && !selectedCashback)}
        >
          {isLoading && (
            <Icons.Spinner
              className="mr-2 h-4 w-4 animate-spin"
              aria-hidden="true"
            />
          )}
          Salvar
        </Button>
      </form>
    </Form>
  )
}
