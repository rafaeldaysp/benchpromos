'use client'

import * as React from 'react'

import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import type { Cashback, Coupon } from '@/types'
import { Icons } from './icons'
import { Button, type ButtonProps } from './ui/button'
import { Card, CardContent } from './ui/card'
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

interface DealConfirmationModalProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  dealUrl: string
  coupon?: Pick<Coupon, 'code' | 'discount' | 'description'> | string
  cashback?: Pick<Cashback, 'value' | 'provider'>
}

export function DealConfirmationModal({
  dealUrl,
  coupon,
  cashback,
  className,
  children,
  ...props
}: Omit<ButtonProps, 'onClick'> &
  Pick<DealConfirmationModalProps, 'dealUrl' | 'coupon' | 'cashback'> & {
    children?: React.ReactNode
  }) {
  const [open, setOpen] = React.useState(false)
  const isSm = useMediaQuery('(max-width: 640px)')

  // Only render if coupon or cashback exists
  if (!coupon && !cashback) {
    return (
      <a
        href={dealUrl}
        target="_blank"
        className={cn(className)}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        className={cn(className)}
        onClick={(e) => {
          e.preventDefault()
          setOpen(true)
        }}
        {...props}
      >
        {children}
      </Button>
      {isSm ? (
        <DealConfirmationSheet
          open={open}
          setOpen={setOpen}
          dealUrl={dealUrl}
          coupon={coupon}
          cashback={cashback}
        />
      ) : (
        <DealConfirmationDialog
          dealUrl={dealUrl}
          coupon={coupon}
          cashback={cashback}
          setOpen={setOpen}
        />
      )}
    </Dialog>
  )
}

export function DealConfirmationDialog({
  dealUrl,
  coupon,
  cashback,
  setOpen,
}: Omit<DealConfirmationModalProps, 'open'>) {
  const handleContinue = () => {
    window.open(dealUrl, '_blank')
    setOpen(false)
  }

  return (
    <DialogContent className="w-[400px]" onClick={(e) => e.preventDefault()}>
      <DialogHeader>
        <DialogTitle className="text-center">Antes de continuar</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="flex items-center rounded-lg bg-auxiliary/20 p-2 text-sm text-auxiliary">
          <div className="flex items-center">
            <Icons.AlertCircle className="mr-2 size-4 text-auxiliary" />
          </div>
          <p className="font-semibold">
            Leia com atenção para aproveitar a oferta
          </p>
        </div>

        {coupon && (
          <Card>
            <CardContent className="p-4 text-sm">
              <div className="flex items-start gap-2">
                <Icons.Tag className="mt-0.5 size-4 text-auxiliary" />
                <div className="flex-1 space-y-1">
                  <p className="font-semibold">Cupom disponível</p>
                  {typeof coupon === 'string' ? (
                    <p className="text-muted-foreground">
                      Use o cupom{' '}
                      <strong className="text-foreground">{coupon}</strong>{' '}
                      antes de finalizar seu pedido.
                    </p>
                  ) : (
                    <>
                      <p className="text-muted-foreground">
                        Use o cupom{' '}
                        <strong className="text-foreground">
                          {coupon.code}
                        </strong>{' '}
                        antes de finalizar seu pedido.
                      </p>
                      {coupon.description && (
                        <p className="text-xs text-muted-foreground">
                          {coupon.description}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {cashback && (
          <Card>
            <CardContent className="p-4 text-sm">
              <div className="flex items-start gap-2">
                <Icons.RotateCcw className="mt-0.5 size-4 text-auxiliary" />
                <div className="flex-1 space-y-1">
                  <p className="font-semibold">Cashback disponível</p>
                  <p className="text-muted-foreground">
                    Para garantir{' '}
                    <strong className="text-foreground">
                      {cashback.value}% de cashback com {cashback.provider}
                    </strong>
                    , acesse primeiro o site do provedor de cashback e navegue
                    até a loja a partir de lá.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <article className="text-sm text-muted-foreground">
          <p className="inline-flex items-start gap-2">
            <Icons.AlertCircle className="mt-0.5 size-4 text-muted-foreground" />
            Os preços podem variar e os cupons estão sujeitos a validação. É
            possível que alguns não funcionem. Faça o teste no processo de
            checkout.
          </p>
        </article>
      </div>
      <DialogFooter>
        <Button className="w-full" onClick={handleContinue}>
          Entendi e continuar
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export function DealConfirmationSheet({
  open,
  setOpen,
  dealUrl,
  coupon,
  cashback,
}: DealConfirmationModalProps) {
  const handleContinue = () => {
    window.open(dealUrl, '_blank')
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side={'bottom'}
        className={cn(
          'fixed inset-x-0 bottom-0 flex h-fit flex-col rounded-t-2xl sm:hidden',
        )}
        onClick={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle className="text-center">Antes de continuar</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-4">
          <div className="flex items-center rounded-lg bg-auxiliary/20 p-2 text-sm text-auxiliary">
            <div className="flex items-center">
              <Icons.AlertCircle className="mr-2 size-4 text-auxiliary" />
            </div>
            <p className="font-semibold">
              Leia com atenção para aproveitar a oferta
            </p>
          </div>

          {coupon && (
            <Card>
              <CardContent className="p-4 text-sm">
                <div className="flex items-start gap-2">
                  <Icons.Tag className="mt-0.5 size-4 text-auxiliary" />
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold">Cupom disponível</p>
                    {typeof coupon === 'string' ? (
                      <p className="text-muted-foreground">
                        Copie o código{' '}
                        <strong className="text-foreground">{coupon}</strong> e
                        cole no carrinho de compras antes de finalizar seu
                        pedido.
                      </p>
                    ) : (
                      <>
                        <p className="text-muted-foreground">
                          Copie o código{' '}
                          <strong className="text-foreground">
                            {coupon.code}
                          </strong>{' '}
                          e cole no carrinho de compras antes de finalizar seu
                          pedido.
                        </p>
                        {coupon.description && (
                          <p className="text-xs text-muted-foreground">
                            {coupon.description}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {cashback && (
            <Card>
              <CardContent className="p-4 text-sm">
                <div className="flex items-start gap-2">
                  <Icons.RotateCcw className="mt-0.5 size-4 text-auxiliary" />
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold">Cashback disponível</p>
                    <p className="text-muted-foreground">
                      Para garantir{' '}
                      <strong className="text-foreground">
                        {cashback.value}% de cashback com {cashback.provider}
                      </strong>
                      , acesse primeiro o site do provedor de cashback e navegue
                      até a loja a partir de lá.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <article className="text-sm text-muted-foreground">
            <p className="inline-flex items-start gap-2">
              <Icons.AlertCircle className="mt-0.5 size-4 text-muted-foreground" />
              Os preços podem variar e os cupons estão sujeitos a validação. É
              possível que alguns não funcionem. Faça o teste no processo de
              checkout.
            </p>
          </article>
        </div>
        <SheetFooter>
          <Button className="w-full" onClick={handleContinue}>
            Entendi e continuar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
