'use client'

import { gql, useMutation } from '@apollo/client'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { categorySchema } from '@/lib/validations/category'
import { useRouter } from 'next/navigation'

const CREATE_CATEGORY = gql`
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(createCategoryInput: $input) {
      id
    }
  }
`

const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($input: UpdateCategoryInput!) {
    updateCategory(updateCategoryInput: $input) {
      id
    }
  }
`

type Inputs = z.infer<typeof categorySchema>

const defaultValues: Partial<Inputs> = {
  name: '',
}

interface CategoryFormProps {
  mode?: 'create' | 'update'
  category?: { id?: string } & Partial<Inputs>
}

export function CategoryForm({ mode = 'create', category }: CategoryFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(categorySchema),
    defaultValues: category ?? defaultValues,
  })
  const router = useRouter()

  const [mutateCategory, { loading: isLoading }] = useMutation(
    mode === 'create' ? CREATE_CATEGORY : UPDATE_CATEGORY,
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
            ? 'Categoria cadastrada com sucesso.'
            : 'Categoria atualizada com sucesso.'

        toast.success(message)
        router.refresh()
      },
    },
  )

  async function onSubmit(data: Inputs) {
    await mutateCategory({
      variables: {
        input: {
          id: category?.id,
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
