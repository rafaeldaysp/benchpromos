'use client'

import { type ApolloClient } from '@apollo/client'
import { BookmarkFilledIcon, StarFilledIcon } from '@radix-ui/react-icons'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'

import { CashbackModal } from '@/components/cashback-modal'
import { CouponModal } from '@/components/coupon-modal'
import { Icons } from '@/components/icons'
import { ReactionMenu } from '@/components/sales/reaction-menu'
import { Reactions } from '@/components/sales/reactions'
import { HighlightSaleToggle } from '@/components/sales/sale-highlight'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import type { Cashback } from '@/types'
import { priceFormatter } from '@/utils/formatter'
import { ReactionDrawer } from './reaction-drawer'

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
    cashback?: Omit<Cashback, 'id' | 'url'>
    createdAt: string
    productSlug?: string
    category: {
      name: string
      slug: string
    }
    commentsCount: number
    reactions: {
      content: string
      userId: string
    }[]
  }
  user?: { id: string; isAdmin: boolean }
  apolloClient: ApolloClient<unknown>
}

export function SaleCard({
  sale,
  user,
  apolloClient,
  className,
  ...props
}: SaleCardProps) {
  const [openMobileMenu, setOpenMobileMenu] = React.useState(false)
  const isSm = useMediaQuery('(max-width: 640px)')
  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger disabled={isSm} asChild>
          <Card
            className={cn(
              'relative flex select-none flex-col overflow-hidden transition-colors hover:bg-muted/50 sm:select-auto',
              className,
            )}
            {...props}
          >
            {sale.highlight && (
              <BookmarkFilledIcon className="absolute -top-1 right-2 text-auxiliary sm:-top-0.5 sm:right-5" />
            )}

            <CardHeader className="flex-row items-baseline space-y-0 p-3 text-xs sm:p-6 sm:text-sm">
              <span className="flex-1">{sale.category.name}</span>

              {sale.label && (
                <Badge className="px-1 py-[1px] text-xs sm:hidden">
                  {sale.label}
                </Badge>
              )}

              <time className="flex-1 text-end">
                {dayjs(sale.createdAt).fromNow()}
              </time>
            </CardHeader>

            <CardContent className="flex-1 space-y-1.5 p-3 py-0 sm:space-y-2 sm:p-6 sm:pt-0">
              <CardTitle className="line-clamp-2 space-x-1 font-semibold leading-none tracking-tight max-sm:text-sm sm:line-clamp-3">
                <Link href={`/sale/${sale.slug}/${sale.id}`}>{sale.title}</Link>
              </CardTitle>

              <div className="grid grid-cols-3 gap-x-3 sm:block sm:gap-x-0 sm:space-y-2">
                <Link
                  href={`/sale/${sale.slug}/${sale.id}`}
                  className="flex h-full items-center"
                >
                  <div className="relative mx-auto aspect-square w-full select-none sm:w-8/12">
                    <Image
                      src={sale.imageUrl}
                      alt={sale.title}
                      className="rounded-lg object-contain"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                </Link>

                {sale.caption && (
                  <CardDescription className="line-clamp-3 max-sm:hidden">
                    {sale.caption}
                  </CardDescription>
                )}

                {sale.label && (
                  <Badge variant="default" className="hidden sm:inline-flex">
                    <StarFilledIcon className="mr-1" />
                    {sale.label}
                  </Badge>
                )}
                <div className="col-span-2 flex flex-col justify-center space-y-1.5 text-[14px] sm:space-y-2">
                  <div className="flex flex-col">
                    <p>
                      <strong className="text-xl sm:text-2xl">
                        {priceFormatter.format(sale.price / 100)}
                      </strong>{' '}
                      <span className="text-xs text-muted-foreground sm:text-sm">
                        à vista{' '}
                      </span>
                    </p>

                    {!!sale.installments && !!sale.totalInstallmentPrice && (
                      <span className="text-muted-foreground max-sm:text-xs">
                        ou{' '}
                        <strong className="max-sm:text-sm">
                          {priceFormatter.format(
                            sale.totalInstallmentPrice / 100,
                          )}
                        </strong>{' '}
                        em{' '}
                        <strong className="max-sm:text-sm">
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

                  <footer className="space-y-1.5">
                    {sale.coupon && (
                      <section className="text-xs sm:text-sm">
                        <p className="flex flex-col text-muted-foreground sm:hidden">
                          Com cupom
                          <span className="text-sm font-bold text-foreground sm:hidden">
                            {sale.coupon}
                          </span>
                        </p>

                        <CouponModal
                          className="hidden sm:inline-flex"
                          coupon={{ code: sale.coupon }}
                        />
                      </section>
                    )}

                    {sale.cashback && (
                      <section className="text-xs sm:text-sm">
                        <p className="flex flex-col text-muted-foreground sm:hidden">
                          Com cashback
                          <span className="text-sm font-bold text-foreground sm:hidden">
                            {sale.cashback.value}% com {sale.cashback.provider}
                          </span>
                        </p>
                        <CashbackModal
                          cashback={sale.cashback}
                          className="hidden sm:inline-flex"
                        />
                      </section>
                    )}

                    <div>
                      <a
                        href={sale.url}
                        target="_blank"
                        className={cn(
                          buttonVariants(),
                          'hidden h-fit w-full rounded-xl font-semibold sm:inline-flex',
                        )}
                      >
                        <span className="mr-2">ACESSAR</span>
                        <Icons.ExternalLink
                          className="h-4 w-4"
                          strokeWidth={3}
                        />
                      </a>
                    </div>
                  </footer>
                </div>
              </div>
            </CardContent>

            <CardFooter className="block space-y-1.5 p-3 pt-1.5 sm:p-6 sm:pt-0">
              <div className="flex w-full items-center justify-between gap-x-1.5">
                <div className="flex items-center gap-x-1.5">
                  <Button
                    size={'icon'}
                    variant={'ghost'}
                    className="w-6 shrink-0 sm:hidden"
                    onClick={() => setOpenMobileMenu(true)}
                  >
                    <Icons.MoreVertical className="h-4 w-4" />
                  </Button>
                  <Reactions
                    saleId={sale.id}
                    userId={user?.id}
                    reactions={sale.reactions}
                    apolloClient={apolloClient}
                  />
                </div>

                <Link
                  href={`/sale/${sale.slug}/${sale.id}#comments`}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'icon' }),
                    'shrink-0',
                  )}
                >
                  <span className="mr-1 text-sm">
                    {sale.commentsCount ?? 0}
                  </span>
                  <Icons.MessageCircle className="h-4 w-4" />
                </Link>
              </div>
              <Link
                href={`/sale/${sale.slug}/${sale.id}`}
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  'h-fit w-full rounded-xl py-1.5 font-semibold sm:hidden',
                )}
              >
                VISUALIZAR
                <Icons.ChevronRight className="ml-1 h-4 w-4" strokeWidth={3} />
              </Link>
            </CardFooter>
          </Card>
        </ContextMenuTrigger>

        <ContextMenuContent>
          {/* <MobileMenu open={openDrawer} setOpen={setOpenDrawer} /> */}
          <ContextMenuSub>
            <ContextMenuSubTrigger className="flex gap-2">
              <Icons.SmilePlus className="h-4 w-4" />
              <span>Reagir</span>
            </ContextMenuSubTrigger>
            <ReactionMenu
              saleId={sale.id}
              userId={user?.id}
              apolloClient={apolloClient}
            />
          </ContextMenuSub>

          <ContextMenuItem asChild>
            <Link href={`/sale/${sale.slug}/${sale.id}#comments`}>
              <Icons.MessageCircle className="mr-2 h-4 w-4" />
              <span>Comentar</span>
            </Link>
          </ContextMenuItem>

          <ContextMenuSeparator />

          {sale.productSlug && (
            <ContextMenuItem asChild>
              <Link href={`/${sale.category.slug}/${sale.productSlug}`}>
                <Icons.Eye className="mr-2 h-4 w-4" />
                <span>Ver produto</span>
              </Link>
            </ContextMenuItem>
          )}
          <ContextMenuItem asChild>
            <Link href={`/sale/${sale.slug}/${sale.id}`}>
              <Icons.GanttChartSquare className="mr-2 h-4 w-4" />
              <span>Mais detalhes</span>
            </Link>
          </ContextMenuItem>

          {user?.isAdmin && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem className="p-0">
                <HighlightSaleToggle
                  sale={{ highlight: sale.highlight, id: sale.id }}
                  user={user}
                />
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
      <MobileMenu
        open={openMobileMenu}
        setOpen={setOpenMobileMenu}
        sale={sale}
        apolloClient={apolloClient}
        user={user}
      />
    </>
  )
}

