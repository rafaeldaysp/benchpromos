'use client'

import { gql, useMutation } from '@apollo/client'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

import { DashboardItemCard } from '@/components/dashboard-item-card'
import { CouponForm } from '@/components/forms/coupon-form'
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
import { type Coupon, type Retailer } from '@/types'
import { couponFormatter } from '@/utils/formatter'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const DELETE_COUPON = gql`
  mutation DeleteCoupon($couponId: ID!) {
    removeCoupon(id: $couponId) {
      id
    }
  }
`

interface CouponsMainProps {
  coupons: (Coupon & { retailer: Pick<Retailer, 'name'> })[]
}

export function CouponsMain({ coupons }: CouponsMainProps) {
  const [selectedCoupon, setSelectedCoupon] =
    React.useState<(typeof coupons)[number]>()
  const [selectedRetailer, setSelectedRetailer] = React.useState('Todos')
  const retailers = React.useMemo(() => {
    const distinctRetailers = Array.from(
      new Set(coupons.map((coupon) => coupon.retailer.name)),
    )
    return ['Todos', ...distinctRetailers]
  }, [coupons])

  const { openDialogs, setOpenDialog } = useFormStore()
  const router = useRouter()

  const [deleteCoupon] = useMutation(DELETE_COUPON, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      toast.success('Cupom deletado com sucesso.')
      router.refresh()
    },
  })

  return (
    <div className="space-y-8">
      {/* Coupons Actions */}
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
          open={openDialogs['couponCreateForm']}
          onOpenChange={(open) => setOpenDialog('couponCreateForm', open)}
        >
          <SheetTrigger asChild>
            <Button variant="outline">Adicionar</Button>
          </SheetTrigger>
          <SheetContent
            className="w-full space-y-4 overflow-auto sm:max-w-xl"
            side="left"
          >
            <SheetHeader>
              <SheetTitle>ADICIONAR CUPOM</SheetTitle>
            </SheetHeader>
            <CouponForm />
          </SheetContent>
        </Sheet>
      </div>

      {selectedCoupon && (
        <DashboardItemCard.Root className="border">
          <DashboardItemCard.Content>
            <p className="text-sm leading-7">{selectedCoupon.code}</p>
            <span className="text-xs text-muted-foreground">
              {selectedCoupon.retailer.name}
            </span>
          </DashboardItemCard.Content>

          <DashboardItemCard.Actions>
            <DashboardItemCard.Action
              variant="destructive"
              icon={Icons.X}
              onClick={() => setSelectedCoupon(undefined)}
            />
          </DashboardItemCard.Actions>
        </DashboardItemCard.Root>
      )}

      {/* Coupons */}
      {coupons.length > 0 ? (
        <ScrollArea
          className={cn('rounded-md border', {
            'h-[600px]': coupons.length > 8,
          })}
        >
          {coupons
            .filter(
              (coupon) =>
                coupon.retailer.name == selectedRetailer ||
                selectedRetailer == 'Todos',
            )
            .map((coupon) => (
              <DashboardItemCard.Root key={coupon.id}>
                <DashboardItemCard.Content
                  className="cursor-pointer"
                  onClick={() => setSelectedCoupon(coupon)}
                >
                  <p className="text-sm leading-7">{coupon.code}</p>
                  <span className="text-xs text-muted-foreground">
                    {coupon.retailer.name} • {couponFormatter(coupon.discount)}{' '}
                    • Atualizado {dayjs(coupon.updatedAt).fromNow()}
                  </span>
                </DashboardItemCard.Content>

                <DashboardItemCard.Actions>
                  <Sheet
                    open={openDialogs[`couponUpdateForm.${coupon.id}`]}
                    onOpenChange={(open) =>
                      setOpenDialog(`couponUpdateForm.${coupon.id}`, open)
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
                        <SheetTitle>EDITAR CUPOM</SheetTitle>
                      </SheetHeader>
                      <CouponForm mode="update" coupon={coupon} />
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
                            deleteCoupon({ variables: { couponId: coupon.id } })
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
          <p className="text-muted-foreground">Nenhum cupom encontrado.</p>
        </div>
      )}
    </div>
  )
}
