'use client'

import { type z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form'
import {
  benchmarkResultValidator,
  type benchmarkSchema,
} from '@/lib/validations/benchmark'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useFormStore } from '@/hooks/use-form-store'
import { gql, useMutation } from '@apollo/client'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { useSuspenseQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import React from 'react'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { Icons } from '../icons'
import { env } from '@/env.mjs'

const CREATE_BENCHMARK_RESULT = gql`
  mutation CreateBenchmarkResult($input: CreateBenchmarkResultInput!) {
    createBenchmarkResult(createBenchmarkResultInput: $input) {
      id
    }
  }
`

const UPDATE_BENCHMARK_RESULT = gql`
  mutation UpdateBenchmarkResult($input: UpdateBenchmarkResultInput!) {
    updateBenchmarkResult(updateBenchmarkResultInput: $input) {
      id
    }
  }
`

const GET_BENCHMARKS = gql`
  query GetBenchmarks {
    benchmarks {
      id
      name
    }
  }
`

//type Inputs = Omit<z.infer<typeof benchmarkSchema>, 'product' | 'id'>

type Inputs = z.infer<typeof benchmarkResultValidator>

type BenchmarkResult = z.infer<typeof benchmarkSchema>

const defaultValues: Partial<Inputs> = {
  description: '',
  benchmarkId: '',
}

interface BenchmarkResultFormProps {
  mode: 'create' | 'update'
  productId?: string
  benchmarkResult?: BenchmarkResult
}

export function BenchmarkResultForm({
  productId,
  mode,
  benchmarkResult,
}: BenchmarkResultFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(benchmarkResultValidator),
    defaultValues: benchmarkResult
      ? {
          benchmarkId: benchmarkResult.benchmark.id,
          result: benchmarkResult.result,
          description: benchmarkResult.description,
        }
      : defaultValues,
  })

  const { data } = useSuspenseQuery<{
    benchmarks: { id: string; name: string }[]
  }>(GET_BENCHMARKS, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
  })

  const benchmarkItems = React.useMemo(() => {
    const benchmarkItems = data?.benchmarks.map((benchmark) => ({
      label: benchmark.name,
      value: benchmark.id,
    }))

    return benchmarkItems
  }, [data])

  const { setOpenDialog } = useFormStore()

  const router = useRouter()

  const [mutateBenchmarkResult, { loading: isLoading }] = useMutation(
    mode === 'create' ? CREATE_BENCHMARK_RESULT : UPDATE_BENCHMARK_RESULT,
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
            ? 'benchmarkResultCreateForm'
            : `benchmarkResultUpdateForm.${benchmarkResult?.id}`,
          false,
        )

        const message =
          mode === 'create'
            ? 'Resultado cadastrado com sucesso.'
            : 'Resultado atualizado com sucesso.'

        toast.success(message)
        router.refresh()
      },
    },
  )
  async function onSubmit(data: Inputs) {
    await mutateBenchmarkResult({
      variables: {
        input: {
          id: benchmarkResult?.id,
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
          name="benchmarkId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teste</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um teste" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {benchmarkItems?.map((benchmarkItem) => (
                    <SelectItem
                      key={benchmarkItem.value}
                      value={benchmarkItem.value}
                    >
                      {benchmarkItem.label}
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
          name="result"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resultado</FormLabel>
              <FormControl>
                <Input
                  aria-invalid={!!form.formState.errors.result}
                  {...field}
                  onChange={(event) => field.onChange(+event.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (opcional)</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
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
