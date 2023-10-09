'use client'

import { gql, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

import { DashboardItemCard } from '@/components/dashboard-item-card'
import { columns, type BenchmarkData } from '@/components/data-table/columns'
import { DataTable } from '@/components/data-table/data-table'
import { BenchmarkForm } from '@/components/forms/benchmark-form'
import { BenchmarkResultForm } from '@/components/forms/benchmark-result-form'
import { Icons } from '@/components/icons'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { env } from '@/env.mjs'
import { useFormStore } from '@/hooks/use-form-store'
import { cn } from '@/lib/utils'
import type { Benchmark, BenchmarkResult, Product } from '@/types'

const DELETE_BENCHMARK = gql`
  mutation DeleteBenchmark($benchmarkId: ID!) {
    removeBenchmark(id: $benchmarkId) {
      id
    }
  }
`

interface BenchmarksMainProps {
  benchmarks: Benchmark[]
  results: (Pick<
    BenchmarkResult,
    'id' | 'result' | 'description' | 'productAlias'
  > & {
    products: Pick<Product, 'id' | 'name' | 'imageUrl'>[]
    benchmark: Benchmark
  })[]
}

export function BenchmarksMain({ benchmarks, results }: BenchmarksMainProps) {
  const [benchmarkQuery, setBenchmarkQuery] = React.useState('')
  const { openDialogs, setOpenDialog } = useFormStore()
  const router = useRouter()

  const [deleteBenchmark] = useMutation(DELETE_BENCHMARK, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      toast.success('Benchmark deletado com sucesso.')
      router.refresh()
    },
  })

  const benchmarkData = results.map((result) => ({
    id: result.id,
    benchmark: result.benchmark,
    product: {
      alias: result.productAlias,
      imageUrl: result.products[0].imageUrl,
    },
    result: result.result,
    description: result.description,
    products: result.products,
  })) as BenchmarkData[]

  const filteredBenchmarks = benchmarks.filter((benchmark) =>
    benchmark.name.toLowerCase().includes(benchmarkQuery.toLowerCase().trim()),
  )

  return (
    <div className="space-y-8">
      <DataTable
        columns={columns}
        data={benchmarkData}
        benchmarks={benchmarks}
      />

      <div className="flex justify-end gap-x-2">
        <Sheet
          open={openDialogs['benchmarkCreateForm']}
          onOpenChange={(open) => setOpenDialog('benchmarkCreateForm', open)}
        >
          <SheetTrigger asChild>
            <Button variant="outline">Adicionar</Button>
          </SheetTrigger>
          <SheetContent
            className="w-full space-y-4 overflow-auto sm:max-w-xl"
            side="left"
          >
            <SheetHeader>
              <SheetTitle>ADICIONAR BENCHMARK</SheetTitle>
            </SheetHeader>

            <BenchmarkForm />
          </SheetContent>
        </Sheet>
      </div>

      <div className="space-y-4">
        <Input
          placeholder="Pesquise por um benchmark..."
          value={benchmarkQuery}
          onChange={(e) => setBenchmarkQuery(e.target.value)}
        />
        {filteredBenchmarks.length > 0 ? (
          <ScrollArea
            className={cn('rounded-md border', {
              'h-[600px]': benchmarks.length > 8,
            })}
          >
            {filteredBenchmarks.map((benchmark) => (
              <DashboardItemCard.Root key={benchmark.id}>
                <DashboardItemCard.Content>
                  <p className="text-sm leading-7">{benchmark.name}</p>
                </DashboardItemCard.Content>
                <DashboardItemCard.Actions>
                  <Sheet
                    open={openDialogs[`benchmarkResultCreateForm`]}
                    onOpenChange={(open) =>
                      setOpenDialog(`benchmarkResultCreateForm`, open)
                    }
                  >
                    <SheetTrigger asChild>
                      <DashboardItemCard.Action icon={Icons.Plus} />
                    </SheetTrigger>
                    <SheetContent
                      className="w-full space-y-4 overflow-auto sm:max-w-xl"
                      side="left"
                    >
                      <SheetHeader>
                        <SheetTitle>ADICIONAR RESULTADO</SheetTitle>
                      </SheetHeader>
                      <BenchmarkResultForm
                        benchmarkResult={{ benchmarkId: benchmark.id }}
                      />
                    </SheetContent>
                  </Sheet>

                  <Sheet
                    open={openDialogs[`benchmarkUpdateForm.${benchmark.id}`]}
                    onOpenChange={(open) =>
                      setOpenDialog(`benchmarkUpdateForm.${benchmark.id}`, open)
                    }
                  >
                    <SheetTrigger asChild>
                      <DashboardItemCard.Action icon={Icons.Edit} />
                    </SheetTrigger>
                    <SheetContent
                      className="w-full space-y-4 overflow-auto sm:max-w-xl"
                      side="left"
                    >
                      <SheetHeader>
                        <SheetTitle>EDITAR BENCHMARK</SheetTitle>
                      </SheetHeader>
                      <BenchmarkForm mode="update" benchmark={benchmark} />
                    </SheetContent>
                  </Sheet>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DashboardItemCard.Action
                        variant="destructive"
                        icon={Icons.Trash}
                      />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Essa ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            deleteBenchmark({
                              variables: { benchmarkId: benchmark.id },
                            })
                          }
                        >
                          Continuar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DashboardItemCard.Actions>
              </DashboardItemCard.Root>
            ))}
          </ScrollArea>
        ) : (
          <div className="flex justify-center">
            <p className="text-muted-foreground">
              Nenhum benchmark encontrado.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
