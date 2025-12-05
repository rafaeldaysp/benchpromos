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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { env } from '@/env.mjs'
import { useFormStore } from '@/hooks/use-form-store'
import { awardsSchema } from '@/lib/validations/awards'
import { removeNullValues } from '@/utils'

const CREATE_AWARDS = gql`
  mutation CreateAwards($input: CreateAwardsInput!) {
    createAwards(createAwardsInput: $input) {
      id
    }
  }
`

const UPDATE_AWARDS = gql`
  mutation UpdateAwards($input: UpdateAwardsInput!) {
    updateAwards(updateAwardsInput: $input) {
      id
    }
  }
`

type Inputs = z.infer<typeof awardsSchema>

const defaultValues: Partial<Inputs> = {
  year: new Date().getFullYear(),
  isActive: false,
  showResults: false,
}

interface AwardsFormProps {
  mode?: 'create' | 'update'
  awards?: { id?: string } & Partial<Inputs>
}

export function AwardsForm({ mode = 'create', awards }: AwardsFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(awardsSchema),
    defaultValues: {
      ...defaultValues,
      ...removeNullValues(awards),
    },
  })

  const { setOpenDialog } = useFormStore()
  const router = useRouter()

  const showResults = form.watch('showResults')

  const [mutateAwards, { loading: isLoading }] = useMutation(
    mode === 'create' ? CREATE_AWARDS : UPDATE_AWARDS,
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
            ? 'awardsCreateForm'
            : `awardsUpdateForm.${awards?.id}`,
          false,
        )

        const message =
          mode === 'create'
            ? 'Prêmios cadastrado com sucesso.'
            : 'Prêmios atualizado com sucesso.'

        toast.success(message)
        router.refresh()
      },
      refetchQueries: ['GetAllAwards'],
    },
  )

  async function onSubmit({ ...data }: Inputs) {
    await mutateAwards({
      variables: {
        input: {
          id: awards?.id,
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
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ano</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="2024"
                  aria-invalid={!!form.formState.errors.year}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Ano da edição dos prêmios (ex: 2024, 2025)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Ativo</FormLabel>
                <FormDescription>
                  Prêmios ativos permitem que usuários votem nas categorias
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={showResults}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="showResults"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Mostrar Resultados</FormLabel>
                <FormDescription>
                  Exibe os resultados finais da votação. Ao ativar, o prêmio
                  será automaticamente desativado
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked)
                    if (checked) {
                      form.setValue('isActive', false)
                    }
                  }}
                />
              </FormControl>
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
