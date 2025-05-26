import Image from 'next/image'
import Link from 'next/link'

import { Icons } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { priceFormatter } from '@/utils/formatter'
import { priceCalculator } from '@/utils/price-calculator'
import { buttonVariants } from './ui/button'
import { type Discount } from '@/types'
interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  product: {
    name: string
    imageUrl: string
    slug: string
    reviewUrl?: string
    category: {
      slug: string
    }
    deals: {
      price: number
      availability: boolean
      installments?: number
      totalInstallmentPrice?: number
      saleId?: string
      retailer: {
        name: string
      }
      coupon: {
        discount: string
        code: string
        availability: boolean
      }
      cashback: {
        value: number
        provider: string
      }
      discounts: Discount[]
    }[]
  }
  onlyInstallments?: boolean
}

export function ProductCard({
  product,
  className,
  onlyInstallments = false,
  ...props
}: ProductCardProps) {
  const bestDeal = product.deals[0]

  let price = priceCalculator(
    bestDeal?.price,
    bestDeal?.coupon?.availability ? bestDeal.coupon.discount : undefined,
    bestDeal?.cashback?.value,
    bestDeal?.discounts.map((discount) => discount.discount),
  )

  if (onlyInstallments && bestDeal?.installments) {
    price = priceCalculator(
      bestDeal?.totalInstallmentPrice,
      bestDeal?.coupon?.availability ? bestDeal.coupon.discount : undefined,
      bestDeal?.cashback?.value,
      bestDeal?.discounts.map((discount) => discount.discount),
    )
  }

  return (
    <Link
      href={`/${product.category.slug}/${product.slug}`}
      aria-label={`View details of ${product.name}`}
      className="flex"
    >
      <Card
        className={cn(
          'flex flex-1 flex-col overflow-hidden transition-colors hover:bg-muted/50',
          className,
        )}
        {...props}
      >
        {bestDeal?.saleId && (
          <div className="h-fit bg-auxiliary/20 py-1 text-center text-xs text-muted-foreground">
            <strong className="text-auxiliary">ON SALE</strong>
          </div>
        )}
        <CardHeader className="relative flex flex-col justify-center p-3 pb-1.5 sm:hidden">
          {product.reviewUrl && (
            <span className="text-center">
              <Badge className="w-fit px-1 py-[1px]">
                <Icons.StarFilled className="mr-1 h-3 w-3" />
                TESTED ON CHANNEL
              </Badge>
            </span>
          )}
          <CardTitle className="text-sm">
            <span className="line-clamp-2">{product.name}</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-1 items-center gap-3 p-3 pt-0 sm:flex-col sm:items-start sm:p-6">
          <div className="relative aspect-square w-24 sm:w-full">
            <Image
              src={product.imageUrl}
              alt={product.name}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              fill
              className="object-contain"
            />
          </div>
          <main className="flex h-full flex-col justify-center gap-y-1.5 sm:h-fit sm:gap-y-2.5">
            <CardTitle className="hidden sm:block">
              <span className="line-clamp-3 text-sm leading-none">
                {product.name}
              </span>
            </CardTitle>

            {product.reviewUrl && (
              <Badge className="hidden w-fit px-1 py-[1px] sm:inline-flex">
                <Icons.StarFilled className="mr-1" />
                TESTED ON CHANNEL
              </Badge>
            )}
            {bestDeal ? (
              <>
                {bestDeal.availability ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <CardDescription className="hidden text-sm leading-none sm:block">
                        Lowest price via{' '}
                        <strong>{bestDeal.retailer.name}</strong>
                      </CardDescription>
                      <p>
                        <strong className="text-xl">
                          {priceFormatter.format(price / 100)}
                        </strong>{' '}
                        <span className="text-xs text-muted-foreground sm:text-sm">
                          {onlyInstallments ? 'in installments' : 'in cash'}{' '}
                        </span>
                      </p>

                      {!!bestDeal.installments &&
                        !!bestDeal.totalInstallmentPrice && (
                          <span className="text-xs text-muted-foreground sm:text-sm">
                            {onlyInstallments ? 'to' : 'or'}{' '}
                            <strong className="text-sm">
                              {bestDeal.installments}x
                            </strong>{' '}
                            of{' '}
                            <strong className="text-sm">
                              {priceFormatter.format(
                                priceCalculator(
                                  bestDeal.totalInstallmentPrice,
                                  bestDeal.coupon?.availability
                                    ? bestDeal.coupon.discount
                                    : undefined,
                                  bestDeal.cashback?.value,
                                  bestDeal.discounts.map(
                                    (discount) => discount.discount,
                                  ),
                                ) /
                                  (100 * bestDeal.installments),
                              )}
                            </strong>
                          </span>
                        )}
                    </div>
                    {bestDeal.coupon?.availability && (
                      <p className="flex flex-col text-sm">
                        <span className="text-xs text-muted-foreground sm:text-sm">
                          With coupon
                        </span>
                        <strong>{bestDeal.coupon.code}</strong>
                      </p>
                    )}
                    {bestDeal.cashback && (
                      <>
                        <strong className="hidden text-sm sm:inline-flex">
                          {bestDeal.cashback.value}% of cashback with{' '}
                          {bestDeal.cashback.provider}
                        </strong>
                        <p className="flex flex-col text-sm sm:hidden">
                          <span className="text-xs text-muted-foreground">
                            With cashback
                          </span>
                          <strong>
                            {bestDeal.cashback.value}% with{' '}
                            {bestDeal.cashback.provider}
                          </strong>
                        </p>
                      </>
                    )}
                  </>
                ) : (
                  <strong className="text-lg text-destructive">
                    Unavailable
                  </strong>
                )}
              </>
            ) : (
              <strong className="text-lg text-warning">Not listed</strong>
            )}
          </main>
        </CardContent>

        <CardFooter
          className={cn(
            buttonVariants({ variant: 'secondary' }),
            'rounded-t-none sm:hidden',
          )}
        >
          View product
          <Icons.ChevronRight className="ml-1 h-4 w-4" strokeWidth={3} />
        </CardFooter>
      </Card>
    </Link>
  )
}
