'use client'

import { gql, useMutation } from '@apollo/client'
import { useQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { env } from '@/env.mjs'
import { useFormStore } from '@/hooks/use-form-store'
import { benchmarkResultSchema } from '@/lib/validations/benchmark'
import type { Benchmark } from '@/types'

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

type Inputs = z.infer<typeof benchmarkResultSchema>

const defaultValues: Partial<Inputs> = {
  description: '',
}

interface BenchmarkResultFormProps {
  mode?: 'create' | 'update'
  productId?: string
  benchmarkResult?: { id?: string } & Partial<Inputs>
}

export function BenchmarkResultForm({
  mode = 'create',
  productId,
  benchmarkResult,
}: BenchmarkResultFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(benchmarkResultSchema),
    defaultValues: {
      ...defaultValues,
      ...benchmarkResult,
    },
  })

  const { setOpenDialog } = useFormStore()
  const router = useRouter()

  const { data } = useQuery<{
    benchmarks: Benchmark[]
  }>(GET_BENCHMARKS)

  const benchmarkItems = React.useMemo(() => {
    const benchmarkItems = data?.benchmarks.map((benchmark) => ({
      label: benchmark.name,
      value: benchmark.id,
    }))

    return benchmarkItems
  }, [data])

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
            ? `benchmarkResultCreateForm.${productId}`
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
              <FormLabel>Benchmark</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um benchmark" />
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
                <NumericFormat
                  customInput={Input}
                  displayType="input"
                  placeholder="100"
                  decimalScale={0}
                  value={field.value ? field.value : undefined}
                  onValueChange={({ floatValue }) =>
                    field.onChange(floatValue ?? 0)
                  }
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
