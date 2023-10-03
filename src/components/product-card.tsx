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
    }[]
  }
}

export function ProductCard({
  product,
  className,
  ...props
}: ProductCardProps) {
  const bestDeal = product.deals[0]

  return (
    <Link
      href={`/${product.category.slug}/${product.slug}`}
      aria-label={`Visualizar detalhes de ${product.name}`}
      className="flex"
    >
      <Card
        className={cn(
          'flex flex-1 flex-col overflow-hidden transition-colors hover:bg-muted/50',
          className,
        )}
        {...props}
      >
        <CardHeader className="relative flex flex-col justify-center p-3 pb-1.5 sm:hidden">
          {product.reviewUrl && (
            <span className="text-center">
              <Badge className="w-fit px-1 py-[1px]">
                <Icons.StarFilled className="mr-1 h-3 w-3" />
                TESTADO NO CANAL
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
              <Badge className="hidden w-fit sm:inline-flex">
                <Icons.StarFilled className="mr-1" />
                TESTADO PELO CANAL
              </Badge>
            )}

            {bestDeal.availability ? (
              <>
                <div className="flex flex-col">
                  <CardDescription className="hidden text-sm sm:block">
                    Menor preço via <strong>{bestDeal.retailer.name}</strong>
                  </CardDescription>
                  <p>
                    <strong className="text-xl">
                      {priceFormatter.format(
                        priceCalculator(
                          bestDeal.price,
                          bestDeal.coupon?.discount,
                          bestDeal.cashback?.value,
                        ) / 100,
                      )}
                    </strong>{' '}
                    <span className="text-xs text-muted-foreground sm:text-sm">
                      à vista{' '}
                    </span>
                  </p>

                  {!!bestDeal.installments &&
                    !!bestDeal.totalInstallmentPrice && (
                      <span className="text-xs text-muted-foreground sm:text-sm">
                        até{' '}
                        <strong className="text-sm">
                          {bestDeal.installments}x
                        </strong>{' '}
                        de{' '}
                        <strong className="text-sm">
                          {priceFormatter.format(
                            bestDeal.totalInstallmentPrice /
                              (100 * bestDeal.installments),
                          )}
                        </strong>{' '}
                        <p className="hidden sm:inline-flex">
                          {bestDeal.price >= bestDeal.totalInstallmentPrice ? (
                            <span>sem juros</span>
                          ) : (
                            <span>com juros</span>
                          )}
                        </p>
                      </span>
                    )}
                </div>
                {bestDeal.coupon?.availability && (
                  <p className="flex flex-col text-sm">
                    <span className="text-xs text-muted-foreground sm:text-sm">
                      Com cupom
                    </span>
                    <strong>{bestDeal.coupon.code}</strong>
                  </p>
                )}
              </>
            ) : (
              <strong className="text-lg text-destructive">Indisponível</strong>
            )}

            {bestDeal.cashback && (
              <>
                <strong className="hidden text-sm sm:inline-flex">
                  {bestDeal.cashback.value}% de cashback com{' '}
                  {bestDeal.cashback.provider}
                </strong>
                <p className="flex flex-col text-sm sm:hidden">
                  <span className="text-xs text-muted-foreground">
                    Com cashback
                  </span>
                  <strong>
                    {bestDeal.cashback.value}% com {bestDeal.cashback.provider}
                  </strong>
                </p>
              </>
            )}
          </main>
        </CardContent>

        <CardFooter
          className={cn(
            buttonVariants({ variant: 'secondary' }),
            'rounded-t-none sm:hidden',
          )}
        >
          Ver produto
          <Icons.ChevronRight className="ml-1 h-4 w-4" strokeWidth={3} />
        </CardFooter>
      </Card>
    </Link>
  )
}
