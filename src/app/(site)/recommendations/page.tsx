import { gql } from '@apollo/client'
import Image from 'next/image'
import Link from 'next/link'

import { Icons } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'
import { cn } from '@/lib/utils'
import { type Category, type Product } from '@/types'
import { priceFormatter } from '@/utils/formatter'

const GET_RECOMMENDATION_CATEGORIES = gql`
  query GetRecommendationCategories {
    recommendationCategories {
      id
      name
      slug
    }
  }
`

const GET_RECOMMENDED_PRODUCTS = gql`
  query GetRecommendationsByCategory($categoryId: String!) {
    recommendationsByCategory(categoryId: $categoryId) {
      id
      product {
        name
      }
      minPrice
      maxPrice
      category {
        name
      }
    }
  }
`

const GET_RECOMMENDATIONS = gql`
  query GetRecommendations($includeRecommended: Boolean) {
    recommendationCategories(includeRecommended: $includeRecommended) {
      id
      name
      priceRangeProduct {
        id
        minPrice
        maxPrice
        product {
          id
          name
          slug
          imageUrl
          category {
            slug
          }
        }
      }
    }
  }
`

interface RecommendationsPageProps {
  searchParams: {
    category?: string
  }
}

export default async function RecommendationsPage({
  searchParams,
}: RecommendationsPageProps) {
  const { data } = await getClient().query<{
    recommendationCategories: {
      id: string
      name: string
      slug: string
    }[]
  }>({
    query: GET_RECOMMENDATION_CATEGORIES,
  })

  const targetCategory = searchParams.category ?? ''

  const { data: recommendations } = await getClient().query<{
    recommendationCategories: {
      id: string
      name: string
      priceRangeProduct: {
        id: string
        product: Product & { category: Category }
        minPrice: number
        maxPrice: number
      }[]
    }[]
  }>({
    query: GET_RECOMMENDATIONS,
    variables: {
      includeRecommended: true,
    },
  })

  return (
    <div className="my-10 px-4 sm:container">
      <main className="space-y-4">
        <div className="space-y-0.5">
          <h3 className="text-lg font-medium">Recomendações</h3>
          <p className="text-sm text-muted-foreground">
            Melhores produtos para cada faixa de preço
          </p>
        </div>
        <Separator />
        {/* <RecommendedMain recommendationCategories={recommendationCategories} /> */}
        {/* <RecommendedProductsChart chartData={formattedRecommendedProducts} /> */}
        {recommendations.recommendationCategories.map((recommendation) => (
          <div
            key={recommendation.id}
            className="flex w-full flex-col justify-center gap-4"
          >
            <h1 className="text-lg font-medium">{recommendation.name}</h1>
            <Carousel
              className="w-full"
              opts={{
                align: 'center',
                dragFree: true,
              }}
            >
              <CarouselContent className="-ml-1">
                {recommendation.priceRangeProduct.map(
                  (recommendedPriceProduct) => (
                    <CarouselItem
                      key={recommendedPriceProduct.id}
                      className="pl-1 sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                    >
                      <Card className="flex h-full flex-col transition-all hover:bg-muted/50">
                        <CardHeader className="text-sm font-semibold">
                          {/* <div className="flex items-center justify-center gap-2">
                            <span>
                              {priceFormatter.format(
                                recommendedPriceProduct.minPrice / 100,
                              )}
                            </span>
                            <div className="h-1.5 flex-1 items-center rounded-full bg-gradient-to-r from-success via-auxiliary to-destructive" />
                            <span>
                              {priceFormatter.format(
                                recommendedPriceProduct.maxPrice / 100,
                              )}
                            </span>
                          </div> */}
                          <div className="flex w-full items-center justify-center">
                            <Badge variant={'auxiliary'} className="text-sm">
                              Até{' '}
                              {priceFormatter.format(
                                recommendedPriceProduct.maxPrice / 100,
                              )}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="flex aspect-square flex-1 select-none flex-col items-center justify-center gap-y-6">
                          <div className="relative aspect-square w-[50%] max-w-xs">
                            <Image
                              src={recommendedPriceProduct.product.imageUrl}
                              alt={recommendedPriceProduct.product.name}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              fill
                              className="object-contain"
                            />
                          </div>
                          <span className="text-sm font-semibold">
                            {recommendedPriceProduct.product.name}
                          </span>
                        </CardContent>
                        <CardFooter>
                          <Link
                            href={`/${recommendedPriceProduct.product.category.slug}/${recommendedPriceProduct.product.slug}`}
                            className={cn(
                              buttonVariants(),
                              'w-full rounded-lg',
                            )}
                          >
                            <span className="mr-2">Visualizar</span>
                            <Icons.MoveRight
                              className="h-4 w-4"
                              strokeWidth={3}
                            />
                          </Link>
                        </CardFooter>
                      </Card>
                    </CarouselItem>
                  ),
                )}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          </div>
        ))}
      </main>
    </div>
  )
}
