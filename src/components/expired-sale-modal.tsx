'use client'

import * as React from 'react'

import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { Icons } from './icons'
import { Button } from './ui/button'
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

interface ExpiredSaleModalProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function ExpiredSaleModal({ open, setOpen }: ExpiredSaleModalProps) {
  const isSm = useMediaQuery('(max-width: 640px)')

  if (isSm) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side={'bottom'}
          className={cn(
            'fixed inset-x-0 bottom-0 flex h-fit flex-col rounded-t-2xl sm:hidden',
          )}
        >
          <SheetHeader>
            <SheetTitle className="text-center">Promoção Expirada</SheetTitle>
          </SheetHeader>
          <div className="flex-1 space-y-4">
            <div className="flex items-center rounded-lg bg-destructive/20 p-3 text-sm">
              <Icons.AlertCircle className="mr-2 size-5 shrink-0 text-destructive" />
              <p className="font-semibold text-destructive">
                Esta promoção não está mais ativa
              </p>
            </div>

            <Card>
              <CardContent className="p-4 text-sm">
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    A promoção que você está visualizando foi marcada como
                    expirada. Isso significa que:
                  </p>
                  <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
                    <li>O preço anunciado pode não estar mais disponível</li>
                    <li>Cupons e descontos podem não funcionar mais</li>
                    <li>O produto pode estar indisponível na loja</li>
                  </ul>
                  <p className="pt-2 text-muted-foreground">
                    Ainda assim, você pode acessar o link da loja para verificar
                    se há outras ofertas disponíveis para este produto.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          <SheetFooter>
            <Button className="w-full" onClick={() => setOpen(false)}>
              Entendi
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-center">Promoção Expirada</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center rounded-lg bg-destructive/20 p-3 text-sm">
            <Icons.AlertCircle className="mr-2 size-5 shrink-0 text-destructive" />
            <p className="font-semibold text-destructive">
              Esta promoção não está mais ativa
            </p>
          </div>

          <Card>
            <CardContent className="p-4 text-sm">
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  A promoção que você está visualizando foi marcada como
                  expirada. Isso significa que:
                </p>
                <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
                  <li>O preço anunciado pode não estar mais disponível</li>
                  <li>Cupons e descontos podem não funcionar mais</li>
                  <li>O produto pode estar indisponível na loja</li>
                </ul>
                <p className="pt-2 text-muted-foreground">
                  Ainda assim, você pode acessar o link da loja para verificar
                  se há outras ofertas disponíveis para este produto.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <DialogFooter>
          <Button className="w-full" onClick={() => setOpen(false)}>
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
