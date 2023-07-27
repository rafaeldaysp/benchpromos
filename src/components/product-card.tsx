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

interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  product: {
    name: string
    imageUrl: string
    slug: string
    category: {
      slug: string
    }
  }
}

export function ProductCard({
  product,
  className,
  ...props
}: ProductCardProps) {
  return (
    <Card className={cn('flex flex-col overflow-hidden', className)} {...props}>
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

        <CardDescription>{priceFormatter.format(100000)}</CardDescription>
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
