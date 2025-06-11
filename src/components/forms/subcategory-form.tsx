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
import { subcategorySchema } from '@/lib/validations/category'

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

type Inputs = z.infer<typeof subcategorySchema>

const defaultValues: Partial<Inputs> = {
  name: '',
}

interface SubcategoryFormProps {
  mode?: 'create' | 'update'
  categoryId: string
  subcategory?: { id?: string } & Partial<Inputs>
}

export function SubcategoryForm({
  mode = 'create',
  categoryId,
  subcategory,
}: SubcategoryFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(subcategorySchema),
    defaultValues: {
      ...defaultValues,
      ...subcategory,
    },
  })
  const { setOpenDialog } = useFormStore()
  const router = useRouter()

  const [mutateSubcategory, { loading: isLoading }] = useMutation(
    mode === 'create' ? CREATE_SUBCATEGORY : UPDATE_SUBCATEGORY,
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
            ? 'subcategoryCreateForm'
            : `subcategoryUpdateForm.${subcategory?.id}`,
          false,
        )

        const message =
          mode === 'create'
            ? 'Subcategoria cadastrada com sucesso.'
            : 'Subcategoria atualizada com sucesso.'

        toast.success(message)
        router.refresh()
      },
    },
  )

  async function onSubmit(data: Inputs) {
    await mutateSubcategory({
      variables: {
        input: {
          id: subcategory?.id,
          categoryId,
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
                <Input
                  placeholder="Produtividade"
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
