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
import { filterSchema } from '@/lib/validations/filter'
import { Checkbox } from '../ui/checkbox'

const CREATE_FILTER = gql`
  mutation CreateFilter($input: CreateFilterInput!) {
    createFilter(createFilterInput: $input) {
      id
    }
  }
`

const UPDATE_FILTER = gql`
  mutation UpdateFilter($input: UpdateFilterInput!) {
    updateFilter(updateFilterInput: $input) {
      id
    }
  }
`

type Inputs = z.infer<typeof filterSchema>

const defaultValues: Partial<Inputs> = {
  name: '',
}

interface FilterFormProps {
  categoryId: string
  mode?: 'create' | 'update'
  filter?: { id?: string } & Partial<Inputs>
}

export function FilterForm({
  categoryId,
  mode = 'create',
  filter,
}: FilterFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      ...defaultValues,
      ...filter,
    },
  })
  const { setOpenDialog } = useFormStore()
  const router = useRouter()

  const [mutateFilter, { loading: isLoading }] = useMutation(
    mode === 'create' ? CREATE_FILTER : UPDATE_FILTER,
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
            ? 'filterCreateForm'
            : `filterUpdateForm.${filter?.id}`,
          false,
        )

        const message =
          mode === 'create'
            ? 'Filtro cadastrado com sucesso.'
            : 'Filtro atualizado com sucesso.'

        toast.success(message)
        router.refresh()
      },
    },
  )

  async function onSubmit(data: Inputs) {
    await mutateFilter({
      variables: {
        input: {
          id: filter?.id,
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
                  placeholder="Dell"
                  aria-invalid={!!form.formState.errors.name}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="applyToBenchmarks"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start justify-between space-x-3 space-y-0">
              <FormLabel>Aplicar aos benchmarks</FormLabel>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  // @ts-expect-error ...
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading && (
            <Icons.Spinner
              className="size-4 mr-2 animate-spin"
              aria-hidden="true"
            />
          )}
          {mode === 'create' ? 'Cadastrar' : 'Atualizar'}
        </Button>
      </form>
    </Form>
  )
}
