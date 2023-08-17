import Image from 'next/image'
import Link from 'next/link'

import { AspectRatio } from '@/components/ui/aspect-ratio'
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
import { Icons } from './icons'

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
  return (
    <Card
      className={cn(
        'flex flex-col overflow-hidden transition-colors hover:bg-muted/50',
        className,
      )}
      {...props}
    >
      <Link
        aria-label={`Visualizar detalhes de ${product.name}`}
        href={`/${product.category.slug}/${product.slug}`}
      >
        <CardHeader className="p-0">
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

      <CardContent className="grid flex-1 gap-2.5 p-4">
        <Link
          aria-label={`Visualizar detalhes de ${product.name}`}
          href={`/${product.category.slug}/${product.slug}`}
        >
          <CardTitle>{product.name}</CardTitle>
        </Link>

        <CardDescription>
          Menor preço via <strong>{product.deals[0].retailer.name}</strong>
        </CardDescription>

        <div className="flex flex-col">
          <p>
            <strong className="text-xl">
              {priceFormatter.format(product.deals[0].price / 100)}
            </strong>{' '}
            <span className="text-sm text-muted-foreground">à vista</span>
          </p>

          {!!product.deals[0].installments &&
            !!product.deals[0].totalInstallmentPrice && (
              <span className="text-sm text-muted-foreground">
                ou <strong>{product.deals[0].installments}x</strong> de{' '}
                <strong>
                  {priceFormatter.format(
                    product.deals[0].totalInstallmentPrice /
                      (100 * product.deals[0].installments),
                  )}
                </strong>
              </span>
            )}
        </div>

        {!product.reviewUrl && (
          <span className="flex items-center text-sm text-muted-foreground">
            <Icons.Check className="mr-1 h-4 w-4" />
            Testado no canal
          </span>
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
