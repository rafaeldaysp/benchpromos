'use client'

import * as React from 'react'

import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { type Cashback } from '@/types'
import { Icons } from './icons'
import { Button, buttonVariants, type ButtonProps } from './ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card'
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

interface CashbackDialogProps {
  open: boolean
  openVideo: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  setOpenVideo: React.Dispatch<React.SetStateAction<boolean>>
  cashback: Pick<Cashback, 'provider' | 'value' | 'video' | 'affiliatedUrl'>
  description?: React.ReactNode
}

export function CashbackModal({
  cashback,
  description,
  className,
  variant = 'secondary',
  ...props
}: ButtonProps & Pick<CashbackDialogProps, 'cashback' | 'description'>) {
  const [open, setOpen] = React.useState(false)
  const [openVideo, setOpenVideo] = React.useState(false)
  const isSm = useMediaQuery('(max-width: 640px)')
  if (openVideo && cashback.video)
    return (
      <VideoDialog
        cashback={cashback}
        openVideo={openVideo}
        setOpen={setOpen}
        setOpenVideo={setOpenVideo}
      />
    )
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant={variant}
        className={cn(
          'flex h-fit w-full items-center justify-between gap-2 rounded-xl px-4',
          className,
        )}
        onClick={(e) => {
          e.preventDefault()
          setOpen(true)
        }}
        {...props}
      >
        <div className="flex flex-col items-start">
          <span className="flex items-center font-semibold">
            <Icons.RotateCcw className="mr-2 h-4 w-4 text-auxiliary" />
            Cashback
          </span>
          {description}
        </div>
        <Icons.ChevronRight className="h-4 w-4" />
      </Button>
      {isSm ? (
        <CashbackSheet
          open={open}
          setOpen={setOpen}
          openVideo={openVideo}
          setOpenVideo={setOpenVideo}
          cashback={cashback}
        />
      ) : (
        <CashbackDialog
          cashback={cashback}
          setOpen={setOpen}
          openVideo={openVideo}
          setOpenVideo={setOpenVideo}
        />
      )}
    </Dialog>
  )
}

