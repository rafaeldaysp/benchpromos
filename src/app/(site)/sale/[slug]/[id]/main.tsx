'use client'

import { gql } from '@apollo/client'
import { useSuspenseQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import { type Session } from 'next-auth'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CashbackModal } from '@/components/cashback-modal'
import { CouponModal } from '@/components/coupon-modal'
import { Icons } from '@/components/icons'
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
import type { Cashback, Category, Sale } from '@/types'
import { priceFormatter } from '@/utils/formatter'
import { AlertCard } from '@/components/alert-price'
import PriceChart from '@/components/product-price-chart'

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
      cashback {
        value
        provider
        video
        affiliatedUrl
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
    }
  }
`
interface SaleMainProps {
  saleId: string
  user?: Session['user']
}

export function SaleMain({ saleId, user }: SaleMainProps) {
  const { data, error, client } = useSuspenseQuery<{
    sale: Sale & {
      commentsCount: number
      cashback: Omit<Cashback, 'id' | 'url'>
      category: Pick<Category, 'slug'>
      reactions: { content: string; userId: string }[]
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

  return (
    <div className="space-y-10 px-4 py-10 sm:container lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-2 xl:grid-cols-5">
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
              <p className="text-sm text-muted-foreground md:hidden">
                {sale.caption}
              </p>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-2 md:pr-8 lg:pr-0">
            <div className="flex flex-col gap-1 text-sm">
              <div>
                <strong className="text-3xl">
                  {priceFormatter.format(sale.price / 100)}
                </strong>{' '}
                <span className="text-muted-foreground">à vista </span>
              </div>

              {!!sale.installments && !!sale.totalInstallmentPrice && (
                <span className="text-muted-foreground">
                  ou{' '}
                  <strong className="text-base">
                    {priceFormatter.format(sale.totalInstallmentPrice / 100)}
                  </strong>{' '}
                  em <strong className="text-base">{sale.installments}x</strong>{' '}
                  de{' '}
                  <strong className="text-base">
                    {priceFormatter.format(
                      sale.totalInstallmentPrice / (100 * sale.installments),
                    )}
                  </strong>
                </span>
              )}
            </div>

            {sale.coupon && <CouponModal coupon={{ code: sale.coupon }} />}

            {sale.cashback && <CashbackModal cashback={sale.cashback} />}
            <div className="space-y-2">
              <a
                className={cn(buttonVariants(), 'flex h-10 rounded-xl')}
                href={sale.url}
                target="_blank"
                id="access_sale_from_page"
              >
                <span className="mr-2 font-semibold">ACESSAR</span>
                <Icons.ExternalLink strokeWidth={3} className="h-4 w-4" />
              </a>
              <Separator />
            </div>
            {sale.productSlug && (
              <Link
                href={`/${sale.category.slug}/${sale.productSlug}`}
                className={cn(
                  buttonVariants(),
                  'flex h-10 rounded-xl font-semibold',
                )}
                id="product_view_from_sale_page"
              >
                {/* <Icons.StarFilled
                  strokeWidth={3}
                  className="mr-2 h-4 w-4 text-auxiliary"
                /> */}
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
            <CardContent className="h-full rounded-xl border p-4 text-sm font-medium shadow transition-colors hover:bg-muted/50">
              {sale.review}
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-1">
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
              />
            </PopoverContent>
          </Popover>
          <Reactions
            apolloClient={client}
            reactions={sale.reactions}
            saleId={sale.id}
            userId={user?.id}
          />
        </div>

        {sale.productSlug && (
          <div className="space-y-2">
            <div className="space-y-1">
              <h2 className="font-semibold tracking-tight md:text-xl">
                Histórico
              </h2>
              <p className="text-sm text-muted-foreground">
                Acompanhe o preço deste produto ao longo do tempo
              </p>
            </div>
            <Separator className="my-4" />
            <PriceChart productSlug={sale.productSlug} />
            <Separator className="my-4" />
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
                  Acompanhe o histórico de preços, especificações técnicas,
                  habilite alertas e muito mais
                </span>
              </p>
              <Icons.ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </main>
      <aside className="xl:col-span-2">
        <Comments saleId={sale.id} user={user} count={sale.commentsCount} />
      </aside>
    </div>
  )
}
