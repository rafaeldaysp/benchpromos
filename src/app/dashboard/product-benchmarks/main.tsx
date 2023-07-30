'use client'

import { DataTable } from '@/components/data-table/data-table'

import {
  type BenchmarkType,
  columns,
} from '../../../components/data-table/columns'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import React from 'react'
import { useFormStore } from '@/hooks/use-form-store'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { DashboardItemCard } from '@/components/dashboard-item-card'
import { type Product } from '@/types'
import { Icons } from '@/components/icons'
import { BenchmarkForm } from '@/components/forms/benchmark-form'
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
import { gql, useMutation } from '@apollo/client'
import { env } from '@/env.mjs'
import { toast } from 'sonner'
import { BenchmarkResultForm } from '@/components/forms/benchmark-result-form'

const DELETE_BENCHMARK = gql`
  mutation DeleteBenchmark($benchmarkId: ID!) {
    removeBenchmark(id: $benchmarkId) {
      id
    }
  }
`

interface BenchmarksMainProps {
  benchmarks: BenchmarkType[]
  allBenchmarks: { id: string; name: string; results: { id: string }[] }[]
  products: Pick<Product, 'id' | 'name' | 'imageUrl'>[]
}

export function BenchmarksMain({
  benchmarks,
  products,
  allBenchmarks,
}: BenchmarksMainProps) {
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
      toast.success('Teste deletado com sucesso.')
      router.refresh()
    },
  })

  return (
    <div className="space-y-8">
      <div className="flex justify-end gap-x-2">
        <Sheet
          open={openDialogs['benchmarkCreateForm']}
          onOpenChange={(open) => setOpenDialog('benchmarkCreateForm', open)}
        >
          <SheetTrigger asChild>
            <Button variant="outline">Novo</Button>
          </SheetTrigger>
          <SheetContent
            className="w-full space-y-4 overflow-auto sm:max-w-xl"
            side="left"
          >
            <SheetHeader>
              <SheetTitle>NOVO BENCHMARK</SheetTitle>
            </SheetHeader>

            <BenchmarkForm />
          </SheetContent>
        </Sheet>
      </div>
      <DataTable
        columns={columns}
        data={benchmarks}
        benchmarks={allBenchmarks.filter(
          (benchmark) => benchmark.results.length > 0,
        )}
      />

      <Tabs defaultValue="products">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="benchmarks">Testes</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          {products.length > 0 ? (
            <div className="space-y-4">
              <Input placeholder="Pesquise por um produto..." />
              <ScrollArea className="h-[600px] rounded-md border">
                {products.map((product) => (
                  <DashboardItemCard.Root
                    key={product.id}
                    className="cursor-pointer"
                  >
                    <DashboardItemCard.Image src={product.imageUrl} alt="" />

                    <DashboardItemCard.Content>
                      <p className="text-sm leading-7">{product.name}</p>
                    </DashboardItemCard.Content>
                    <DashboardItemCard.Actions>
                      <Sheet
                        open={
                          openDialogs[`benchmarkResultCreateForm.${product.id}`]
                        }
                        onOpenChange={(open) =>
                          setOpenDialog(
                            `benchmarkResultCreateForm.${product.id}`,
                            open,
                          )
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
                            <SheetTitle>ADICIONAR TESTE</SheetTitle>
                          </SheetHeader>
                          <BenchmarkResultForm
                            mode="create"
                            productId={product.id}
                          />
                        </SheetContent>
                      </Sheet>
                    </DashboardItemCard.Actions>
                  </DashboardItemCard.Root>
                ))}
              </ScrollArea>
            </div>
          ) : (
            <div className="flex justify-center">
              <p className="text-muted-foreground">
                Nenhum produto encontrado.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="benchmarks">
          {allBenchmarks.length > 0 ? (
            <div className="space-y-4">
              <Input placeholder="Pesquise por um teste..." />
              <ScrollArea className="h-[600px] rounded-md border">
                {allBenchmarks.map((benchmark) => (
                  <DashboardItemCard.Root
                    key={benchmark.id}
                    className="cursor-pointer"
                  >
                    <DashboardItemCard.Content>
                      <p className="text-sm leading-7">{benchmark.name}</p>
                    </DashboardItemCard.Content>
                    <DashboardItemCard.Actions>
                      <Sheet
                        open={
                          openDialogs[`benchmarkUpdateForm.${benchmark.id}`]
                        }
                        onOpenChange={(open) =>
                          setOpenDialog(
                            `benchmarkUpdateForm.${benchmark.id}`,
                            open,
                          )
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
                            <SheetTitle>EDITAR TESTE</SheetTitle>
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
                            <AlertDialogTitle>
                              Você tem certeza?
                            </AlertDialogTitle>
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
            </div>
          ) : (
            <div className="flex justify-center">
              <p className="text-muted-foreground">
                Nenhum benchmark encontrado.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
