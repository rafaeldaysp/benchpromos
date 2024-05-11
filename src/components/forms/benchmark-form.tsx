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
import { type Benchmark } from '@/types'
import { removeNullValues } from '@/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Checkbox } from '../ui/checkbox'

const CREATE_BENCHMARK = gql`
  mutation CreateBenchmark($input: CreateBenchmarkInput!) {
    createBenchmark(createBenchmarkInput: $input) {
      id
    }
  }
`

const UPDATE_BENCHMARK = gql`
  mutation UpdateBenchmark($input: UpdateBenchmarkInput!) {
    updateBenchmark(updateBenchmarkInput: $input) {
      id
    }
  }
`

type Inputs = z.infer<typeof benchmarkSchema>

const defaultValues: Partial<Inputs> = {
  name: '',
  parentId: 'null',
}

interface BenchmarkFormProps {
  mode?: 'create' | 'update'
  benchmark?: { id?: string } & Partial<Inputs>
  benchmarks: Benchmark[]
}

export function BenchmarkForm({
  mode = 'create',
  benchmark,
  benchmarks,
}: BenchmarkFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(benchmarkSchema),
    defaultValues: {
      ...defaultValues,
      ...removeNullValues(benchmark),
    },
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

  async function onSubmit({ parentId, ...data }: Inputs) {
    await mutateBenchmark({
      variables: {
        input: {
          id: benchmark?.id,
          parentId: parentId === 'null' ? null : parentId,
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
                  placeholder="Forza Horizon Ultra FHD"
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
          name="parentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Diretório pai</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um diretório pai" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-80">
                  <SelectItem value={'null'}>Nenhum</SelectItem>
                  {benchmarks.map((benchmark) => (
                    <SelectItem key={benchmark.id} value={benchmark.id}>
                      {benchmark.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagem</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://image.png"
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
          name="hidden"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start justify-between space-x-3 space-y-0">
              <FormLabel>Privado</FormLabel>
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

        <FormField
          control={form.control}
          name="lowerIsBetter"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start justify-between space-x-3 space-y-0">
              <FormLabel>Menor é melhor</FormLabel>
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