export function CashbackDialog({
  cashback,
  setOpen,
  setOpenVideo,
}: Omit<CashbackDialogProps, 'open'>) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="text-center">Cashback</DialogTitle>
      </DialogHeader>
      <div className="flex w-full flex-col items-center gap-4">
        <div className="flex w-full cursor-default items-center justify-center gap-2 rounded-xl bg-muted p-4 font-semibold transition-colors hover:bg-muted/80">
          <Icons.RotateCcw className="h-4 w-4 text-auxiliary" strokeWidth={3} />
          <span>
            {cashback.value}% back with {cashback.provider}
          </span>
        </div>
        <Card className="w-full">
          <CardHeader className="p-4 text-center">
            <CardTitle>How does it work?</CardTitle>
            <CardDescription>
              To ensure cashback on your purchase, follow these steps:
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-start text-sm font-semibold text-muted-foreground">
            <ul className="space-y-2">
              <li className="flex items-start gap-x-2">
                1.
                <p>
                  Empty your cart on the store where you want to make the
                  purchase
                </p>
              </li>
              <li className="flex items-start gap-x-2">
                2.{' '}
                <span>
                  Access the{' '}
                  <a
                    className={cn(
                      buttonVariants({ variant: 'link' }),
                      'h-fit p-0 font-semibold',
                    )}
                    href={cashback.affiliatedUrl}
                    target="_blank"
                  >
                    site
                  </a>{' '}
                  cashback provider
                </span>
              </li>
              <li className="flex items-start gap-x-2">
                3.{' '}
                <p>
                  Enter the product store site from the cashback provider site
                </p>
              </li>
              <li className="flex items-start gap-x-2">
                4.{' '}
                <p>Add the product to your cart again and make your purchase</p>
              </li>
            </ul>
          </CardContent>
          {cashback.video && (
            <CardFooter className="p-4 pt-0">
              <Button
                variant={'secondary'}
                className="flex h-fit w-full rounded-xl text-start"
                onClick={() => {
                  setOpen(false)
                  setOpenVideo(true)
                }}
              >
                <div className="flex flex-1 flex-col justify-start space-x-6 text-sm">
                  <h3 className="flex items-center gap-x-2">
                    <Icons.YoutubeIcon className="h-4 w-4 text-auxiliary" />
                    Watch the video
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Watch a detailed explanation of the cashback
                  </p>
                </div>
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
      <DialogFooter>
        <Button className="w-full" onClick={() => setOpen(false)}>
          I understand
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export function CashbackSheet({
  open,
  setOpen,
  setOpenVideo,
  cashback,
}: CashbackDialogProps) {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        className={cn(
          'fixed inset-x-0 bottom-0 flex h-fit flex-col space-y-2 rounded-t-2xl py-4 sm:hidden',
        )}
        side={'bottom'}
      >
        {/* <div className="relative left-1/2 h-1.5 w-12 shrink-0 -translate-x-1/2 rounded-full bg-accent" /> */}
        <SheetHeader>
          <SheetTitle className="text-center">Cashback</SheetTitle>
        </SheetHeader>
        <div className="flex w-full flex-col items-center gap-4">
          <div className="flex w-full cursor-default items-center justify-center gap-2 rounded-xl bg-muted p-4 font-semibold transition-colors hover:bg-muted/80">
            <Icons.RotateCcw
              className="h-4 w-4 text-auxiliary"
              strokeWidth={3}
            />
            <span>
              {cashback.value}% back with {cashback.provider}
            </span>
          </div>
          <Card className="w-full">
            <CardHeader className="p-4 text-center">
              <CardTitle>How does it work?</CardTitle>
              <CardDescription>
                To ensure cashback on your purchase, follow these steps:
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-start text-sm font-semibold text-muted-foreground">
              <ul className="space-y-2">
                <li className="flex items-start gap-x-2">
                  1.
                  <p>
                    Empty your cart on the store where you want to make the
                    purchase
                  </p>
                </li>
                <li className="flex items-start gap-x-2">
                  2.{' '}
                  <span>
                    Access the{' '}
                    <a
                      className={cn(
                        buttonVariants({ variant: 'link' }),
                        'h-fit p-0 font-semibold',
                      )}
                      href={cashback.affiliatedUrl}
                      target="_blank"
                    >
                      site
                    </a>{' '}
                    cashback provider
                  </span>
                </li>
                <li className="flex items-start gap-x-2">
                  3.{' '}
                  <p>
                    Enter the product store site from the cashback provider site
                  </p>
                </li>
                <li className="flex items-start gap-x-2">
                  4.{' '}
                  <p>
                    Add the product to your cart again and make your purchase
                  </p>
                </li>
              </ul>
            </CardContent>
            {cashback.video && (
              <CardFooter className="p-4 pt-0">
                <Button
                  variant={'secondary'}
                  className="flex h-fit w-full rounded-xl text-start"
                  onClick={() => {
                    setOpen(false)
                    setOpenVideo(true)
                  }}
                >
                  <div className="flex flex-1 flex-col justify-start space-x-6 text-sm">
                    <h3 className="flex items-center gap-x-2">
                      <Icons.YoutubeIcon className="h-4 w-4 text-auxiliary" />
                      Watch the video
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Watch a detailed explanation of the cashback
                    </p>
                  </div>
                </Button>
              </CardFooter>
            )}
          </Card>
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

export function VideoDialog({
  cashback: { video },
  openVideo,
  setOpen,
  setOpenVideo,
}: Omit<CashbackDialogProps, 'open'>) {
  return (
    <Dialog
      open={openVideo}
      onOpenChange={(value) => {
        setOpenVideo(value)
        setOpen(!value)
      }}
    >
      <DialogContent className="w-full sm:max-w-[1280px]">
        <div className="aspect-video p-2">
          <iframe
            width="100%"
            height="100%"
            src={video}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
