'use client'

import { gql, useMutation, useQuery } from '@apollo/client'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import * as React from 'react'
import { toast } from 'sonner'

import { env } from '@/env.mjs'
import { priceFormatter } from '@/utils/formatter'
import { Icons } from './icons'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { Input } from './ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { PriceInput } from './price-input'

dayjs.locale('pt-br')

const fromNowOptions = [
  {
    label: '30 dias',
    value: 30,
  },
  {
    label: '60 dias',
    value: 60,
  },
  {
    label: '3 meses',
    value: 90,
  },
  {
    label: '1 ano',
    value: 365,
  },
]

const GET_PRODUCT_HISTORY = gql`
  query ($input: GetProductHistoryInput!) {
    productHistory(productHistoryInput: $input) {
      dailyHistory {
        lowestPrice
        lowestInstallmentPrice
        date
      }
    }
  }
`

const UPDATE_PRODUCT_HISTORY = gql`
  mutation UpdateProductHistory(
    $updateProductHistoryInput: UpdateProductHistoryInput!
  ) {
    updateProductHistory(
      updateProductHistoryInput: $updateProductHistoryInput
    ) {
      id
    }
  }
`

type DailyHistory = {
  lowestPrice: number | null
  lowestInstallmentPrice: number | null
  date: string
}

interface ProductHistoryEditorProps {
  productSlug: string
  productId: string
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ProductHistoryEditor({
  productSlug,
  productId,
  trigger,
  open,
  onOpenChange,
}: ProductHistoryEditorProps) {
  const [periodInDays, setPeriodInDays] = React.useState(30)

  const { data, loading, refetch } = useQuery<{
    productHistory: {
      dailyHistory: DailyHistory[]
    }
  }>(GET_PRODUCT_HISTORY, {
    variables: {
      input: {
        periodInDays,
        productId: productSlug,
      },
    },
    fetchPolicy: 'cache-and-network',
    refetchWritePolicy: 'overwrite',
    errorPolicy: 'ignore',
    skip: !open,
  })

  const dailyHistory = data?.productHistory?.dailyHistory ?? []

  const sortedDailyHistory = [...dailyHistory].sort((a, b) => {
    return dayjs(b.date).diff(dayjs(a.date))
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Histórico de Preços</DialogTitle>
          <DialogDescription>
            Visualize e edite o histórico de preços do produto
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Exibindo últimos <strong>{periodInDays}</strong> dias
          </p>
          <Select
            value={periodInDays.toString()}
            onValueChange={(value) => {
              setPeriodInDays(Number(value))
              refetch({
                input: {
                  periodInDays: Number(value),
                  productId: productSlug,
                },
              })
            }}
          >
            <SelectTrigger className="w-[160px]" aria-label="Select a value">
              <SelectValue placeholder="Últimos 30 dias" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {fromNowOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value.toString()}
                  className="rounded-lg"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="max-h-[60vh] overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>À vista</TableHead>
                <TableHead>Parcelado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    <Icons.Spinner className="mx-auto size-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : dailyHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Nenhum histórico encontrado
                  </TableCell>
                </TableRow>
              ) : (
                sortedDailyHistory.map((dayHistory) => (
                  <HistoryRow
                    key={dayHistory.date}
                    dayHistory={dayHistory}
                    productId={productId}
                    onSuccess={() => refetch()}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface HistoryRowProps {
  dayHistory: DailyHistory
  productId: string
  onSuccess: () => void
}

function HistoryRow({ dayHistory, productId, onSuccess }: HistoryRowProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [price, setPrice] = React.useState<number>(
    dayHistory.lowestPrice ? dayHistory.lowestPrice / 100 : 0,
  )
  const [installmentPrice, setInstallmentPrice] = React.useState<number>(
    dayHistory.lowestInstallmentPrice
      ? dayHistory.lowestInstallmentPrice / 100
      : 0,
  )

  const [updateProductHistory, { loading }] = useMutation(
    UPDATE_PRODUCT_HISTORY,
    {
      context: {
        headers: {
          'api-key': env.NEXT_PUBLIC_API_KEY,
        },
      },
      onError(error) {
        toast.error(error.message)
      },
      onCompleted() {
        toast.success('Histórico atualizado com sucesso.')
        setIsEditing(false)
        onSuccess()
      },
    },
  )

  const handleSave = () => {
    const priceInCents = price ? Math.round(price * 100) : null
    const installmentPriceInCents = installmentPrice
      ? Math.round(installmentPrice * 100)
      : null

    updateProductHistory({
      variables: {
        updateProductHistoryInput: {
          date: dayHistory.date,
          price: priceInCents,
          installmentPrice: installmentPriceInCents,
          productId,
        },
      },
    })
  }

  const handleCancel = () => {
    setPrice(dayHistory.lowestPrice ? dayHistory.lowestPrice / 100 : 0)
    setInstallmentPrice(
      dayHistory.lowestInstallmentPrice
        ? dayHistory.lowestInstallmentPrice / 100
        : 0,
    )
    setIsEditing(false)
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        {dayjs(dayHistory.date).format('DD/MM/YYYY')}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <PriceInput
            placeholder="4.447,00"
            value={price}
            onValueChange={({ floatValue }) => setPrice(floatValue ?? 0)}
          />
        ) : dayHistory.lowestPrice ? (
          priceFormatter.format(dayHistory.lowestPrice / 100)
        ) : (
          <span className="text-muted-foreground">Sem preço</span>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <PriceInput
            placeholder="4.447,00"
            value={installmentPrice}
            onValueChange={({ floatValue }) =>
              setInstallmentPrice(floatValue ?? 0)
            }
          />
        ) : dayHistory.lowestInstallmentPrice ? (
          priceFormatter.format(dayHistory.lowestInstallmentPrice / 100)
        ) : (
          <span className="text-muted-foreground">Sem preço</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        {isEditing ? (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={loading}>
              {loading && (
                <Icons.Spinner className="mr-2 size-4 animate-spin" />
              )}
              Salvar
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
            <Icons.Edit className="size-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}
