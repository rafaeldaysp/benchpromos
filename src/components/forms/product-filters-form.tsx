'use client'

import { gql, useMutation } from '@apollo/client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { type z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { env } from '@/env.mjs'
import { linkFiltersSchema } from '@/lib/validations/product'
import { Filter } from '@/types'

const LINK_FILTER = gql`
  mutation LinkFilter($input: AssignProductFilterInput!) {
    assignProductFilterOption(assignProductFilterInput: $input) {
      id
    }
  }
`

const UNLINK_FILTER = gql`
  mutation UnlinkFilter($input: AssignProductFilterInput!) {
    removeProductFilterOption(assignProductFilterInput: $input) {
      id
    }
  }
`

type Inputs = z.infer<typeof linkFiltersSchema>

interface ProductFiltersFormProps {
  categoryFilters: Filter[]
  productId: string
  productFilters: { filterOptionId: string }[]
}

// por algum motivo esse componente ta sendo renderizado 5 vezes quando da submit ╰（‵□′）╯

export function ProductFiltersForm({
  categoryFilters,
  productId,
  productFilters,
}: ProductFiltersFormProps) {
  console.log('renderizou')

  // melhorar essa lógica
  const productFilterOptionIds = React.useMemo(() => {
    const productFilterOptionIds = productFilters.map(
      (productFilter) => productFilter.filterOptionId,
    )

    return categoryFilters.map(
      (filter) =>
        filter.options.find((option) =>
          productFilterOptionIds.includes(option.id),
        )?.id ?? 'none',
    )
  }, [categoryFilters, productFilters])

  const form = useForm<Inputs>({
    resolver: zodResolver(linkFiltersSchema),
    defaultValues: {
      filters: categoryFilters.map((filter, index) => ({
        id: filter.id,
        optionId: productFilterOptionIds[index],
      })),
    },
  })
  const router = useRouter()

  useFieldArray({
    control: form.control,
    name: 'filters',
  })

  const [linkFilter] = useMutation(LINK_FILTER, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, clientOptions) {
      toast.error(error.message)
    },
  })

  const [unlinkFilter] = useMutation(UNLINK_FILTER, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, clientOptions) {
      toast.error(error.message)
    },
  })

  async function onSubmit(data: Inputs) {
    // melhorar essa lógica
    data.filters.forEach(async (filter, index) => {
      if (productFilterOptionIds[index] !== filter.optionId) {
        if (productFilterOptionIds[index] !== 'none') {
          await unlinkFilter({
            variables: {
              input: {
                productId,
                filterOptionId: productFilterOptionIds[index],
              },
            },
          })
        }
        if (filter.optionId !== 'none') {
          await linkFilter({
            variables: {
              input: {
                productId,
                filterOptionId: filter.optionId,
              },
            },
          })
        }
      }
    })
    router.refresh()
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-2 gap-x-4 gap-y-8"
      >
        {categoryFilters.map((filter, index) => (
          <FormField
            key={filter.id}
            control={form.control}
            name={`filters.${index}.optionId`}
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>{filter.name}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    {filter.options.map((option) => (
                      <FormItem
                        key={option.id}
                        className="flex items-center space-x-3 space-y-0"
                      >
                        <FormControl>
                          <RadioGroupItem value={option.id} />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {option.value}
                        </FormLabel>
                      </FormItem>
                    ))}

                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="none" />
                      </FormControl>
                      <FormLabel className="font-normal">Nada</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <div>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  )
}
