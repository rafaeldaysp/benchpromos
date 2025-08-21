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
import type { Cashback, Category, Coupon, Discount, Retailer } from '@/types'
import { couponFormatter } from '@/utils/formatter'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'
import { ScrollArea } from '../ui/scroll-area'
import { Switch } from '../ui/switch'
import { CashbackFormDialog } from './cashback-form'
import { CategoryFormDialog } from './category-form'
import { CouponFormDialog } from './coupon-form'
import { RetailerFormDialog } from './retailer-form'
import { DiscountSelector } from '../discount-selector'
import { DiscountFormDialog } from './discount-form'

const saleLabels = [
  'LANÇAMENTO',
  'BAIXOU',
  'PREÇÃO',
  'PARCELADO',
  'SORTEIO',
  'HISTÓRICO',
  'PREÇO HISTÓRICO',
]

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
      discounts {
        id
        label
        discount
        retailerId
      }
    }
  }
`

const GET_DATA = gql`
  query GetSaleFormData {
    categories {
      id
      name
    }
    cashbacks {
      id
      provider
      value
      retailer {
        id
        name
      }
    }
    coupons {
      id
      code
      discount
      retailer {
        id
        name
      }
    }
    discounts {
      id
      label
      discount
      retailerId
    }

    retailers {
      id
      name
    }
  }
