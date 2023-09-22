import Image from 'next/image'
import Link from 'next/link'

import { Icons } from '@/components/icons'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
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
          'relative flex flex-1 flex-col overflow-hidden transition-colors hover:bg-muted/50',
          className,
        )}
        {...props}
      >
        <CardHeader className="p-4">
          <AspectRatio>
            <Image
              src={product.imageUrl}
              alt={product.name}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              fill
              className="object-contain"
            />
          </AspectRatio>
        </CardHeader>

        <CardContent className="flex-1 space-y-2.5 p-4 pt-0">
          <CardTitle>{product.name}</CardTitle>

          {product.reviewUrl && (
            <Badge>
              <Icons.StarFilled className="mr-1" />
              TESTADO PELO CANAL
            </Badge>
          )}

          <div className="flex flex-col">
            <CardDescription>
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
              </strong>
            </p>

            {!!bestDeal.installments && !!bestDeal.totalInstallmentPrice && (
              <span className="text-sm text-muted-foreground">
                até <strong>{bestDeal.installments}x</strong> de{' '}
                <strong>
                  {priceFormatter.format(
                    bestDeal.totalInstallmentPrice /
                      (100 * bestDeal.installments),
                  )}
                </strong>{' '}
                {bestDeal.price >= bestDeal.totalInstallmentPrice ? (
                  <span>sem juros</span>
                ) : (
                  <span>com juros</span>
                )}
              </span>
            )}
          </div>
          {bestDeal.coupon && (
            <p className="flex flex-col">
              <span className="text-sm text-muted-foreground">Com cupom</span>
              <strong>{bestDeal.coupon.code}</strong>
            </p>
          )}

          {bestDeal.cashback && (
            <p className="text-sm font-bold">
              {bestDeal.cashback.value}% de cashback com{' '}
              {bestDeal.cashback.provider}
            </p>
          )}
        </CardContent>

        {/* <CardFooter className="p-0">
        <a
          href="#"
          target="_blank"
          rel="noreferrer"
          className={cn(
            buttonVariants({ variant: 'secondary' }),
            'w-full rounded-none',
          )}
        >
          Acessar
        </a>
      </CardFooter> */}
      </Card>
    </Link>
  )
}
