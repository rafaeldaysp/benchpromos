'use client'

import { gql, useMutation } from '@apollo/client'
import { type Row } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { env } from '@/env.mjs'
import { useFormStore } from '@/hooks/use-form-store'
import { benchmarkDataRowSchema } from '@/lib/validations/benchmark'

const REMOVE_BENCHMARK_RESULT = gql`
  mutation RemoveBenchmarkResult($resultId: ID!) {
    removeBenchmarkResult(id: $resultId) {
      id
    }
  }
`

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  const { openDialogs, setOpenDialog } = useFormStore()
  const router = useRouter()
  const benchmarkDataRow = benchmarkDataRowSchema.parse(row.original)

  const [removeBenchmarkResult] = useMutation(REMOVE_BENCHMARK_RESULT, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      toast.success('Resultado deletado com sucesso.')
      router.refresh()
    },
  })

  return (
    <Sheet
      open={
        openDialogs[`benchmarkResultUpdateForm.${benchmarkDataRow.id}`] ?? false
      }
      onOpenChange={(open) =>
        setOpenDialog(`benchmarkResultUpdateForm.${benchmarkDataRow.id}`, open)
      }
    >
      <AlertDialog>
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            >
              <Icons.MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <SheetTrigger asChild>
              <DropdownMenuItem onClick={() => setDropdownOpen(false)}>
                <Icons.Edit className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                Editar
              </DropdownMenuItem>
            </SheetTrigger>

            <AlertDialogTrigger asChild>
              <DropdownMenuItem onClick={() => setDropdownOpen(false)}>
                <Icons.Trash className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                Deletar
              </DropdownMenuItem>
            </AlertDialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>

        <SheetContent
          className="w-full space-y-4 overflow-auto sm:max-w-xl"
          side="left"
        >
          <SheetHeader>
            <SheetTitle>EDITAR RESULTADO</SheetTitle>
          </SheetHeader>
          <BenchmarkResultForm
            mode="update"
            benchmarkResult={{
              id: benchmarkDataRow.id,
              benchmarkId: benchmarkDataRow.benchmark.id,
              description: benchmarkDataRow.description ?? undefined,
              productAlias: benchmarkDataRow.product.alias,
              result: benchmarkDataRow.result,
              products: benchmarkDataRow.products,
              unit: benchmarkDataRow.unit,
            }}
          />
        </SheetContent>

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
                removeBenchmarkResult({
                  variables: { resultId: benchmarkDataRow.id },
                })
              }
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  )
}
