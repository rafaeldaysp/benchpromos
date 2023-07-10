'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import * as React from 'react'

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
import { cashbackSchema } from '@/lib/validations/cashback'
import { gql, useMutation, useQuery } from '@apollo/client'
import { Icons } from '../icons'
import { env } from '@/env.mjs'
import { Retailer } from '@/types'

type Inputs = z.infer<typeof cashbackSchema>

const defaultValues: Partial<Inputs> = {
  affiliatedUrl: '',
  percentValue: 0,
  provider: '',
  retailerId: '',
  url: '',
}

export function CashbackForm() {
  const form = useForm<Inputs>({
    resolver: zodResolver(cashbackSchema),
    defaultValues,
  })

  const { data } = useQuery<{ retailers: Retailer[] }>(
    gql`
      query Retailers {
        retailers {
          id
          name
        }
      }
    `,
    {
      context: {
        headers: {
          'api-key': env.NEXT_PUBLIC_API_KEY,
        },
      },
    },
  )

  const retailerItems = React.useMemo(() => {
    const retailerItems = data?.retailers.map((retailer) => ({
      label: retailer.name,
      value: retailer.id,
    }))

    return retailerItems
  }, [data])

  const [createCashback, { loading: isLoading }] = useMutation(
    gql`
      mutation CreateCashback($createCashbackInput: CreateCashbackInput!) {
        createCashback(createCashbackInput: $createCashbackInput) {
          id
        }
      }
    `,
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
        toast.success('Cashback added successfully.')
      },
    },
  )

  async function onSubmit(data: Inputs) {
    console.log(data)

    await createCashback({
      variables: {
        createCashbackInput: data,
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
              <FormLabel>Retailer</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="" />
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
              <FormLabel>Provider</FormLabel>
              <FormControl>
                <Input
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
          name="percentValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Percent Value</FormLabel>
              <FormControl>
                <Input
                  aria-invalid={!!form.formState.errors.percentValue}
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
              <FormLabel>Url</FormLabel>
              <FormControl>
                <Input aria-invalid={!!form.formState.errors.url} {...field} />
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
              <FormLabel>Affiliated Url</FormLabel>
              <FormControl>
                <Input
                  aria-invalid={!!form.formState.errors.affiliatedUrl}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">
          {isLoading && (
            <Icons.Spinner
              className="mr-2 h-4 w-4 animate-spin"
              aria-hidden="true"
            />
          )}
          Cadastrar
        </Button>
      </form>
    </Form>
  )
}
