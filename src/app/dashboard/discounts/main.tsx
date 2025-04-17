'use client'

import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

import { DashboardItemCard } from '@/components/dashboard-item-card'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { type Discount, type Retailer } from '@/types'
import { gql, useMutation } from '@apollo/client'
import { DiscountForm } from '@/components/forms/discount-form'
import { couponFormatter } from '@/utils/formatter'
import { Badge } from '@/components/ui/badge'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const DELETE_DISCOUNT = gql`
  mutation DeleteDiscount($discountId: ID!) {
    removeDiscount(id: $discountId) {
      id
    }
  }
`

interface DiscountsMainProps {
  discounts: (Discount & { retailer: Pick<Retailer, 'name'> })[]
}

export function DiscountsMain({ discounts }: DiscountsMainProps) {
  const [selectedDiscount, setSelectedDiscount] =
    React.useState<(typeof discounts)[number]>()
  const [selectedRetailer, setSelectedRetailer] = React.useState('Todos')
  const retailers = React.useMemo(() => {
    const distinctRetailers = Array.from(
      new Set(discounts.map((discount) => discount.retailer.name)),
    )
    return ['Todos', ...distinctRetailers]
  }, [discounts])

  const { openDialogs, setOpenDialog } = useFormStore()
  const router = useRouter()

  const [deleteDiscount] = useMutation(DELETE_DISCOUNT, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      toast.success('Desconto deletado com sucesso.')
      router.refresh()
    },
  })

  return (
    <div className="space-y-8">
      {/* Discounts Actions */}
      <div className="flex justify-between gap-x-2">
        <Select onValueChange={setSelectedRetailer} value={selectedRetailer}>
          <SelectTrigger className="w-full sm:max-w-[200px]">
            <SelectValue placeholder="Selecione um varejista" />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-80">
              {retailers?.map((retailer) => (
                <SelectItem key={retailer} value={retailer}>
                  {retailer}
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
        <Sheet
          open={openDialogs['discountCreateForm']}
          onOpenChange={(open) => setOpenDialog('discountCreateForm', open)}
        >
          <SheetTrigger asChild>
            <Button variant="outline">Adicionar</Button>
          </SheetTrigger>
          <SheetContent
            className="w-full space-y-4 overflow-auto sm:max-w-xl"
            side="left"
          >
            <SheetHeader>
              <SheetTitle>ADICIONAR DESCONTO</SheetTitle>
            </SheetHeader>
            <DiscountForm />
          </SheetContent>
        </Sheet>
      </div>

      {selectedDiscount && (
        <DashboardItemCard.Root className="border">
          <DashboardItemCard.Content>
            <p className="text-sm leading-7">{selectedDiscount.discount}</p>
            <span className="text-xs text-muted-foreground">
              {selectedDiscount.retailer.name}
            </span>
          </DashboardItemCard.Content>

          <DashboardItemCard.Actions>
            <DashboardItemCard.Action
              variant="destructive"
              icon={Icons.X}
              onClick={() => setSelectedDiscount(undefined)}
            />
          </DashboardItemCard.Actions>
        </DashboardItemCard.Root>
      )}

      {/* Discounts */}
      {discounts.length > 0 ? (
        <ScrollArea
          className={cn('rounded-md border', {
            'h-[600px]': discounts.length > 8,
          })}
        >
          {discounts
            .filter(
              (discount) =>
                discount.retailer.name == selectedRetailer ||
                selectedRetailer == 'Todos',
            )
            .map((discount) => (
              <DashboardItemCard.Root key={discount.id}>
                <DashboardItemCard.Content
                  className="cursor-pointer"
                  onClick={() => setSelectedDiscount(discount)}
                >
                  <p className="text-sm leading-7">
                    <Badge variant="auxiliary" className="uppercase">
                      {couponFormatter(discount.discount)} {discount.label}
                    </Badge>
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {discount.retailer.name} • Atualizado{' '}
                    {dayjs(discount.updatedAt).fromNow()}
                  </span>
                </DashboardItemCard.Content>

                <DashboardItemCard.Actions>
                  <Sheet
                    open={openDialogs[`discountUpdateForm.${discount.id}`]}
                    onOpenChange={(open) =>
                      setOpenDialog(`discountUpdateForm.${discount.id}`, open)
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
                        <SheetTitle>EDITAR DESCONTO</SheetTitle>
                      </SheetHeader>
                      <DiscountForm mode="update" discount={discount} />
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
                            deleteDiscount({
                              variables: { discountId: discount.id },
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
          <p className="text-muted-foreground">Nenhum desconto encontrado.</p>
        </div>
      )}
    </div>
  )
}
