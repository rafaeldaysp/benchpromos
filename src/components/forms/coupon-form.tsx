'use client'

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
import { Textarea } from '@/components/ui/textarea'
import { useExpireCouponSales } from '@/hooks/use-expire-coupon-sales'
import { useFormStore } from '@/hooks/use-form-store'
import { couponSchema } from '@/lib/validations/coupon'
import type { Retailer } from '@/types'
import { PriceInput } from '../price-input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { ScrollArea } from '../ui/scroll-area'
import { useAuthHeaders } from '@/components/auth-token-provider'

const CREATE_COUPON = gql`
  mutation CreateCoupon($input: CreateCouponInput!) {
    createCoupon(createCouponInput: $input) {
      id
    }
  }
`

const UPDATE_COUPON = gql`
  mutation UpdateCoupon($input: UpdateCouponInput!) {
    updateCoupon(updateCouponInput: $input) {
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

type Inputs = z.infer<typeof couponSchema>

const defaultValues: Partial<Inputs> = {
  code: '',
  description: '',
  discount: '',
  availability: true,
}

interface CouponFormProps {
  mode?: 'create' | 'update'
  coupon?: { id?: string } & Partial<Inputs>
}

export function CouponForm({ mode = 'create', coupon }: CouponFormProps) {
  const authHeaders = useAuthHeaders()
  const form = useForm<Inputs>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      ...defaultValues,
      ...coupon,
    },
  })
  const { setOpenDialog } = useFormStore()
  const router = useRouter()
  const [expireActiveSales, setExpireActiveSales] = React.useState(false)
  const expireActiveSalesId = React.useId()
  const {
    activeSalesCount,
    expireSales,
    isExpiring: isExpiringSales,
  } = useExpireCouponSales(coupon?.id ?? '', mode === 'update' && !!coupon?.id)

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

  const [mutateCoupon, { loading: isLoading }] = useMutation(
    mode === 'create' ? CREATE_COUPON : UPDATE_COUPON,
    {
      context: {
        headers: {
          ...authHeaders,
        },
      },
      onError(error, _clientOptions) {
        toast.error(error.message)
      },
      refetchQueries: ['GetSaleFormData'],
    },
  )

  async function onSubmit(data: Inputs) {
    // onError toasts failures; the promise then resolves without data.
    const { data: result } = await mutateCoupon({
      variables: {
        input: {
          id: coupon?.id,
          ...data,
        },
      },
    })
    if (!result) return

    toast.success(
      mode === 'create'
        ? 'Cupom cadastrado com sucesso.'
        : 'Cupom atualizado com sucesso.',
    )

    // Before closing: closing the sheet unmounts this form.
    if (mode === 'update' && expireActiveSales) await expireSales()

    form.reset()
    setExpireActiveSales(false)
    setOpenDialog(
      mode === 'create' ? 'couponCreateForm' : `couponUpdateForm.${coupon?.id}`,
      false,
    )
    router.refresh()
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
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código</FormLabel>
              <FormControl>
                <Input
                  placeholder="BENCHPROMOSGM"
                  aria-invalid={!!form.formState.errors.code}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="discount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Desconto</FormLabel>
              <FormControl>
                <Input
                  placeholder="5%"
                  aria-invalid={!!form.formState.errors.discount}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Insira 5 para R$ 5,00 ou 5% para 5%.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="minimumSpend"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Mínimo (opcional)</FormLabel>
              <FormControl>
                <PriceInput
                  placeholder="3.999,99"
                  value={field.value ? field.value / 100 : undefined}
                  onValueChange={({ floatValue }) =>
                    field.onChange(~~((floatValue ?? 0) * 100))
                  }
                />
              </FormControl>
              <FormDescription>Valor mínimo para uso do cupom.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maximumDiscount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Desconto Máximo (opcional)</FormLabel>
              <FormControl>
                <PriceInput
                  placeholder="300,00"
                  value={field.value ? field.value / 100 : ''}
                  onValueChange={({ floatValue }) =>
                    field.onChange(
                      floatValue ? Math.round(floatValue * 100) : null,
                    )
                  }
                />
              </FormControl>
              <FormDescription>
                Limite do desconto do cupom. Ex.: 10% com máximo de R$ 300,00.
                Deixe vazio para não limitar.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (opcional)</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormDescription>
                Detalhes sobre funcionamento e restrições do cupom.
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
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {mode === 'update' && (
          <div className="flex items-start justify-between gap-3 rounded-md border p-3">
            <div className="grid gap-1">
              <label
                htmlFor={expireActiveSalesId}
                className="cursor-pointer text-sm font-medium leading-none"
              >
                Expirar promoções com este cupom
              </label>
              <p className="text-xs text-muted-foreground">
                {activeSalesCount === undefined
                  ? 'Contando promoções ativas...'
                  : activeSalesCount === 0
                    ? 'Nenhuma promoção ativa usa este cupom.'
                    : `${activeSalesCount} ${
                        activeSalesCount === 1
                          ? 'promoção ativa será marcada'
                          : 'promoções ativas serão marcadas'
                      } como expirada${
                        activeSalesCount === 1 ? '' : 's'
                      } ao atualizar.`}
              </p>
            </div>
            <Checkbox
              id={expireActiveSalesId}
              checked={expireActiveSales}
              onCheckedChange={(checked) =>
                setExpireActiveSales(checked === true)
              }
              disabled={!activeSalesCount}
            />
          </div>
        )}

        <Button
          type="button"
          onClick={form.handleSubmit(onSubmit)}
          disabled={isLoading || isExpiringSales}
        >
          {(isLoading || isExpiringSales) && (
            <Icons.Spinner
              className="mr-2 size-4 animate-spin"
              aria-hidden="true"
            />
          )}
          {mode === 'create' ? 'Cadastrar' : 'Atualizar'}
        </Button>
      </form>
    </Form>
  )
}

export function CouponFormDialog() {
  const { openDialogs, setOpenDialog } = useFormStore()
  return (
    <Dialog
      open={openDialogs['couponCreateForm']}
      onOpenChange={(open) => setOpenDialog('couponCreateForm', open)}
    >
      <DialogTrigger asChild>
        <Button type="button" size={'icon'}>
          <Icons.Plus className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full space-y-4 overflow-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>ADICIONAR CUPOM</DialogTitle>
        </DialogHeader>
        <CouponForm />
      </DialogContent>
    </Dialog>
  )
}
