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
import { Checkbox } from '@/components/ui/checkbox'
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
import { env } from '@/env.mjs'
import { useFormStore } from '@/hooks/use-form-store'
import { dealSchema } from '@/lib/validations/deal'
import type { Cashback, Coupon, Discount } from '@/types'
import { couponFormatter } from '@/utils/formatter'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { ScrollArea } from '../ui/scroll-area'
import { DiscountFormDialog } from './discount-form'
import { DiscountSelector } from '../discount-selector'

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
    discounts(retailerId: $retailerId) {
      id
      label
      discount
      retailerId
    }
  }
`

type Inputs = z.infer<typeof dealSchema>

const defaultValues: Partial<Inputs> = {
  url: '',
  sku: '',
  availability: true,
}

interface DealFormProps {
  mode?: 'create' | 'update'
  productId: string
  retailerId: string
  deal?: { id?: string } & Partial<Inputs> & {
      discounts?: Discount[]
    }
}

export function DealForm({
  mode = 'create',
  productId,
  retailerId,
  deal,
}: DealFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      ...defaultValues,
      ...deal,
    },
  })
  const { setOpenDialog } = useFormStore()
  const router = useRouter()

  const { data } = useQuery<{
    coupons: Pick<Coupon, 'id' | 'code' | 'discount'>[]
    cashbacks: Pick<Cashback, 'id' | 'provider' | 'value'>[]
    discounts: Discount[]
  }>(GET_COUPONS_AND_CASHBACKS_BY_RETAILER, {
    fetchPolicy: 'network-only',
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

  const discountItems = React.useMemo(() => {
    const discountItems = data?.discounts.map((discount) => ({
      label: `${discount.discount} ${discount.label}`,
      value: discount.id,
    }))

    return discountItems
  }, [data])

  const [selectedDiscounts, setSelectedDiscounts] = React.useState<Discount[]>(
    deal?.discounts ?? [],
  )

  function handleDiscountChange(discountIds: string[]) {
    form.setValue('discountIds', discountIds)
  }

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

        setOpenDialog(
          mode === 'create' ? 'dealCreateForm' : `dealUpdateForm.${deal?.id}`,
          false,
        )

        const message =
          mode === 'create'
            ? 'Oferta cadastrada com sucesso.'
            : 'Oferta atualizada com sucesso.'

        toast.success(message)
        router.refresh()
      },
    },
  )

  async function onSubmit({ cashbackId, couponId, ...data }: Inputs) {
    await mutateDeal({
      variables: {
        input: {
          id: deal?.id,
          productId,
          retailerId,
          cashbackId: cashbackId === 'none' ? null : cashbackId,
          couponId: couponId === 'none' ? null : couponId,
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
                  <ScrollArea className="h-80">
                    <SelectItem value="none">Nenhum</SelectItem>
                    {couponItems?.map((couponItem) => (
                      <SelectItem
                        key={couponItem.value}
                        value={couponItem.value}
                      >
                        {couponItem.label}
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
                  <ScrollArea className="h-80">
                    <SelectItem value="none">Nenhum</SelectItem>
                    {cashbackItems?.map((cashbackItem) => (
                      <SelectItem
                        key={cashbackItem.value}
                        value={cashbackItem.value}
                      >
                        {cashbackItem.label}
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
          name="discountIds"
          render={() => (
            <FormItem>
              <FormLabel>Descontos</FormLabel>
              <div className="flex w-full gap-2">
                <FormControl className="w-full">
                  <DiscountSelector
                    discounts={data?.discounts ?? []}
                    onSelectionChange={handleDiscountChange}
                    selectedDiscounts={selectedDiscounts}
                    setSelectedDiscounts={setSelectedDiscounts}
                  />
                </FormControl>
                <DiscountFormDialog />
              </div>
              <FormDescription>
                Selecione todos os descontos que se aplicam a este produto.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="availability"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start justify-between space-x-3 space-y-0">
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
          name="retailerIsSeller"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start justify-between space-x-3 space-y-0">
              <FormLabel>Vendido pela própria loja</FormLabel>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  defaultChecked
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
              <FormLabel>
                SKU (opcional){' '}
                <Popover>
                  <PopoverTrigger className="size-5 rounded-full bg-primary text-center">
                    ?
                  </PopoverTrigger>
                  <PopoverContent className="p-2 text-sm">
                    Casas Bahia, Extra, Ponto, Fastshop, Lenovo, AliExpress
                  </PopoverContent>
                </Popover>
              </FormLabel>
              <FormControl>
                <Input aria-invalid={!!form.formState.errors.sku} {...field} />
              </FormControl>
              <FormDescription>Identificador interno.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading && (
            <Icons.Spinner
              className="size-4 mr-2 animate-spin"
              aria-hidden="true"
            />
          )}
          {mode === 'create' ? 'Cadastrar' : 'Atualizar'}
        </Button>
      </form>
    </Form>
  )
}
