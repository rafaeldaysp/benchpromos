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
import { useFormStore } from '@/hooks/use-form-store'
import { filtersLinkSchema } from '@/lib/validations/product'
import type { Filter } from '@/types'
import { ScrollArea } from '../ui/scroll-area'

const LINK_FILTERS = gql`
  mutation LinkFiltersToProduct($input: LinkProductFiltersInput!) {
    updateProductFilters(linkProductFiltersInput: $input) {
      id
    }
  }
`

type Inputs = z.infer<typeof filtersLinkSchema>

interface ProductFiltersFormProps {
  categoryFilters: Filter[]
  productId: string
  productFilters: { optionId: string }[]
}

// por algum motivo esse componente ta sendo renderizado 5 vezes quando da submit ╰（‵□′）╯

export function ProductFiltersForm({
  categoryFilters,
  productId,
  productFilters,
}: ProductFiltersFormProps) {
  // verificar a necessidade do useMemo
  const productFilterOptionIds = React.useMemo(() => {
    const productFilterOptionIds = productFilters?.map(
      (productFilter) => productFilter.optionId,
    )

    return categoryFilters?.map(
      (filter) =>
        filter.options.find(
          (option) => productFilterOptionIds?.includes(option.id),
        )?.id ?? 'none',
    )
  }, [categoryFilters, productFilters])

  const form = useForm<Inputs>({
    resolver: zodResolver(filtersLinkSchema),
    defaultValues: {
      filters: categoryFilters.map((filter, index) => ({
        id: filter.id,
        optionId: productFilterOptionIds[index],
      })),
    },
  })
  const { setOpenDialog } = useFormStore()
  const router = useRouter()

  useFieldArray({
    control: form.control,
    name: 'filters',
  })

  const [linkFilters] = useMutation(LINK_FILTERS, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted() {
      setOpenDialog('productFiltersForm', false)

      toast.success('Filtros atualizados com sucesso.')
      router.refresh()
    },
    refetchQueries: ['GetProducts'],
  })

  // mudar para optionIds no back
  async function onSubmit(data: Inputs) {
    const optionIds = data.filters
      .filter((filter) => filter.optionId !== 'none')
      .map((filter) => filter.optionId)

    linkFilters({
      variables: {
        input: {
          productId,
          optionsId: optionIds,
        },
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ScrollArea>
          <div className="grid max-h-[700px] grid-cols-2 gap-x-4 gap-y-8">
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
                          <FormLabel className="font-normal">Nenhum</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </ScrollArea>
        <Button type="submit" className="w-full">
          Salvar
        </Button>
      </form>
    </Form>
  )
}
