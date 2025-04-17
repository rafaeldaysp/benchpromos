'use client'

import { gql } from '@apollo/client'
import { useSuspenseQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import dayjs from 'dayjs'
import { type Session } from 'next-auth'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, usePathname } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

import { CashbackModal } from '@/components/cashback-modal'
import { CouponModal } from '@/components/coupon-modal'
import { Icons } from '@/components/icons'
import { LoginPopup } from '@/components/login-popup'
import PriceChart from '@/components/product-price-chart'
import { ProductSuggestions } from '@/components/product-suggestions'
import { Comments } from '@/components/sales/comments'
import { ReactionPopover } from '@/components/sales/reaction-popover'
import { Reactions } from '@/components/sales/reactions'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type {
  Cashback,
  Category,
  Coupon,
  Discount,
  Product,
  Sale,
} from '@/types'
import { couponFormatter, priceFormatter } from '@/utils/formatter'
import { priceCalculator } from '@/utils/price-calculator'

const GET_SALE = gql`
  query Sale($saleId: ID!) {
    sale(id: $saleId) {
      id
      title
      commentsCount
      imageUrl
      price
      installments
      url
      totalInstallmentPrice
      coupon
      expired
      createdAt
      cashback {
        value
        provider
        video
        affiliatedUrl
      }
      discounts {
        id
        discount
        label
        description
      }
      product {
        reviewUrl
      }
      label
      caption
      productSlug
      review
      category {
        slug
      }
      reactions {
        id
        content
        userId
      }
      couponSchema {
        availability
        discount
        code
      }
      couponId
    }
  }
`
interface SaleMainProps {
  saleId: string
  user?: Session['user']
}

