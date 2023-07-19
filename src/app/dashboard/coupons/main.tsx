'use client'

import { gql, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { env } from '@/env.mjs'
import { type Coupon, type Retailer } from '@/types'

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
    React.useState<(typeof coupons)[0]>()
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
      <div className="flex justify-end gap-x-2">
        <Sheet>
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
        <div className="flex items-start gap-6 rounded-md bg-muted px-8 py-4">
          {/* Content */}
          <div className="flex flex-1 flex-col gap-y-2">
            <p className="text-sm leading-7">{selectedCoupon.code}</p>
            <span className="text-xs text-muted-foreground">
              {selectedCoupon.retailer.name}
            </span>
          </div>
          <div className="self-center">
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setSelectedCoupon(undefined)}
            >
              <Icons.X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Coupons */}
      {coupons.length > 0 ? (
        <ScrollArea className="rounded-md border bg-primary-foreground">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="flex items-start gap-6 rounded-md px-8 py-4 hover:bg-muted"
            >
              {/* Content */}
              <div
                className="flex flex-1 cursor-pointer flex-col gap-y-2"
                onClick={() => setSelectedCoupon(coupon)}
              >
                <p className="text-sm leading-7">{coupon.code}</p>
                <span className="text-xs text-muted-foreground">
                  {coupon.retailer.name}
                </span>
              </div>

              {/* Coupon Actions */}
              <div className="flex gap-2 self-center">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Icons.Edit className="h-4 w-4" />
                    </Button>
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
                    <Button variant="destructive" size="icon">
                      <Icons.Trash className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete your account and remove your data from our
                        servers.
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
              </div>
            </div>
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
