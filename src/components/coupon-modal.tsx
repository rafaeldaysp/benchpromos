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
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from './ui/drawer'

interface CouponDialogProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  coupon: {
    code: string
    discount?: string
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
            Cupom disponível
          </span>
          {description}
        </div>
        <Icons.ChevronRight className="h-4 w-4" />
      </Button>

      {isSm ? (
        <CouponDrawer open={open} setOpen={setOpen} coupon={coupon} />
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
        <DialogTitle className="text-center">Cupom disponível</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <CopyButton value={coupon.code} />
        <p className="inline-flex items-center text-xs">
          <Icons.AlertCircle className="mr-2 h-6 w-6" />
          Copie o código e cole no carrinho de compras antes de finalizar seu
          pedido na loja.
        </p>
        <article className="text-sm text-muted-foreground">
          Lembrando que os cupons podem estar sujeitos a validação e é possível
          que alguns não funcionem. Faça o teste no processo de checkout.
        </article>
      </div>
      <DialogFooter>
        <Button className="w-full" onClick={() => setOpen(false)}>
          Entendi
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export function CouponDrawer({ open, setOpen, coupon }: CouponDialogProps) {
  // const [snap, setSnap] = React.useState<number | string | null>(0.7)
  return (
    <Drawer
      // snapPoints={[0.7, 1]}
      // activeSnapPoint={snap}
      // setActiveSnapPoint={setSnap}
      open={open}
      onClose={() => setOpen(false)}
    >
      <DrawerContent
        className={cn(
          'fixed inset-x-0 bottom-0 flex h-[35%] flex-col rounded-t-2xl sm:hidden',
        )}
        onClick={(e) => e.preventDefault()}
      >
        <div className="relative -top-4 left-1/2 h-1.5 w-12 shrink-0 -translate-x-1/2 rounded-full bg-accent" />
        <DrawerHeader>
          <DrawerTitle className="text-center">Cupom disponível</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 space-y-4">
          <CopyButton value={coupon.code} />
          <p className="inline-flex items-center text-xs">
            <Icons.AlertCircle className="mr-2 h-6 w-6" />
            Copie o código e cole no carrinho de compras antes de finalizar seu
            pedido na loja.
          </p>
          <article className="text-sm text-muted-foreground">
            Lembrando que os cupons podem estar sujeitos a validação e é
            possível que alguns não funcionem. Faça o teste no processo de
            checkout.
          </article>
        </div>
        <DrawerFooter>
          <Button className="w-full" onClick={() => setOpen(false)}>
            Entendi
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
