'use client'

import { gql, useMutation } from '@apollo/client'
import { useSuspenseQuery } from '@apollo/experimental-nextjs-app-support/ssr'
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
import { Textarea } from '@/components/ui/textarea'
import { env } from '@/env.mjs'
import { useFormStore } from '@/hooks/use-form-store'
import { couponSchema } from '@/lib/validations/coupon'
import { type Retailer } from '@/types'

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
  const form = useForm<Inputs>({
    resolver: zodResolver(couponSchema),
    defaultValues: coupon ?? defaultValues,
  })
  const { setOpenDialog } = useFormStore()
  const router = useRouter()

  const { data } = useSuspenseQuery<{ retailers: Retailer[] }>(GET_RETAILERS, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
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
            ? 'couponCreateForm'
            : `couponUpdateForm.${coupon?.id}`,
          false,
        )

        const message =
          mode === 'create'
            ? 'Cupom cadastrado com sucesso.'
            : 'Cupom atualizado com sucesso.'

        toast.success(message)
        router.refresh()
      },
    },
  )

  async function onSubmit(data: Inputs) {
    await mutateCoupon({
      variables: {
        input: {
          id: coupon?.id,
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
              <FormLabel>Aunciante</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um anunciante" />
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
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código</FormLabel>
              <FormControl>
                <Input aria-invalid={!!form.formState.errors.code} {...field} />
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
              <FormLabel>
                Desconto (&quot;5&quot; para R$ 5,00 ou &quot;5%&quot; para 5%)
              </FormLabel>
              <FormControl>
                <Input
                  aria-invalid={!!form.formState.errors.discount}
                  {...field}
                />
              </FormControl>
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
                <Input
                  aria-invalid={!!form.formState.errors.minimumSpend}
                  {...field}
                />
              </FormControl>
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
