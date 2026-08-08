'use client'

import Image from 'next/image'
import * as React from 'react'

import { Icons } from './icons'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'

interface SaleQrCodeModalProps {
  url: string
}

export function SaleQrCodeModal({ url }: SaleQrCodeModalProps) {
  const [open, setOpen] = React.useState(false)
  const qrCodeSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={() => setOpen(true)}
      >
        <Icons.QrCode className="mr-2 size-4" />
        QR Code
      </Button>
      <DialogContent className="flex w-fit flex-col items-center">
        <DialogHeader>
          <DialogTitle className="text-center">QR Code da promoção</DialogTitle>
        </DialogHeader>
        <Image
          src={qrCodeSrc}
          alt="QR Code da promoção"
          width={300}
          height={300}
          className="rounded-lg"
          unoptimized
        />
        <p className="max-w-[300px] truncate text-center text-xs text-muted-foreground">
          {url}
        </p>
      </DialogContent>
    </Dialog>
  )
}
