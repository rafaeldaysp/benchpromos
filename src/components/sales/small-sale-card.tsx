'use client'

import { type ApolloClient } from '@apollo/client'
import { BookmarkFilledIcon } from '@radix-ui/react-icons'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'

import { CopyButton } from '@/components/copy-button'
import { Icons } from '@/components/icons'
import { Reactions } from '@/components/sales/reactions'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { type Reaction } from '@/types'
import { priceFormatter } from '@/utils/formatter'
import useTouch from '@/hooks/use-touch'
import { Drawer, DrawerContent } from '../ui/drawer'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

interface SaleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  sale: {
    id: string
    title: string
    slug: string
    imageUrl: string
    url: string
    price: number
    highlight: boolean
    installments?: number
    totalInstallmentPrice?: number
    caption?: string
    review?: string
    label?: string
    coupon?: string
    cashback?: string
    createdAt: string
    productSlug?: string
    category: {
      name: string
      slug: string
    }
    // comments: {
    //   id: string
    // }[]
    commentsCount: number
    reactions: Reaction[]
  }
  user?: { id: string; isAdmin: boolean }
  apolloClient: ApolloClient<unknown>
}

export function SmallSaleCard({
  sale,
  className,
  user,
  apolloClient,
  ...props
}: SaleCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null)

  const isTouched = useTouch(1000, cardRef)
  const [openDrawer, setOpenDrawer] = React.useState(false)

  React.useEffect(() => {
    if (isTouched) setOpenDrawer(true)
  }, [isTouched])

  return (
    <>
      <Card
        ref={cardRef}
        className={cn(
          'relative flex flex-col overflow-hidden transition-colors hover:bg-muted/50 max-sm:select-none',
          className,
        )}
        {...props}
      >
        {sale.highlight && (
          <BookmarkFilledIcon className="absolute -top-1 right-2 text-auxiliary" />
        )}

        <CardHeader className="flex-row items-baseline p-3 text-xs">
          <span className="flex-1">{sale.category.name}</span>

          {sale.label && (
            <Badge className="px-0.5 py-[1px] text-xs ">{sale.label}</Badge>
          )}

          <time className="flex-1 text-end">
            {dayjs(sale.createdAt).fromNow()}
          </time>
        </CardHeader>

        <CardContent className="flex-1 space-y-0.5 p-3 py-0">
          <CardTitle className="line-clamp-2 space-x-1 pb-2.5 text-sm">
            <Link href={`/sale/${sale.slug}/${sale.id}`}>{sale.title}</Link>
          </CardTitle>

          <div className="grid grid-cols-3 gap-x-5">
            <div>
              <Link
                className="flex h-full items-center"
                href={`/sale/${sale.slug}/${sale.id}`}
              >
                <div className="relative mx-auto aspect-square w-full sm:w-8/12">
                  <Image
                    src={sale.imageUrl}
                    alt={sale.title}
                    className="rounded-lg object-contain"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              </Link>
            </div>
            <div className="col-span-2 flex flex-col justify-center space-y-1.5">
              <div className="flex flex-col">
                <p>
                  <strong className="text-lg sm:text-2xl">
                    {priceFormatter.format(sale.price / 100)}
                  </strong>{' '}
                  <span className="text-sm text-muted-foreground">
                    à vista{' '}
                  </span>
                </p>

                {!!sale.installments && !!sale.totalInstallmentPrice && (
                  <span className="text-sm text-muted-foreground">
                    <strong>
                      {priceFormatter.format(sale.totalInstallmentPrice / 100)}
                    </strong>{' '}
                    em <strong>{sale.installments}x</strong>{' '}
                    <p className="hidden sm:inline">
                      {' '}
                      de{' '}
                      <strong>
                        {priceFormatter.format(
                          sale.totalInstallmentPrice /
                            (100 * sale.installments),
                        )}
                      </strong>
                    </p>
                  </span>
                )}
              </div>

              {sale.coupon && (
                <div>
                  <span className="text-sm text-muted-foreground">
                    Com cupom
                  </span>
                  <div className="flex items-center overflow-hidden rounded-full border pl-2 max-sm:max-w-fit">
                    <Icons.Tag className="mr-2 hidden h-4 w-4 fill-auxiliary text-auxiliary sm:inline" />
                    <span className="flex-1 overflow-hidden text-xs font-medium uppercase tracking-widest sm:text-sm">
                      {/* {sale.coupon} */}PCFACTSMONITOR
                    </span>
                    <CopyButton
                      value={'sale.coupon'}
                      variant="ghost"
                      className="h-7 hover:bg-inherit hover:text-inherit max-sm:px-2 sm:h-8"
                    />
                  </div>
                </div>
              )}

              <div>
                <a
                  href={sale.url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'hidden w-full rounded-full sm:inline-flex',
                  )}
                >
                  <span className="mr-2">ACESSAR</span>
                  <Icons.ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-x-2 p-3 pt-0 sm:p-6 sm:pt-0">
          <Reactions
            saleId={sale.id}
            userId={user?.id}
            reactions={sale.reactions}
            apolloClient={apolloClient}
          />

          <Link
            href={`/sale/${sale.slug}/${sale.id}#comments`}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'icon' }),
              'shrink-0',
            )}
          >
            <span className="mr-1 text-sm">{sale.commentsCount ?? 0}</span>
            <Icons.MessageCircle className="h-4 w-4" />
          </Link>
        </CardFooter>

        <CardFooter className="flex justify-center p-0 sm:hidden">
          <a
            href={sale.url}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({ variant: 'secondary' }),
              'h-8 w-full rounded-none sm:inline-flex',
            )}
          >
            <span className="mr-2 text-xs">ACESSAR</span>
            <Icons.ExternalLink className="h-4 w-4" />
          </a>
        </CardFooter>
      </Card>

      <MobileMenu open={openDrawer} setOpen={setOpenDrawer} />
    </>
  )
}

interface MobileMenuProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

function MobileMenu({ open, setOpen }: MobileMenuProps) {
  return (
    <Drawer open={open} onClose={() => setOpen(false)}>
      <DrawerContent>
        <div className="flex-1 rounded-t-[10px] bg-white p-4">
          <div className="mx-auto mb-8 h-1.5 w-12 shrink-0 rounded-full bg-zinc-300" />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
