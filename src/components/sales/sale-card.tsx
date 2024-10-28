'use client'

import { gql, useMutation, type ApolloClient } from '@apollo/client'
import { StarFilledIcon } from '@radix-ui/react-icons'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'
import { toast } from 'sonner'

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
import { env } from '@/env.mjs'
import { useFormStore } from '@/hooks/use-form-store'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useSaleExpired } from '@/hooks/use-toggle-sale-expired'
import { cn } from '@/lib/utils'
import type { Cashback } from '@/types'
import { removeNullValues } from '@/utils'
import { priceFormatter } from '@/utils/formatter'
import { priceCalculator } from '@/utils/price-calculator'
import { SaleForm } from '../forms/sale-form'
import { LoginPopup } from '../login-popup'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet'
import { MobileMenu } from './mobile-menu'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const DELETE_SALE = gql`
  mutation ($saleId: ID!) {
    removeSale(id: $saleId) {
      id
    }
  }
`

interface SaleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  sale: {
    id: string
    title: string
    slug: string
    imageUrl: string
    url: string
    price: number
    highlight: boolean
    sponsored: boolean
    expired: boolean
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
  user?: { id: string; role: 'ADMIN' | 'MOD' | 'USER' }
  apolloClient: ApolloClient<unknown>
}

export function SaleCard({
  sale,
  user,
  apolloClient,
  className,
  ...props
}: SaleCardProps) {
  const [openLoginPopup, setOpenLoginPopup] = React.useState(false)
  const [openMobileMenu, setOpenMobileMenu] = React.useState(false)
  const { openDialogs, setOpenDialog } = useFormStore()
  const { toggleSaleExpired } = useSaleExpired({
    id: sale.id,
    expired: sale.expired,
  })
  const isSm = useMediaQuery('(max-width: 640px)')

  function handleShare() {
    const salePath = `/promocao/${sale.slug}/${sale.id}`

    if (navigator.share) {
      navigator.share({
        title: sale.title,
        text: sale.caption,
        url: salePath,
      })
      return
    }
    navigator.clipboard.writeText(salePath)
    toast.success('Link copiado para a área de transferência.')
  }

  return (
    <Sheet
      open={openDialogs[`saleUpdateForm.${sale.id}`]}
      onOpenChange={(open) => {
        if (!open) setOpenDialog(`saleUpdateForm.${sale.id}`, open)
      }}
    >
      <AlertDialog>
        <ContextMenu>
          <ContextMenuTrigger disabled={isSm} asChild>
            <Card
              className={cn(
                'relative flex select-none flex-col overflow-hidden transition-colors hover:bg-muted/50 sm:select-auto',
                className,
                {
                  'text-muted-foreground opacity-60': sale.expired,
                },
              )}
              {...props}
            >
              {sale.expired && (
                <div className="h-fit bg-muted py-1 text-center text-xs text-muted-foreground">
                  <strong>EXPIRADO</strong>
                </div>
              )}
              {sale.sponsored && (
                <div className="h-fit bg-muted py-1 text-center text-xs text-muted-foreground">
                  <strong>PATROCINADO</strong>
                </div>
              )}
              {sale.highlight && (
                <div className="h-fit bg-auxiliary/20 py-1 text-center text-xs text-muted-foreground">
                  <strong className="text-auxiliary">DESTAQUE</strong>
                </div>
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
                  <Link href={`/promocao/${sale.slug}/${sale.id}`}>
                    {sale.title}
                  </Link>
                </CardTitle>

                <div className="grid grid-cols-3 gap-x-3 sm:block sm:gap-x-0 sm:space-y-2">
                  <Link
                    href={`/promocao/${sale.slug}/${sale.id}`}
                    className="flex h-full items-center"
                  >
                    <div className="relative mx-auto aspect-square w-full select-none sm:w-8/12">
                      <Image
                        src={sale.imageUrl}
                        alt={sale.title}
                        className={cn('rounded-lg object-contain', {
                          grayscale: sale.expired,
                        })}
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
                    <div
                      className={cn('flex w-fit flex-col pt-1 sm:w-full', {
                        'rounded-xl border border-primary': sale.cashback,
                      })}
                    >
                      <p className={sale.cashback ? 'px-2' : ''}>
                        <strong className="text-xl sm:text-2xl">
                          {priceFormatter.format(
                            priceCalculator(
                              sale.price,
                              undefined,
                              sale.cashback?.value,
                            ) / 100,
                          )}
                        </strong>{' '}
                        <span className="text-xs text-muted-foreground sm:text-sm">
                          à vista{' '}
                        </span>
                      </p>

                      {!!sale.installments && !!sale.totalInstallmentPrice && (
                        <span className="px-2 text-muted-foreground max-sm:text-xs">
                          ou{' '}
                          <strong className="max-sm:text-sm">
                            {priceFormatter.format(
                              priceCalculator(
                                sale.totalInstallmentPrice,
                                undefined,
                                sale.cashback?.value,
                              ) / 100,
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
                                priceCalculator(
                                  sale.totalInstallmentPrice,
                                  undefined,
                                  sale.cashback?.value,
                                ) /
                                  (100 * sale.installments),
                              )}
                            </strong>
                          </p>
                        </span>
                      )}
                      {sale.cashback && (
                        <div className="mt-1 flex w-fit items-center rounded-bl-lg rounded-tr bg-primary px-2 text-xs font-semibold text-primary-foreground">
                          <span className="max-sm:text-[10px]">
                            COM {sale.cashback.value}% DE CASHBACK
                          </span>
                        </div>
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
                              {sale.cashback.value}% com{' '}
                              {sale.cashback.provider}
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
                          id="access_sale_from_card"
                          href={sale.url}
                          target="_blank"
                          className={cn(
                            buttonVariants(),
                            'hidden h-fit w-full rounded-xl font-semibold sm:inline-flex',
                          )}
                        >
                          <span className="mr-2">ACESSAR</span>
                          {/* <Icons.ExternalLink
                            className="h-4 w-4"
                            strokeWidth={3}
                          /> */}
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
                      setOpenLoginPopup={setOpenLoginPopup}
                    />
                  </div>
                  <div className="flex items-center">
                    {sale.commentsCount > 0 && (
                      <Link
                        href={`/promocao/${sale.slug}/${sale.id}#comments`}
                        className={cn(
                          buttonVariants({ variant: 'ghost', size: 'sm' }),
                          'w-10 shrink-0 px-0',
                        )}
                      >
                        <span className="mr-1 text-sm">
                          {sale.commentsCount}
                        </span>
                        <Icons.MessageCircle className="h-4 w-4" />
                      </Link>
                    )}
                    <Button
                      variant={'ghost'}
                      size={'sm'}
                      className="w-10 shrink-0 px-0"
                      onClick={() => handleShare()}
                    >
                      <Icons.Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Link
                  href={`/promocao/${sale.slug}/${sale.id}`}
                  className={cn(
                    buttonVariants({ variant: 'default' }),
                    'h-fit w-full rounded-xl py-1.5 font-semibold sm:hidden',
                  )}
                >
                  VISUALIZAR
                  <Icons.ChevronRight
                    className="ml-1 h-4 w-4"
                    strokeWidth={3}
                  />
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
                setOpenLoginPopup={setOpenLoginPopup}
              />
            </ContextMenuSub>

            <ContextMenuItem asChild>
              <Link href={`/promocao/${sale.slug}/${sale.id}#comments`}>
                <Icons.MessageCircle className="mr-2 h-4 w-4" />
                <span>Comentar</span>
              </Link>
            </ContextMenuItem>

            <ContextMenuItem asChild>
              <Link href={`/promocao/${sale.slug}/${sale.id}`}>
                <Icons.GanttChartSquare className="mr-2 h-4 w-4" />
                <span>Ver promoção</span>
              </Link>
            </ContextMenuItem>

            {sale.productSlug && (
              <>
                <ContextMenuSeparator />
                <ContextMenuItem asChild>
                  <Link href={`/${sale.category.slug}/${sale.productSlug}`}>
                    <Icons.Eye className="mr-2 h-4 w-4" />
                    <span>Visualizar produto</span>
                  </Link>
                </ContextMenuItem>

                <ContextMenuItem asChild>
                  <Link
                    href={`/${sale.category.slug}/${sale.productSlug}#historico`}
                  >
                    <Icons.LineChart className="mr-2 h-4 w-4" />
                    <span>Histórico de preços</span>
                  </Link>
                </ContextMenuItem>

                <ContextMenuItem asChild>
                  <Link
                    href={`/${sale.category.slug}/${sale.productSlug}#precos`}
                  >
                    <Icons.DollarSign className="mr-2 h-4 w-4" />
                    <span>Opções de compra</span>
                  </Link>
                </ContextMenuItem>
              </>
            )}

            {user?.role === 'ADMIN' && (
              <>
                <ContextMenuSeparator />
                <ContextMenuItem className="p-0">
                  <HighlightSaleToggle
                    sale={{ highlight: sale.highlight, id: sale.id }}
                    user={user}
                  />
                </ContextMenuItem>

                <ContextMenuItem
                  onClick={() =>
                    setOpenDialog(`saleUpdateForm.${sale.id}`, true)
                  }
                >
                  <Icons.Edit className="mr-2 h-4 w-4" />
                  Editar
                </ContextMenuItem>

                <ContextMenuItem
                  asChild
                  // onClick={() =>
                  //   deleteSale({
                  //     variables: {
                  //       saleId: sale.id,
                  //     },
                  //   })
                  // }
                >
                  <AlertDialogTrigger className="w-full">
                    <Icons.Trash className="mr-2 h-4 w-4 " />
                    Excluir
                  </AlertDialogTrigger>
                </ContextMenuItem>
                <ContextMenuSeparator />

                <ContextMenuItem onClick={() => toggleSaleExpired()}>
                  {sale.expired ? (
                    <>
                      <Icons.Check className="mr-2 h-4 w-4" />
                      Disponível
                    </>
                  ) : (
                    <>
                      <Icons.Clock8 className="mr-2 h-4 w-4" />
                      Expirado
                    </>
                  )}
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
          setOpenSaleDialog={setOpenDialog}
          setOpenLoginPopup={setOpenLoginPopup}
        />
        <SheetContent
          className="w-full space-y-4 overflow-auto sm:max-w-xl"
          side="left"
        >
          <SheetHeader>
            <SheetTitle>EDITAR PROMOÇÃO</SheetTitle>
          </SheetHeader>
          <SaleForm
            mode="update"
            productSlug={sale.productSlug ?? null}
            sale={removeNullValues(sale)}
          />
        </SheetContent>

        <DeleteSaleDialog saleId={sale.id} />

        <LoginPopup open={openLoginPopup} setOpen={setOpenLoginPopup} />
      </AlertDialog>
    </Sheet>
  )
}

function DeleteSaleDialog({ saleId }: { saleId: string }) {
  const [deleteSale] = useMutation(DELETE_SALE, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      toast.success('Promoção deletada com sucesso.')
    },
  })

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
        <AlertDialogDescription>
          Essa ação não pode ser desfeita.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction
          onClick={() =>
            deleteSale({
              variables: { saleId },
            })
          }
        >
          Continuar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  )
}
