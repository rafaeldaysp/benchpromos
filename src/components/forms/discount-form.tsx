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
import type { Retailer } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { ScrollArea } from '../ui/scroll-area'
import { discountSchema } from '@/lib/validations/discount'

const CREATE_DISCOUNT = gql`
  mutation CreateDiscount($input: CreateDiscountInput!) {
    createDiscount(createDiscountInput: $input) {
      id
    }
  }
`

const UPDATE_DISCOUNT = gql`
  mutation UpdateDiscount($input: UpdateDiscountInput!) {
    updateDiscount(updateDiscountInput: $input) {
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

type Inputs = z.infer<typeof discountSchema>

const defaultValues: Partial<Inputs> = {
  label: '',
  description: '',
  discount: '',
}

interface DiscountFormProps {
  mode?: 'create' | 'update'
  discount?: { id?: string } & Partial<Inputs>
}

export function DiscountForm({ mode = 'create', discount }: DiscountFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      ...defaultValues,
      ...discount,
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

  const [mutateDiscount, { loading: isLoading }] = useMutation(
    mode === 'create' ? CREATE_DISCOUNT : UPDATE_DISCOUNT,
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
            ? 'discountCreateForm'
            : `discountUpdateForm.${discount?.id}`,
          false,
        )

        const message =
          mode === 'create'
            ? 'Desconto cadastrado com sucesso.'
            : 'Desconto atualizado com sucesso.'

        toast.success(message)
        router.refresh()
      },
      refetchQueries: ['GetSaleFormData'],
    },
  )

  async function onSubmit(data: Inputs) {
    await mutateDiscount({
      variables: {
        input: {
          id: discount?.id,
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
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label</FormLabel>
              <FormControl>
                <Input
                  placeholder="Moedas"
                  aria-invalid={!!form.formState.errors.label}
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (opcional)</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormDescription>
                Detalhes sobre funcionamento e restrições do desconto.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="button"
          onClick={form.handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading && (
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

export function DiscountFormDialog() {
  const { openDialogs, setOpenDialog } = useFormStore()
  return (
    <Dialog
      open={openDialogs['discountCreateForm']}
      onOpenChange={(open) => setOpenDialog('discountCreateForm', open)}
    >
      <DialogTrigger asChild>
        <Button type="button" size={'icon'}>
          <Icons.Plus className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full space-y-4 overflow-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>ADICIONAR DESCONTO</DialogTitle>
        </DialogHeader>
        <DiscountForm />
      </DialogContent>
    </Dialog>
  )
}
