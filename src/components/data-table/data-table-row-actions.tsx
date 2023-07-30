'use client'

import React from 'react'
import { type Row } from '@tanstack/react-table'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Button } from '../ui/button'
import { benchmarkSchema } from '@/lib/validations/benchmark'
import { Icons } from '../icons'
import { gql, useMutation } from '@apollo/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { env } from '@/env.mjs'

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
} from '../ui/alert-dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet'
import { BenchmarkResultForm } from '../forms/benchmark-result-form'
import { useFormStore } from '@/hooks/use-form-store'

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
  const benchmark = benchmarkSchema.parse(row.original)

  const { openDialogs, setOpenDialog } = useFormStore()

  const router = useRouter()

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
      toast.success('Resultado excluído com sucesso')
      router.refresh()
    },
  })

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <Icons.MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir opções</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="p-0"
            onSelect={(e) => e.preventDefault()}
            onPointerMove={(e) => e.preventDefault()}
          >
            <Sheet
              open={openDialogs[`benchmarkResultUpdateForm.${benchmark.id}`]}
              onOpenChange={(open) =>
                setOpenDialog(`benchmarkResultUpdateForm.${benchmark.id}`, open)
              }
            >
              <SheetTrigger asChild>
                <p className="flex-1 cursor-pointer rounded-sm px-2 py-1.5 text-left outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                  Editar
                </p>
              </SheetTrigger>
              <SheetContent
                className="w-full space-y-4 overflow-auto sm:max-w-xl"
                side="left"
              >
                <SheetHeader>
                  <SheetTitle>EDITAR TESTE</SheetTitle>
                </SheetHeader>
                <BenchmarkResultForm
                  mode="update"
                  benchmarkResult={benchmark}
                />
              </SheetContent>
            </Sheet>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="p-0"
            onSelect={(event) => event.preventDefault()}
          >
            <AlertDialog>
              <AlertDialogTrigger className="flex-1 cursor-pointer rounded-sm px-2 py-1.5 text-left outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                Excluir
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
                      removeBenchmarkResult({
                        variables: { resultId: benchmark.id },
                      })
                    }
                  >
                    Continuar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
