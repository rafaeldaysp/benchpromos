'use client'

import { gql, useMutation } from '@apollo/client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
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
import { env } from '@/env.mjs'
import { useFormStore } from '@/hooks/use-form-store'
import { recommendationCategorySchema } from '@/lib/validations/recommendation'

const CREATE_RECOMMENDATION_CATEGORY = gql`
  mutation CreateRecommendationCategry($name: String!) {
    createRecommendationCategory(name: $name) {
      id
      name
      slug
    }
  }
`

const UPDATE_RECOMMENDATION_CATEGORY = gql`
  mutation UpdateRecommendationCategory(
    $updateRecommendationCategory: UpdateRecommendationCategory!
  ) {
    updateRecommendationCategory(
      updateRecommendationCategory: $updateRecommendationCategory
    ) {
      id
    }
  }
`

type Inputs = z.infer<typeof recommendationCategorySchema>

const defaultValues: Partial<Inputs> = {
  name: '',
}

interface RecommendationCategoryFormProps {
  mode?: 'create' | 'update'
  recommendationCategory?: { id?: string } & Partial<Inputs>
}

export function RecommendationCategoryForm({
  mode = 'create',
  recommendationCategory,
}: RecommendationCategoryFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(recommendationCategorySchema),
    defaultValues: {
      ...defaultValues,
      ...recommendationCategory,
    },
  })
  const { setOpenDialog } = useFormStore()
  const router = useRouter()

  const [mutateCategory, { loading: isLoading }] = useMutation(
    mode === 'create'
      ? CREATE_RECOMMENDATION_CATEGORY
      : UPDATE_RECOMMENDATION_CATEGORY,
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
            ? 'recommendationCategoryCreateForm'
            : `recommendationCategoryUpdateForm.${recommendationCategory?.id}`,
          false,
        )

        const message =
          mode === 'create'
            ? 'Categoria cadastrada com sucesso.'
            : 'Categoria atualizada com sucesso.'

        toast.success(message)
        router.refresh()
      },
    },
  )

  async function onSubmit(data: Inputs) {
    const variables =
      mode === 'create'
        ? { name: data.name }
        : {
            updateRecommendationCategory: {
              id: recommendationCategory?.id,
              ...data,
            },
          }
    await mutateCategory({
      variables,
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
                <Input
                  placeholder="Notebooks de produtividade..."
                  aria-invalid={!!form.formState.errors.name}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
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
