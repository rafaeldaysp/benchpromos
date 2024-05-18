'use client'

import { gql, useSuspenseQuery } from '@apollo/client'
import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import { type Category, type Product } from '@/types'
import { ScrollArea } from './ui/scroll-area'

const GET_SUGGESTIONS = gql`
  query GetProductSuggestions($slug: ID!, $getProductsInput: GetProductsInput) {
    productSuggestions(slug: $slug, getProductsInput: $getProductsInput) {
      slug
      imageUrl
      name
      category {
        name
        slug
      }
    }
  }
`

export function ProductSuggestions({ slug }: { slug: string }) {
  const { data } = useSuspenseQuery<{
    productSuggestions: (Product & { category: Category })[]
  }>(GET_SUGGESTIONS, {
    variables: {
      slug,
      getProductsInput: {
        hasDeals: true,
      },
    },
  })
  const products = data?.productSuggestions

  if (!products || products.length == 0) return

  return (
    <ScrollArea
      className={cn('rounded-md border', {
        'h-[400px]': products.length > 4,
      })}
    >
      {products.map((product) => (
        <Link
          href={`/${product.category.slug}/${product.slug}`}
          key={product.id}
          className="flex items-start gap-x-6 rounded-md bg-card p-4 transition-colors hover:bg-muted/50 sm:px-8"
        >
          <div className="relative h-16 w-16">
            <Image
              src={product.imageUrl}
              alt={product.name}
              className="object-contain"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm leading-7">{product.name}</p>
            <span className="text-xs text-muted-foreground">
              {product.category.name}
            </span>
          </div>
        </Link>
      ))}
    </ScrollArea>
  )
}
