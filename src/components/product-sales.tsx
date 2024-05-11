'use client'

import { useSuspenseQuery } from '@apollo/client'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import { GET_SALES, type GetSalesQuery } from '@/queries'
import { type Product } from '@/types'
import { priceFormatter } from '@/utils/formatter'
import { priceCalculator } from '@/utils/price-calculator'
import { CashbackModal } from './cashback-modal'
import { CouponModal } from './coupon-modal'
import { Icons } from './icons'
import { Badge } from './ui/badge'
import { buttonVariants } from './ui/button'
import { Card, CardContent, CardFooter, CardHeader } from './ui/card'
import { Dialog } from './ui/dialog'
import { ScrollArea } from './ui/scroll-area'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const SALES_PER_SCROLL = 4

interface ProductSalesProps {
  product: Pick<Product, 'slug' | 'name' | 'imageUrl'>
}

export function ProductSales({ product }: ProductSalesProps) {
  const { data } = useSuspenseQuery<GetSalesQuery>(GET_SALES, {
    refetchWritePolicy: 'overwrite',
    // fetchPolicy: 'cache-and-network',
    variables: {
      paginationInput: {
        limit: SALES_PER_SCROLL,
        page: 1,
      },
      productSlug: product.slug,
    },
  })

  const sales = data.sales.list

  return (
    <Dialog>
      <header className="flex items-center gap-x-2 rounded-t-xl border bg-muted p-4 text-sm font-semibold">
        <div className="relative mx-auto aspect-square h-20">
          <Image
            src={product.imageUrl}
            alt={product.name}
            className="rounded-lg object-contain"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <h1 className="flex-1">{product.name}</h1>
      </header>
      <ScrollArea
        className={cn('rounded-xl rounded-t-none border border-t-0 shadow', {
          'h-[600px]': sales.length > 4,
        })}
      >
        {sales.map((sale, index) => (
          <Card
            key={sale.id}
            className={cn(
              'flex flex-col rounded-none border-0 shadow-none transition-colors hover:bg-muted/50 lg:flex-row',
              {
                'border-b': index < sales.length - 1,
              },
            )}
          >
            <main className="space-y-4 p-4 lg:flex-1">
              <CardHeader className="relative p-0 text-xs text-muted-foreground">
                <time className="text-sm font-semibold text-muted-foreground">
                  {dayjs(sale.createdAt).fromNow()}
                </time>
                {sale.label && (
                  <Badge className="absolute -top-1.5 left-1/2 w-fit -translate-x-1/2">
                    {sale.label}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-1.5 p-0">
                <div className="flex flex-1 flex-col text-xs">
                  <p>
                    <strong className="text-lg">
                      {priceFormatter.format(
                        priceCalculator(
                          sale.price,
                          undefined,
                          sale.cashback?.value,
                        ) / 100,
                      )}
                    </strong>{' '}
                    <span className="text-muted-foreground">à vista </span>
                  </p>
                  {!!sale.installments && !!sale.totalInstallmentPrice && (
                    <span className="text-muted-foreground">
                      ou{' '}
                      <strong className="text-sm md:text-base">
                        {priceFormatter.format(
                          sale.totalInstallmentPrice / 100,
                        )}
                      </strong>{' '}
                      em{' '}
                      <strong className="text-sm md:text-base">
                        {sale.installments}x
                      </strong>{' '}
                      de{' '}
                      <strong className="text-sm md:text-base">
                        {priceFormatter.format(
                          sale.totalInstallmentPrice /
                            (100 * sale.installments),
                        )}
                      </strong>
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2 lg:flex-row lg:gap-4">
                  {sale.coupon && (
                    <section className="text-xs sm:text-sm">
                      <p className="flex flex-col text-muted-foreground lg:hidden">
                        Com cupom
                        <span className="text-sm font-bold text-foreground">
                          {sale.coupon}
                        </span>
                      </p>
                      <CouponModal
                        coupon={{ code: sale.coupon }}
                        className="hidden lg:inline-flex lg:w-56"
                      />
                    </section>
                  )}

                  {sale.cashback && (
                    <section className="text-xs sm:text-sm">
                      <p className="flex flex-col text-muted-foreground lg:hidden">
                        Com cashback
                        <span className="text-sm font-bold text-foreground">
                          {sale.cashback.value}% com {sale.cashback.provider}
                        </span>
                      </p>
                      <CashbackModal
                        cashback={sale.cashback}
                        className="hidden lg:inline-flex lg:w-56"
                      />
                    </section>
                  )}
                </div>
              </CardContent>
            </main>
            <CardFooter className="p-4 pt-0">
              <Link
                href={`/promocao/${sale.slug}/${sale.id}`}
                className={cn(
                  buttonVariants(),
                  'h-10 flex-1 rounded-xl font-semibold',
                )}
              >
                VISUALIZAR
                <Icons.ChevronRight strokeWidth={3} className="ml-1 h-4 w-4" />
              </Link>
            </CardFooter>
          </Card>
        ))}
      </ScrollArea>
    </Dialog>
  )
}
