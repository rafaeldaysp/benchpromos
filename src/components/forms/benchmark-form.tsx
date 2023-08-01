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
import { benchmarkSchema } from '@/lib/validations/benchmark'

const CREATE_BENCHMARK = gql`
  mutation CreateBenchmark($name: String!) {
    createBenchmark(name: $name) {
      id
    }
  }
`

const UPDATE_BENCHMARK = gql`
  mutation UpdateBenchmark($benchmarkId: ID!, $name: String!) {
    updateBenchmark(id: $benchmarkId, name: $name) {
      id
    }
  }
`

type Inputs = z.infer<typeof benchmarkSchema>

const defaultValues: Partial<Inputs> = {
  name: '',
}

interface BenchmarkFormProps {
  mode?: 'create' | 'update'
  benchmark?: { id?: string } & Partial<Inputs>
}

export function BenchmarkForm({
  mode = 'create',
  benchmark,
}: BenchmarkFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(benchmarkSchema),
    defaultValues: benchmark ?? defaultValues,
  })
  const { setOpenDialog } = useFormStore()
  const router = useRouter()

  const [mutateBenchmark, { loading: isLoading }] = useMutation(
    mode === 'create' ? CREATE_BENCHMARK : UPDATE_BENCHMARK,
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
            ? 'benchmarkCreateForm'
            : `benchmarkUpdateForm.${benchmark?.id}`,
          false,
        )

        const message =
          mode === 'create'
            ? 'Benchmark cadastrado com sucesso.'
            : 'Benchmark atualizado com sucesso.'

        toast.success(message)
        router.refresh()
      },
    },
  )

  async function onSubmit(data: Inputs) {
    await mutateBenchmark({
      variables: {
        benchmarkId: benchmark?.id,
        ...data,
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
