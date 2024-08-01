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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { env } from '@/env.mjs'
import { useFormStore } from '@/hooks/use-form-store'
import { recommendedProductSchema } from '@/lib/validations/recommended-product'
import type { Product, RecommendedProduct } from '@/types'
import { PriceInput } from '../price-input'
import { ScrollArea } from '../ui/scroll-area'

const CREATE_RECOMMENDED_PRODUCT = gql`
  mutation CreateRecommendedProduct(
    $createRecommendationInput: CreateRecommendationInput
  ) {
    createRecommendedProduct(
      createRecommendationInput: $createRecommendationInput
    ) {
      id
    }
  }
`

const GET_RECOMMENDATION_CATEGORIES = gql`
  query GetRecommendationCategories {
    recommendationCategories {
      id
      name
      slug
      priceRangeProduct {
        product {
          name
        }
        minPrice
        maxPrice
      }
    }
  }
`

type Inputs = z.infer<typeof recommendedProductSchema>

interface RecommendedProductFormProps {
  productId: string
}

export function RecommendedProductForm({
  productId,
}: RecommendedProductFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(recommendedProductSchema),
  })
  const { setOpenDialog } = useFormStore()
  const router = useRouter()

  const { data } = useQuery<{
    recommendationCategories: {
      id: string
      name: string
      priceRangeProduct: (RecommendedProduct & { product: Product })[]
    }[]
  }>(GET_RECOMMENDATION_CATEGORIES, {
    fetchPolicy: 'network-only',
  })

  const categoriesItems = React.useMemo(() => {
    const retailerItems = data?.recommendationCategories.map((category) => ({
      label: category.name,
      value: category.id,
    }))

    return retailerItems
  }, [data])

  const [mutateRecommended, { loading: isLoading }] = useMutation(
    CREATE_RECOMMENDED_PRODUCT,
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

        setOpenDialog('recommendedProductForm', false)

        toast.success('Recomendação de produto cadastrada com sucesso.')
        router.refresh()
      },
    },
  )

  async function onSubmit(data: Inputs) {
    await mutateRecommended({
      variables: {
        createRecommendationInput: {
          productId,
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
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria de recomendação</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <ScrollArea className="h-80">
                    {categoriesItems?.map((categoryItem) => (
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
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="minPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço mínimo</FormLabel>
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
          name="maxPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço máximo</FormLabel>
              <FormControl>
                <PriceInput
                  placeholder="5.447,00"
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
