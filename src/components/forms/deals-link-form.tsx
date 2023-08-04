'use clint'

import { env } from '@/env.mjs'
import { dealsLinkSchema } from '@/lib/validations/deal'
import { type Cashback, type Coupon } from '@/types'
import { gql, useMutation, useSuspenseQuery } from '@apollo/client'
import { toast } from 'sonner'
import { type z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFormStore } from '@/hooks/use-form-store'
import { useRouter } from 'next/navigation'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Button } from '../ui/button'
import { Icons } from '../icons'
import { couponFormatter } from '@/utils/formatter'

const GET_COUPONS_AND_CASHBACKS = gql`
  query GetCoupons($retailerId: ID) {
    coupons(retailerId: $retailerId) {
      id
      code
      discount
      availability
      retailerId
      minimumSpend
    }
    cashbacks(retailerId: $retailerId) {
      id
      provider
      value
      retailerId
    }
  }
`

const UPDATE_DEALS = gql`
  mutation UpdateDeals($input: AssignCouponAndCashbackToManyInput!) {
    updateManyDeals(updateManyInput: $input)
  }
`

type Inputs = z.infer<typeof dealsLinkSchema>

interface DealsLinkFormProps {
  retailerId: string
  dealsId: string[]
}

export default function DealsLinkForm({
  retailerId,
  dealsId,
}: DealsLinkFormProps) {
  const { data } = useSuspenseQuery<{
    coupons: Omit<Coupon, 'description'>[]
    cashbacks: Omit<Cashback, 'affiliatedUrl'>[]
  }>(GET_COUPONS_AND_CASHBACKS, {
    variables: {
      retailerId,
    },
  })

  const coupons = data?.coupons
  const cashbacks = data?.cashbacks

  const form = useForm<Inputs>({
    resolver: zodResolver(dealsLinkSchema),
  })
  const { setOpenDialog } = useFormStore()
  const router = useRouter()

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
      toast.success('Cupom e cashback vinculados com sucesso')
      router.refresh()
    },
  })

  async function onSubmit({ cashbackId, couponId }: Inputs) {
    await mutateDeals({
      variables: {
        input: {
          dealsId,
          cashbackId: cashbackId?.includes('null') ? null : cashbackId,
          couponId: couponId?.includes('null') ? null : couponId,
        },
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="couponId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cupom</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cupom" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={'null'}>Nenhum</SelectItem>
                  {coupons?.map((coupon) => (
                    <SelectItem key={coupon.id} value={coupon.id}>
                      {coupon.code} • {couponFormatter(coupon.discount)}
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
                    <SelectValue placeholder="Selecione um cashback" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={'null'}>Nenhum</SelectItem>
                  {cashbacks?.map((cashback) => (
                    <SelectItem key={cashback.id} value={cashback.id}>
                      {cashback.provider} • {cashback.value}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          Vincular
        </Button>
      </form>
    </Form>
  )
}
