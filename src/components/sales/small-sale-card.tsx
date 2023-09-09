'use client'

import { type ApolloClient } from '@apollo/client'
import { BookmarkFilledIcon } from '@radix-ui/react-icons'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'

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
import { ContextMenu, ContextMenuTrigger } from '../ui/context-menu'
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
  const [openDrawer, setOpenDrawer] = React.useState(false)

  // const cardRef = React.useRef<HTMLDivElement>(null)
  // const isTouched = useTouch(400, cardRef)
  // React.useEffect(() => {
  //   if (isTouched) setOpenDrawer(true)
  // }, [isTouched])

  return (
    <>
      <ContextMenu onOpenChange={(value) => setOpenDrawer(value)}>
        <ContextMenuTrigger>
          <Card
            // ref={cardRef}
            className={cn(
              'relative flex select-none flex-col overflow-hidden transition-colors hover:bg-muted/50',
              className,
            )}
            {...props}
          >
            {sale.highlight && (
              <BookmarkFilledIcon className="absolute -top-1 right-2 text-auxiliary" />
            )}
            <Link href={`/sale/${sale.slug}/${sale.id}`}>
              <CardHeader className="flex-row items-baseline p-3 text-xs">
                <span className="flex-1">{sale.category.name}</span>

                {sale.label && (
                  <Badge className="px-1 py-[1px] text-xs">{sale.label}</Badge>
                )}

                <time className="flex-1 text-end">
                  {dayjs(sale.createdAt).fromNow()}
                </time>
              </CardHeader>
              <CardContent className="flex-1 space-y-1.5 p-3 py-0">
                <CardTitle className="line-clamp-2 space-x-1 text-sm">
                  {sale.title}
                </CardTitle>

                <div className="grid grid-cols-3 gap-x-3">
                  <div className="flex h-full items-center">
                    <div className="relative mx-auto aspect-square w-full sm:w-8/12">
                      <Image
                        src={sale.imageUrl}
                        alt={sale.title}
                        className="rounded-lg object-contain"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  </div>
                  <div className="col-span-2 flex flex-col justify-center space-y-1.5">
                    <div className="flex flex-col">
                      <p>
                        <strong className="text-xl sm:text-2xl">
                          {priceFormatter.format(sale.price / 100)}
                        </strong>{' '}
                        <span className="text-xs text-muted-foreground">
                          à vista{' '}
                        </span>
                      </p>

                      {!!sale.installments && !!sale.totalInstallmentPrice && (
                        <span className="text-xs text-muted-foreground">
                          ou{' '}
                          <strong className="text-sm">
                            {priceFormatter.format(
                              sale.totalInstallmentPrice / 100,
                            )}
                          </strong>{' '}
                          em{' '}
                          <strong className="text-sm">
                            {sale.installments}x
                          </strong>{' '}
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
                      <p className="flex flex-col text-xs">
                        <span className="text-muted-foreground">Com cupom</span>
                        <span className="text-sm font-bold">{sale.coupon}</span>
                      </p>
                    )}

                    {sale.cashback && (
                      <p className="flex flex-col text-xs">
                        <span className="text-muted-foreground">
                          Com cashback
                        </span>
                        <span className="text-sm font-bold">
                          {sale.cashback}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Link>
            <CardFooter className="flex items-center justify-between gap-x-2 p-3 pt-1.5">
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
          </Card>
        </ContextMenuTrigger>
      </ContextMenu>
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
      <DrawerContent className="h-[50%] rounded-t-xl">
        <div className="mx-auto mb-8 h-1.5 w-12 shrink-0 rounded-full bg-accent" />
      </DrawerContent>
    </Drawer>
  )
}
