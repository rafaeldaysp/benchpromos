import Link from 'next/link'
import * as React from 'react'

import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { Icons } from './icons'
import { Button, buttonVariants } from './ui/button'
import { Card, CardContent } from './ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from './ui/sheet'

interface LoginPopupProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function LoginPopup({ open, setOpen }: LoginPopupProps) {
  const isSm = useMediaQuery('(max-width: 640px)')

  if (isSm)
    return (
      <Sheet
        open={open}
        onOpenChange={(value) => {
          if (!value) setOpen(false)
        }}
      >
        <SheetContent
          className="flex h-fit flex-col space-y-2 rounded-t-2xl py-4"
          side={'bottom'}
        >
          <SheetHeader>
            <SheetTitle>Faça login para aproveitar</SheetTitle>
            <SheetDescription>
              Conheça os recursos que oferecemos aos nossos usuários
            </SheetDescription>
          </SheetHeader>
          <Card>
            <CardContent className="p-4 text-start text-sm font-semibold text-muted-foreground">
              <ul className="space-y-2">
                <li className="flex items-start gap-x-2">
                  <Icons.Bell className="mr-1 h-4 w-4 text-auxiliary" /> Alertas
                  de preço de produtos e promoções
                </li>
                <li className="flex items-start gap-x-2">
                  <Icons.MessageCircle className="mr-1 h-4 w-4 text-auxiliary" />{' '}
                  Comentários liberados
                </li>

                <li className="flex items-start gap-x-2">
                  <Icons.SmilePlus className="mr-1 h-4 w-4 text-auxiliary" />{' '}
                  Reações nas postagens e curtidas em comentários
                </li>
              </ul>
            </CardContent>
          </Card>
          <SheetFooter className="flex flex-col gap-2">
            <Link
              href={'/sign-in'}
              className={cn(buttonVariants(), 'w-full')}
              onClick={() => setOpen(false)}
            >
              Fazer login agora
            </Link>
            <Button
              variant={'outline'}
              className="w-full"
              onClick={() => setOpen(false)}
            >
              Deixar para depois
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) setOpen(false)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">
            Faça login para aproveitar
          </DialogTitle>
          <DialogDescription className="text-center">
            Conheça os recursos que oferecemos aos nossos usuários
          </DialogDescription>
        </DialogHeader>
        <Card>
          <CardContent className="p-4 text-start text-sm font-semibold text-muted-foreground">
            <ul className="space-y-2">
              <li className="flex items-start gap-x-2">
                <Icons.Bell className="mr-1 h-4 w-4 text-auxiliary" /> Alertas
                de preço de produtos e promoções
              </li>
              <li className="flex items-start gap-x-2">
                <Icons.MessageCircle className="mr-1 h-4 w-4 text-auxiliary" />{' '}
                Comentários liberados
              </li>

              <li className="flex items-start gap-x-2">
                <Icons.SmilePlus className="mr-1 h-4 w-4 text-auxiliary" />{' '}
                Reações nas postagens e curtidas em comentários
              </li>
            </ul>
          </CardContent>
        </Card>
        <DialogFooter className="flex gap-2">
          <Link
            href={'/sign-in'}
            className={cn(buttonVariants(), 'w-full')}
            onClick={() => setOpen(false)}
          >
            Fazer login agora
          </Link>
          <Button
            variant={'outline'}
            className="w-full"
            onClick={() => setOpen(false)}
          >
            Deixar para depois
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
