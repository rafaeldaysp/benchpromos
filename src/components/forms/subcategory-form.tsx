'use client'

import { gql, useMutation, useQuery } from '@apollo/client'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { env } from '@/env.mjs'
import { subcategorySchema } from '@/lib/validations/category'
import { Category } from '@/types'

const CREATE_SUBCATEGORY = gql`
  mutation CreateSubcategory($input: CreateSubcategoryInput!) {
    createSubcategory(createSubcategoryInput: $input) {
      id
    }
  }
`

const UPDATE_SUBCATEGORY = gql`
  mutation UpdateSubcategory($input: UpdateSubcategoryInput!) {
    updateSubcategory(updateSubcategoryInput: $input) {
      id
    }
  }
`

const GET_CATEGORIES = gql`
  query Categories {
    categories {
      id
      name
    }
  }
`

type Inputs = z.infer<typeof subcategorySchema>

const defaultValues: Partial<Inputs> = {
  name: '',
}

interface SubcategoryFormProps {
  mode?: 'create' | 'update'
  subcategory?: { id?: string } & Partial<Inputs>
}

export function SubcategoryForm({
  mode = 'create',
  subcategory,
}: SubcategoryFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(subcategorySchema),
    defaultValues: subcategory ?? defaultValues,
  })

  const { data } = useQuery<{ categories: Omit<Category, 'subcategories'>[] }>(
    GET_CATEGORIES,
    {
      context: {
        headers: {
          'api-key': env.NEXT_PUBLIC_API_KEY,
        },
      },
    },
  )

  const categoryItems = React.useMemo(() => {
    const categoryItems = data?.categories.map((category) => ({
      label: category.name,
      value: category.id,
    }))

    return categoryItems
  }, [data])

  const [mutateSubcategory, { loading: isLoading }] = useMutation(
    mode === 'create' ? CREATE_SUBCATEGORY : UPDATE_SUBCATEGORY,
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

        const message =
          mode === 'create'
            ? 'Subcategoria cadastrada com sucesso.'
            : 'Subcategoria atualizada com sucesso.'

        toast.success(message)
      },
    },
  )

  async function onSubmit(data: Inputs) {
    await mutateSubcategory({
      variables: {
        input: {
          id: subcategory?.id,
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input aria-invalid={!!form.formState.errors.name} {...field} />
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categoryItems?.map((categoryItem) => (
                    <SelectItem
                      key={categoryItem.value}
                      value={categoryItem.value}
                    >
                      {categoryItem.label}
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
          {mode === 'create' ? 'Cadastrar' : 'Atualizar'}
        </Button>
      </form>
    </Form>
  )
}
