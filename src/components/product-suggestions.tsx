'use client'

import { gql, useSuspenseQuery } from '@apollo/client'
import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import { type Category, type Product } from '@/types'
import { Icons } from './icons'
import { Button, buttonVariants } from './ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from './ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
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
    <Dialog>
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start space-x-2 text-sm">
            <Icons.Bookmark className="h-4 w-4 text-auxiliary" />
            <div className="flex flex-1 flex-col space-y-1">
              <CardTitle>Sugestões e upgrades</CardTitle>
              <CardDescription>
                Nossa equipe separou alguns produtos que podem te interessar com
                essa compra
              </CardDescription>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pb-4">
          <DialogTrigger asChild>
            <Button
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'text-accent-foreground',
              )}
            >
              Ver sugestões
            </Button>
          </DialogTrigger>
        </CardFooter>
      </Card>
      <DialogContent>
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-center">
            SUGESTÕES E UPGRADES
          </DialogTitle>
          <DialogDescription className="rounded-xl bg-accent p-2 text-center text-accent-foreground">
            Nossa equipe separou alguns produtos que podem te interessar com
            essa compra
          </DialogDescription>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  )
}
