'use client'

import * as React from 'react'

import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { CopyButton } from './copy-button'
import { Icons } from './icons'
import { Button, type ButtonProps } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from './ui/sheet'

interface CouponDialogProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  coupon: {
    code: string
    discount?: string
    description?: string
  }
  description?: React.ReactNode
}

export function CouponModal({
  coupon,
  description,
  className,
  variant = 'secondary',
  ...props
}: ButtonProps & Pick<CouponDialogProps, 'coupon' | 'description'>) {
  const [open, setOpen] = React.useState(false)
  const isSm = useMediaQuery('(max-width: 640px)')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        id="coupon_view_from_sale_card"
        variant={variant}
        className={cn(
          'flex h-fit w-full items-center justify-between gap-2 rounded-xl px-4',
          className,
        )}
        onClick={(e) => {
          setOpen(true)
          e.preventDefault()
        }}
        {...props}
      >
        <div className="flex flex-col items-start">
          <span className="flex items-center font-semibold">
            <Icons.Tag className="mr-2 h-4 w-4 text-auxiliary" />
            Coupon available
          </span>
          {description}
        </div>
        <Icons.ChevronRight className="h-4 w-4" />
      </Button>

      {isSm ? (
        <CouponSheet open={open} setOpen={setOpen} coupon={coupon} />
      ) : (
        <CouponDialog coupon={coupon} setOpen={setOpen} />
      )}
    </Dialog>
  )
}

export function CouponDialog({
  coupon,
  setOpen,
}: Omit<CouponDialogProps, 'open'>) {
  return (
    <DialogContent className="w-[400px]" onClick={(e) => e.preventDefault()}>
      <DialogHeader>
        <DialogTitle className="text-center">Coupon available</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        {coupon.description && (
          <div className="flex items-center rounded-lg bg-auxiliary/20 p-2 text-sm text-auxiliary">
            <div className="flex items-center">
              <Icons.AlertCircle className="mr-2 h-4 w-4 text-auxiliary" />
            </div>
            <p className="font-semibold">{coupon.description}</p>
          </div>
        )}
        <CopyButton value={coupon.code} />
        <p className="inline-flex items-center text-xs">
          <Icons.AlertCircle className="mr-2 h-6 w-6 text-auxiliary" />
          Copy the code and paste it into your shopping cart before finalizing
          your purchase at the store.
        </p>
        <article className="text-sm text-muted-foreground">
          Note that coupons may be subject to validation and some may not work.
          Make the test in the checkout process.
        </article>
      </div>
      <DialogFooter>
        <Button className="w-full" onClick={() => setOpen(false)}>
          I understand
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export function CouponSheet({ open, setOpen, coupon }: CouponDialogProps) {
  // const [snap, setSnap] = React.useState<number | string | null>(0.7)
  return (
    <Sheet
      // snapPoints={[0.7, 1]}
      // activeSnapPoint={snap}
      // setActiveSnapPoint={setSnap}
      open={open}
      onOpenChange={setOpen}
    >
      <SheetContent
        side={'bottom'}
        className={cn(
          'fixed inset-x-0 bottom-0 flex h-fit flex-col rounded-t-2xl sm:hidden',
        )}
        onClick={(e) => e.preventDefault()}
      >
        {/* <div className="relative -top-4 left-1/2 h-1.5 w-12 shrink-0 -translate-x-1/2 rounded-full bg-accent" /> */}
        <SheetHeader>
          <SheetTitle className="text-center">Available coupon</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-4">
          {coupon.description && (
            <div className="flex items-center rounded-lg bg-auxiliary/20 p-2 text-sm text-auxiliary">
              <div className="flex items-center">
                <Icons.AlertCircle className="mr-2 h-4 w-4 text-auxiliary" />
              </div>
              <p className="font-semibold">{coupon.description}</p>
            </div>
          )}
          <CopyButton value={coupon.code} />
          <p className="inline-flex items-center text-xs">
            <Icons.AlertCircle className="mr-2 h-6 w-6 text-auxiliary" />
            Copy the code and paste it into your shopping cart before finalizing
            your purchase at the store.
          </p>
          <article className="text-sm text-muted-foreground">
            Note that coupons may be subject to validation and some may not
            work. Make the test in the checkout process.
          </article>
        </div>
        <SheetFooter>
          <Button className="w-full" onClick={() => setOpen(false)}>
            I understand
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