interface MobileMenuProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  sale: {
    slug: string
    id: string
    productSlug?: string
    category: {
      slug: string
    }
  }
  user?: { id: string; isAdmin: boolean }
  apolloClient: ApolloClient<unknown>
}

function MobileMenu({
  open,
  setOpen,
  sale,
  user,
  apolloClient,
}: MobileMenuProps) {
  const [snap, setSnap] = React.useState<number | string | null>(0.7)
  return (
    <Drawer
      snapPoints={[0.7, 1]}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      open={open}
      onClose={() => setOpen(false)}
    >
      <DrawerContent
        className={cn(
          'fixed h-full max-h-[70%] space-y-2 rounded-t-2xl sm:hidden',
          {
            'overflow-y-hidden': snap !== 1,
          },
        )}
      >
        <div className="relative -top-2 left-1/2 h-1.5 w-12 shrink-0 -translate-x-1/2 rounded-full bg-accent" />
        <main className="flex flex-col space-y-1">
          <ReactionDrawer
            saleId={sale.id}
            apolloClient={apolloClient}
            userId={user?.id}
          />

          <h3 className="py-2 text-sm text-muted-foreground">Interagir</h3>
          <Link
            href={`/sale/${sale.slug}/${sale.id}#comments`}
            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          >
            <Icons.MessageCircle className="mr-4 h-4 w-4" />
            <span>Comentar</span>
          </Link>

          <Link
            href={`/sale/${sale.slug}/${sale.id}`}
            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          >
            <Icons.GanttChartSquare className="mr-4 h-4 w-4" />
            <span>Visualizar promoção</span>
          </Link>
          {sale.productSlug && (
            <>
              <h3 className="py-3 text-sm text-muted-foreground">
                Mais informações
              </h3>

              <Link
                href={`/${sale.category.slug}/${sale.productSlug}`}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <Icons.Eye className="mr-4 h-4 w-4" />
                <span>Visualizar produto</span>
              </Link>
              <Link
                href={`/${sale.category.slug}/${sale.productSlug}#historico`}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <Icons.LineChart className="mr-4 h-4 w-4" />
                <span>Histórico de preços</span>
              </Link>
              <Link
                href={`/${sale.category.slug}/${sale.productSlug}#precos`}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <Icons.DollarSign className="mr-4 h-4 w-4" />
                <span>Opções de compra</span>
              </Link>
            </>
          )}
        </main>
      </DrawerContent>
    </Drawer>
  )
}
