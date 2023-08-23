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
    <Card
      className={cn(
        'relative flex flex-col overflow-hidden transition-colors hover:bg-muted/50',
        className,
      )}
      {...props}
    >
      {/* {!product.reviewUrl && (
        <div className="absolute left-2 top-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <StarFilledIcon className="  mr-1 h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Testado pelo canal!</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )} */}
      <Link
        aria-label={`Visualizar detalhes de ${product.name}`}
        href={`/${product.category.slug}/${product.slug}`}
      >
        <CardHeader>
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
      </Link>

      <CardContent className="flex-1 space-y-2.5 px-4">
        <CardTitle>
          <Link
            aria-label={`Visualizar detalhes de ${product.name}`}
            href={`/${product.category.slug}/${product.slug}`}
          >
            {product.name}
          </Link>
        </CardTitle>

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
              {priceFormatter.format(bestDeal.price / 100)}
            </strong>{' '}
            {/* <span className="text-sm text-muted-foreground">à vista</span> */}
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
          <strong className="text-sm">
            {bestDeal.cashback.value}% de cashback com{' '}
            <span>{bestDeal.cashback.provider}</span>
          </strong>
        )}
      </CardContent>

      <CardFooter className="p-0">
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
      </CardFooter>
    </Card>
  )
}
