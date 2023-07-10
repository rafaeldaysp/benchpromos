'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

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
import { retailerSchema } from '@/lib/validations/retailer'
import { gql, useMutation } from '@apollo/client'
import { env } from '@/env.mjs'

type Inputs = z.infer<typeof retailerSchema>

const defaultValues: Partial<Inputs> = {
  name: '',
}

export function RetailerForm() {
  const form = useForm<Inputs>({
    resolver: zodResolver(retailerSchema),
    defaultValues,
  })

  const [createRetailer, { loading: isLoading }] = useMutation(
    gql`
      mutation CreateRetailer($createRetailerInput: CreateRetailerInput!) {
        createRetailer(createRetailerInput: $createRetailerInput) {
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
        toast.success('Retailer added successfully.')
      },
    },
  )

  async function onSubmit(data: Inputs) {
    await createRetailer({
      variables: {
        createRetailerInput: data,
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provider</FormLabel>
              <FormControl>
                <Input aria-invalid={!!form.formState.errors.name} {...field} />
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
          Cadastrar
        </Button>
      </form>
    </Form>
  )
}