`

type Inputs = z.infer<typeof saleSchema>

const defaultValues: Partial<Inputs> = {
  caption: '',
  coupon: '',
  couponId: 'none',
  cashbackId: 'none',
  imageUrl: '',
  review: '',
  tag: '',
  title: '',
  url: '',
  sponsored: false,
}

interface SaleFormProps {
  mode?: 'create' | 'update'
  productSlug?: string | null
  sale?: { id?: string } & Partial<Inputs> & {
      discounts?: Discount[]
    }
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

  const { data, loading: isSaleFormDataLoading } = useQuery<{
    categories: Omit<Category, 'subcategories'>[]
    cashbacks: (Pick<Cashback, 'id' | 'provider' | 'value'> & {
      retailer: Retailer
    })[]
    coupons: (Pick<Coupon, 'id' | 'code' | 'discount'> & {
      retailer: Retailer
    })[]
    discounts: Discount[]
    retailers: { id: string; name: string }[]
  }>(GET_DATA, {
    fetchPolicy: 'network-only',
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
  })

  const [createDealSwitch, setCreateDealSwitch] = React.useState(false)
  const [selectedDiscounts, setSelectedDiscounts] = React.useState<Discount[]>(
    sale?.discounts ?? [],
  )

  function handleDiscountChange(discountIds: string[]) {
    form.setValue('discountIds', discountIds)
  }

  const categoryItems = React.useMemo(() => {
    const categoryItems = data?.categories.map((category) => ({
      label: category.name,
      value: category.id,
    }))

    return categoryItems
  }, [data])

  const selectedRetailerId = form.watch('retailerId')

  function getCouponsByRetailerId() {
    return data?.coupons
      .filter(
        (coupon) =>
          !selectedRetailerId || selectedRetailerId == coupon.retailer.id,
      )
      .map((coupon) => ({
        label: `${coupon.code} • ${couponFormatter(coupon.discount)} • ${
          coupon.retailer.name
        }`,
        value: coupon.id,
      }))
  }

  function getCashbacksByRetailerId() {
    return data?.cashbacks
      .filter(
        (cashback) =>
          !selectedRetailerId || selectedRetailerId == cashback.retailer.id,
      )
      .map((cashback) => ({
        label: `${cashback.provider} • ${cashback.value}% • ${cashback.retailer.name}`,
        value: cashback.id,
      }))
  }

  function getDiscountsByRetailerId() {
    return (
      data?.discounts.filter(
        (discount) =>
          !selectedRetailerId || selectedRetailerId == discount.retailerId,
      ) ?? []
    )
  }

  const retailerItems = React.useMemo(() => {
    const retailerItems = data?.retailers.map((retailer) => ({
      label: retailer.name,
      value: retailer.id,
    }))

    return retailerItems
  }, [data])

  function onRetailerChange(_retailerId: string) {
    form.setValue('discountIds', [])
    form.setValue('couponId', 'none')
    form.setValue('cashbackId', 'none')
    setSelectedDiscounts([])
  }

  const [mutateSale, { loading: isLoading }] = useMutation(
    mode === 'create' ? CREATE_SALE : UPDATE_SALE,
    {
      context: {
        headers: {
          'api-key': env.NEXT_PUBLIC_API_KEY,
        },
      },
      refetchQueries: ['GetDashboardSales', 'GetSales'],
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

  async function onSubmit({ label, cashbackId, couponId, ...data }: Inputs) {
    await mutateSale({
      variables: {
        input: {
          id: sale?.id,
          productSlug,
          label: label === 'none' ? null : label,
          cashbackId: cashbackId === 'none' ? null : cashbackId,
          couponId: couponId === 'none' ? null : couponId,
          discountIds: selectedDiscounts.map((discount) => discount.id),
          createDeal: createDealSwitch,
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
          name="tag"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tag (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="HOT"
                  aria-invalid={!!form.formState.errors.tag}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Uma palavra que aparecerá antes do título no card da promoção
              </FormDescription>
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
              <div className="flex gap-2">
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSaleFormDataLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      {isSaleFormDataLoading && (
                        <Icons.Spinner
                          className="size-4 mr-2 animate-spin"
                          aria-hidden="true"
                        />
                      )}
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <ScrollArea className="h-80">
                      {categoryItems?.map((categoryItem) => (
                        <SelectItem
                          key={categoryItem.value}
                          value={categoryItem.value}
                        >
                          {categoryItem.label}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
                <CategoryFormDialog />
              </div>
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
          name="retailerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Varejista</FormLabel>
              <div className="flex gap-2">
                <Select
                  onValueChange={(e) => {
                    field.onChange(e)
                    onRetailerChange(e)
                  }}
                  defaultValue={field.value}
                  disabled={isSaleFormDataLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      {isSaleFormDataLoading && (
                        <Icons.Spinner
                          className="size-4 mr-2 animate-spin"
                          aria-hidden="true"
                        />
                      )}
                      <SelectValue placeholder="Selecione um varejista" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <ScrollArea className="h-80">
                      {retailerItems?.map((retailerItem) => (
                        <SelectItem
                          key={retailerItem.value}
                          value={retailerItem.value}
                        >
                          {retailerItem.label}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
                <RetailerFormDialog />
              </div>
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
                  <SelectItem value="none">Nenhum</SelectItem>
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
              <FormLabel className="flex text-warning">
                <Icons.AlertCircle className="size-3 mr-2" /> Cupom (antigo)
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="NÃO USE ESSE CAMPO"
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
          name="couponId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cupom (opcional)</FormLabel>
              <div className="flex gap-2">
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={
                    !form.getValues('retailerId') || isSaleFormDataLoading
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      {isSaleFormDataLoading && (
                        <Icons.Spinner
                          className="size-4 mr-2 animate-spin"
                          aria-hidden="true"
                        />
                      )}
                      <SelectValue placeholder="Selecione um cupom" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <ScrollArea className="h-80">
                      <SelectItem value="none">Nenhum</SelectItem>
                      {getCouponsByRetailerId()?.map((couponItem) => (
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
                <CouponFormDialog />
              </div>
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
              <div className="flex gap-2">
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={
                    !form.getValues('retailerId') || isSaleFormDataLoading
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      {isSaleFormDataLoading && (
                        <Icons.Spinner
                          className="size-4 mr-2 animate-spin"
                          aria-hidden="true"
                        />
                      )}
                      <SelectValue placeholder="Selecione um cashback" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <ScrollArea className="h-80">
                      <SelectItem value="none">Nenhum</SelectItem>
                      {getCashbacksByRetailerId()?.map((cashbackItem) => (
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
                <CashbackFormDialog />
              </div>
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
                    discounts={getDiscountsByRetailerId()}
                    onSelectionChange={handleDiscountChange}
                    disabled={
                      !form.getValues('retailerId') || isSaleFormDataLoading
                    }
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
          name="sponsored"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start justify-between space-x-3 space-y-0">
              <FormLabel>Patrocinado</FormLabel>
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
        {productSlug && (
          <div className="flex w-full items-center justify-between gap-x-2 sm:w-fit">
            <Switch id="createDeal" onCheckedChange={setCreateDealSwitch} />
            <Label className="w-max text-sm" htmlFor="createDeal">
              Criar oferta para o produto
            </Label>
          </div>
        )}

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