export function SaleMain({ saleId, user }: SaleMainProps) {
  const [openLoginPopup, setOpenLoginPopup] = React.useState(false)
  const pathname = usePathname()
  const { data, error, client } = useSuspenseQuery<{
    sale: Sale & {
      commentsCount: number
      cashback?: Omit<Cashback, 'id' | 'url'>
      discounts: Discount[]
      category: Pick<Category, 'slug'>
      reactions: { content: string; userId: string }[]
      product: Product
      couponSchema: Coupon
    }
  }>(GET_SALE, {
    errorPolicy: 'all',
    variables: {
      saleId,
    },
  })

  if (!data || error) {
    return notFound()
  }

  const sale = data.sale

  const salePriceCents = priceCalculator(
    sale.price,
    sale.couponSchema?.discount,
    sale.cashback?.value,
    sale.discounts.map((discount) => discount.discount),
  )

  const salePriceWithouCashbackCents = priceCalculator(
    sale.price,
    sale.couponSchema?.discount,
    undefined,
    sale.discounts.map((discount) => discount.discount),
  )

  const saleInstallmentPriceCents = priceCalculator(
    sale.totalInstallmentPrice,
    sale.couponSchema?.discount,
    sale.cashback?.value,
    sale.discounts.map((discount) => discount.discount),
  )

  const saleInstallmentPriceWithoutCashbackCents = priceCalculator(
    sale.totalInstallmentPrice,
    sale.couponSchema?.discount,
    undefined,
    sale.discounts.map((discount) => discount.discount),
  )

  function handleShare() {
    const text = `Se liga nessa promoção no Bench Promos!\n\n${
      sale.title
    } - ${priceFormatter.format(salePriceCents / 100)}\n\n`

    if (navigator.share) {
      navigator.share({
        title: sale.title,
        text,
        url: pathname,
      })
      return
    }
    navigator.clipboard.writeText(pathname)
    toast.success('Link copiado para a área de transferência.')
  }

  return (
    <div className="space-y-10 px-4 py-10 sm:container lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-2 xl:grid-cols-5">
      <LoginPopup open={openLoginPopup} setOpen={setOpenLoginPopup} />
      <main
        className={cn(
          'flex flex-col gap-2 lg:col-span-2 lg:pt-2 xl:col-span-3',
          {
            'opacity-60 text-muted-foreground': sale.expired,
          },
        )}
      >
        {sale.expired && (
          <Badge variant={'secondary'} className="flex justify-center">
            EXPIRADO
          </Badge>
        )}
        <strong className="line-clamp-4 leading-none tracking-tight md:text-xl">
          {sale.title}
        </strong>
        <div className="space-x-1.5">
          <Badge variant={'secondary'}>Bench Promos</Badge>
          <time className="text-xs text-muted-foreground">
            {dayjs(sale.createdAt).fromNow()}
          </time>
        </div>
        <section className="flex flex-col gap-y-2 md:flex-row">
          <div className="md:w-fit md:px-12">
            <div className="relative mx-auto aspect-square w-1/2 md:w-80 lg:w-72">
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

            {sale.caption && (
              <p className="mt-2 text-sm text-muted-foreground md:hidden">
                {sale.caption}
              </p>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-2 md:pr-8 lg:pr-0">
            <div className="flex flex-col gap-1 text-sm">
              <div>
                <strong className="text-3xl">
                  {priceFormatter.format(salePriceWithouCashbackCents / 100)}
                </strong>{' '}
                <span className="text-muted-foreground">à vista </span>
              </div>

              {!!sale.installments && !!sale.totalInstallmentPrice && (
                <span className="text-muted-foreground">
                  ou{' '}
                  <strong className="text-base">
                    {priceFormatter.format(
                      saleInstallmentPriceWithoutCashbackCents / 100,
                    )}
                  </strong>{' '}
                  em <strong className="text-base">{sale.installments}x</strong>{' '}
                  de{' '}
                  <strong className="text-base">
                    {priceFormatter.format(
                      saleInstallmentPriceWithoutCashbackCents /
                        (100 * sale.installments),
                    )}
                  </strong>
                </span>
              )}

              {sale.discounts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {sale.discounts.map((discount) => (
                    <Badge
                      key={discount.id}
                      variant="success"
                      className="uppercase"
                    >
                      {couponFormatter(discount.discount)} {discount.label}
                    </Badge>
                  ))}
                </div>
              )}

              {sale.cashback && (
                <div className="flex flex-col items-start rounded-xl bg-auxiliary/20 px-4 py-2 text-sm text-muted-foreground">
                  <span className="flex items-center font-semibold">
                    <Icons.AlertCircle className="mr-2 h-4 w-4 text-auxiliary" />
                    Preço final com cashback
                  </span>
                  <span className="ml-1 text-foreground">
                    <p>
                      <strong className="text-xl">
                        {priceFormatter.format(salePriceCents / 100)}
                      </strong>{' '}
                      <span className="text-muted-foreground">à vista </span>
                    </p>

                    {!!sale.installments && !!sale.totalInstallmentPrice && (
                      <span className="text-muted-foreground">
                        ou{' '}
                        <strong className="">
                          {priceFormatter.format(
                            saleInstallmentPriceCents / 100,
                          )}
                        </strong>{' '}
                        em <strong className="">{sale.installments}x</strong> de{' '}
                        <strong className="">
                          {priceFormatter.format(
                            saleInstallmentPriceCents /
                              (100 * sale.installments),
                          )}
                        </strong>
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* let this to not break the new stuff */}
            {sale.coupon && <CouponModal coupon={{ code: sale.coupon }} />}

            {sale.couponId && (
              <CouponModal
                coupon={sale.couponSchema}
                description={
                  <span className="text-muted-foreground">
                    {couponFormatter(sale.couponSchema.discount)} de desconto{' '}
                    <span className="hidden sm:inline-flex">neste produto</span>
                  </span>
                }
              />
            )}

            {sale.cashback && (
              <CashbackModal
                cashback={sale.cashback}
                description={
                  <span className="text-muted-foreground">
                    {sale.cashback.value}% de volta com {sale.cashback.provider}
                  </span>
                }
              />
            )}
            <div className="space-y-2">
              <a
                className={cn(buttonVariants(), 'flex h-10 rounded-xl')}
                href={sale.url}
                target="_blank"
                id="access_sale_from_page"
              >
                <span className="mr-2 font-semibold">ACESSAR</span>
                {/* <Icons.ExternalLink strokeWidth={3} className="h-4 w-4" /> */}
              </a>
            </div>
            {sale.productSlug && (
              <Link
                href={`/${sale.category.slug}/${sale.productSlug}`}
                className={cn(
                  buttonVariants({ variant: 'auxiliary' }),
                  'flex h-10 rounded-xl font-semibold',
                )}
                id="product_view_from_sale_page"
              >
                VISUALIZAR PRODUTO
                <Icons.ChevronRight strokeWidth={3} className="ml-2 h-4 w-4" />
              </Link>
            )}
          </div>
        </section>
        {sale.caption && (
          <p className="hidden text-sm text-muted-foreground md:block">
            {sale.caption}
          </p>
        )}

        {sale.review && (
          <Card className="relative h-fit border-none py-2 shadow-none">
            <Icons.Quote className="absolute left-4 top-2 h-4 w-4 -translate-y-1/2 rotate-180 bg-background text-muted-foreground" />
            <Icons.Quote className="absolute bottom-2 right-4 h-4 w-4 translate-y-1/2 bg-background text-muted-foreground" />
            <CardContent className="h-full whitespace-pre-line rounded-xl border p-4 text-sm font-medium shadow">
              {sale.review}
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-1">
          <Button
            variant={'outline'}
            size={'sm'}
            className="rounded-full"
            onClick={() => handleShare()}
          >
            <Icons.Share2 className="mr-2 h-4 w-4" />
            Compartilhar
          </Button>
          <Reactions
            apolloClient={client}
            reactions={sale.reactions}
            saleId={sale.id}
            userId={user?.id}
            setOpenLoginPopup={setOpenLoginPopup}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button size={'icon'} variant={'ghost'}>
                <Icons.SmilePlus className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-1">
              <ReactionPopover
                apolloClient={client}
                saleId={sale.id}
                userId={user?.id}
                setOpenLoginPopup={setOpenLoginPopup}
              />
            </PopoverContent>
          </Popover>
        </div>

        {sale.productSlug && (
          <div className="space-y-8">
            <div>
              <div className="space-y-1">
                <h2 className="font-semibold tracking-tight md:text-xl">
                  Histórico
                </h2>
                <p className="text-sm text-muted-foreground">
                  Veja a evolução do preço deste produto ao longo do tempo
                </p>
              </div>
              <Separator className="my-4" />
              <PriceChart
                productSlug={sale.productSlug}
                currentPrice={salePriceCents}
                currentInstallmentPrice={saleInstallmentPriceCents ?? null}
              />
            </div>

            <section id="review">
              <header className="space-y-1">
                <h2 className="font-semibold tracking-tight md:text-xl">
                  Review
                </h2>
                <p className="text-sm text-muted-foreground">
                  Assista ao vídeo sobre este produto em nosso canal
                </p>
              </header>
              <Separator className="my-4" />
              {sale.product.reviewUrl ? (
                <div className="aspect-video">
                  <iframe
                    width="100%"
                    height="100%"
                    src={sale.product.reviewUrl}
                    className="rounded-xl border bg-background shadow"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <h3 className="text-sm text-muted-foreground">
                  Este produto ainda não foi avaliado em nosso canal, mas fique
                  atento! Assim que tivermos avaliações, você será o primeiro a
                  saber.
                </h3>
              )}
            </section>
            <Link
              href={`/${sale.category.slug}/${sale.productSlug}`}
              className={cn(
                buttonVariants({ variant: 'secondary' }),
                'flex h-fit justify-between rounded-xl px-6 py-4',
              )}
            >
              <p className="flex flex-1 flex-col">
                <span className="flex items-center gap-x-2 font-semibold">
                  <Icons.StarFilled className="h-4 w-4 text-auxiliary" />
                  Mais informações do produto
                </span>
                <span className="text-muted-foreground">
                  Essa página é apenas uma postagem da promoção. Clique aqui e
                  acesse as informações completas do produto.
                </span>
              </p>
              <Icons.ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </main>
      <aside className="space-y-10 xl:col-span-2" id="comments">
        {sale.productSlug && <ProductSuggestions slug={sale.productSlug} />}
        <Comments saleId={sale.id} user={user} count={sale.commentsCount} />
      </aside>
    </div>
  )
}
