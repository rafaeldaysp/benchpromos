'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { DashboardItemCard } from '@/components/dashboard-item-card'
import { Icons } from '@/components/icons'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useExpireCouponSales } from '@/hooks/use-expire-coupon-sales'

interface ExpireCouponSalesDialogProps {
  coupon: { id: string; code: string }
}

export function ExpireCouponSalesDialog({
  coupon,
}: ExpireCouponSalesDialogProps) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  // Count only while the dialog is open, so the list doesn't query per row.
  const { activeSalesCount, isCounting, expireSales, isExpiring } =
    useExpireCouponSales(coupon.id, open)

  async function handleConfirm() {
    const count = await expireSales()
    if (count === null) return
    setOpen(false)
    router.refresh()
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <DashboardItemCard.Action
          icon={Icons.Clock8}
          title="Expirar promoções com este cupom"
          aria-label="Expirar promoções com este cupom"
        />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Expirar promoções do cupom?</AlertDialogTitle>
          <AlertDialogDescription>
            {isCounting || activeSalesCount === undefined ? (
              'Contando promoções ativas...'
            ) : activeSalesCount === 0 ? (
              <>
                Nenhuma promoção ativa usa o cupom{' '}
                <strong>{coupon.code}</strong>.
              </>
            ) : (
              <>
                {activeSalesCount === 1
                  ? '1 promoção ativa usa'
                  : `${activeSalesCount} promoções ativas usam`}{' '}
                o cupom <strong>{coupon.code}</strong>. Elas serão marcadas como
                expiradas e as ofertas vinculadas serão removidas dos produtos.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isExpiring}>Cancelar</AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={isExpiring || isCounting || !activeSalesCount}
          >
            {isExpiring && (
              <Icons.Spinner
                className="mr-2 size-4 animate-spin"
                aria-hidden="true"
              />
            )}
            Expirar promoções
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
