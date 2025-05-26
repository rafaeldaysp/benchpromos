import { getClient } from '@/lib/apollo'
import { gql } from '@apollo/client'
import { type Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getCurrentUserToken } from '@/app/_actions/user'
import { AlertCard } from '@/components/alert-price'
import { CashbackModal } from '@/components/cashback-modal'
import { CouponModal } from '@/components/coupon-modal'
import { Icons } from '@/components/icons'
import { ProductBenchmarks } from '@/components/product-benchmarks'
import { ProductNavbar } from '@/components/product-navbar'
import PriceChart from '@/components/product-price-chart'
import { ProductSuggestions } from '@/components/product-suggestions'
import { ToggleFavoriteCard } from '@/components/toggle-favorite-card'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'
import type {
  Cashback,
  Coupon,
  Deal,
  Discount,
  Product,
  Retailer,
} from '@/types'
import { couponFormatter, priceFormatter } from '@/utils/formatter'
import { priceCalculator } from '@/utils/price-calculator'
import { PriceComponent } from '@/components/price-component'
import { ProductFiles } from '@/components/files/product-files'

const GET_PRODUCT = gql`
  query GetProduct(
    $productInput: GetProductInput!
    $productWithDealsSortedByInstallmentPrice: GetProductInput!
  ) {
    product(getProductInput: $productInput) {
      id
      name
      slug
      imageUrl
      reviewUrl
      specs {
        title
        value
      }
      pros {
        value
      }
      cons {
        value
      }
      description
      deals {
        id
        installments
        totalInstallmentPrice
        price
        url
        availability
        retailer {
          name
        }
        coupon {
          availability
          discount
          code
          description
        }
        discounts {
          id
          discount
          label
          description
          retailerId
        }
        cashback {
          value
          provider
          video
          affiliatedUrl
        }
        saleId
      }
      suggestionSlugs
    }
    productWithInstallmentDeals: product(
      getProductInput: $productWithDealsSortedByInstallmentPrice
    ) {
      deals {
        id
        installments
        totalInstallmentPrice
        price
        url
        availability
        retailer {
          name
        }
        coupon {
          availability
          discount
          code
          description
        }
        cashback {
          value
          provider
          video
          affiliatedUrl
        }
        saleId
        discounts {
          id
          discount
          label
          description
        }
      }
    }
  }
`
interface ProductPageProps {
  params: {
    product: string
  }
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { product: slug } = params

  const GET_PRODUCT_METADATA = gql`
    query GetProduct($productInput: GetProductInput!) {
      product(getProductInput: $productInput) {
        name
        slug
        imageUrl
        category {
          name
          slug
        }
        subcategory {
          name
        }
      }
    }
  `
  const { data, errors } = await getClient().query<{
    product: {
      name: string
      slug: string
      imageUrl: string
      category: { name: string; slug: string }
      subcategory: { name: string }
    }
  }>({
    query: GET_PRODUCT_METADATA,
    variables: {
      productInput: {
        identifier: slug,
      },
    },
    errorPolicy: 'all',
  })

  const product = data?.product

  if (errors || !product)
    return {
      title: 'Not Found',
      description: 'This page was not found.',
    }

  const metadata: Metadata = {
    title: product.name,
    description: `${product.category.name} | ${product.name}`,
    alternates: {
      canonical: `/${[product.category.slug]}/${product.slug}`,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      title: product.name,
      description: `${product.category.name} | ${product.name}`,
      url: siteConfig.url + `/${product.category.slug}/${product.slug}`,
      images: [product.imageUrl],
      siteName: siteConfig.name,
    },
  }

  return metadata
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { product: slug } = params

  const token = await getCurrentUserToken()

  const { data, errors } = await getClient().query<{
    product: Product & {
      deals: (Deal & {
        retailer: Retailer
        coupon: Coupon
        cashback: Cashback
        discounts: Discount[]
      })[]
    }
    productWithInstallmentDeals: Product & {
      deals: (Deal & {
        retailer: Retailer
        coupon: Coupon
        cashback: Cashback
        discounts: Discount[]
      })[]
    }
  }>({
    query: GET_PRODUCT,
    variables: {
      productInput: {
        identifier: slug,
      },
      productWithDealsSortedByInstallmentPrice: {
        identifier: slug,
        sortDealsByInstallmentPrice: true,
      },
    },
    errorPolicy: 'all',
  })

  if (errors || !data.product) {
    console.log(errors)
    notFound()
  }

  const product = data.product
  const bestDeal = product.deals[0]
  const bestInstallmentDeal = data.productWithInstallmentDeals.deals?.filter(
    (deal) => deal.totalInstallmentPrice && deal.availability,
  )?.[0]

  return (
    <main className="relative mx-auto space-y-8 px-4 py-10 sm:container">
      <section className="space-y-4 md:gap-x-8 lg:grid lg:grid-cols-3 lg:space-y-0 xl:grid-cols-5">
        <div className="space-y-4 lg:col-span-2 xl:col-span-3">
          <strong className="line-clamp-4 leading-none tracking-tight md:line-clamp-3 md:text-xl">
            {product.name}
          </strong>
          <div className="flex flex-col gap-4 md:flex-row md:gap-0">
            <div className="flex w-full justify-center rounded-lg md:w-1/2">
              <div className="relative aspect-square w-1/2 md:w-80 lg:w-72">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  className="rounded-lg object-contain"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            </div>
            <div className="flex flex-col space-y-2 md:flex-1 md:pr-8 lg:pr-0">
              {bestDeal ? (
                <>
                  {bestDeal.availability ? (
                    <PriceComponent
                      bestDeal={bestDeal}
                      bestInstallmentDeal={bestInstallmentDeal}
                    />
                  ) : (
                    <strong className="text-xl text-destructive">
                      Unavailable
                    </strong>
                  )}
                </>
              ) : (
                <strong className="text-xl text-warning">Not listed</strong>
              )}
            </div>
          </div>
        </div>
        <aside className="flex w-full flex-col gap-y-2 xl:col-span-2">
          <ToggleFavoriteCard
            productId={product.id}
            switchId="favorite"
            token={token}
          />
          <AlertCard
            productId={product.id}
            switchId="alert-top"
            productPrice={bestDeal?.price ?? 0}
            token={token}
          />

          {product.reviewUrl && (
            <Link
              href={'#review'}
              className={cn(
                buttonVariants({ variant: 'secondary' }),
                'flex h-fit justify-between rounded-xl px-6 py-4',
              )}
            >
              <p className="flex flex-1 flex-col">
                <span className="flex items-center gap-x-2 font-semibold">
                  <Icons.StarFilled className="h-4 w-4 text-auxiliary" />
                  Tested by the channel
                </span>
                <span className="text-muted-foreground">
                  Watch the video about this product on our channel
                </span>
              </p>
              <Icons.ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </aside>
      </section>

      <section className="sticky top-[58px] z-30 sm:top-[60px]">
        <ProductNavbar />
        <Separator />
      </section>

      <section id="historico">
        <div className="space-y-1">
          <h2 className="font-semibold tracking-tight md:text-xl">History</h2>
          <p className="text-sm text-muted-foreground">
            See the price evolution of this product over time
          </p>
        </div>
        <Separator className="my-4" />
        <article className="space-y-4 md:gap-x-8 lg:grid lg:grid-cols-3 lg:space-y-0 xl:grid-cols-5">
          <div className="lg:col-span-2 xl:col-span-3">
            <PriceChart
              productSlug={slug}
              currentPrice={
                bestDeal && bestDeal.availability
                  ? priceCalculator(
                      bestDeal.price,
                      bestDeal.coupon?.availability
                        ? bestDeal.coupon.discount
                        : undefined,
                      bestDeal.cashback?.value,
                      bestDeal.discounts.map((discount) => discount.discount),
                    )
                  : null
              }
              currentInstallmentPrice={
                bestDeal?.totalInstallmentPrice
                  ? priceCalculator(
                      bestDeal.totalInstallmentPrice,
                      bestDeal.coupon?.availability
                        ? bestDeal.coupon.discount
                        : undefined,
                      bestDeal.cashback?.value,
                      bestDeal.discounts.map((discount) => discount.discount),
                    )
                  : null
              }
            />
          </div>

          <aside className="flex flex-col gap-y-2 xl:col-span-2">
            <section id="precos" className="h-full">
              <Card className="h-full">
                <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                  <div className="grid flex-1 gap-1 text-center sm:text-left">
                    <CardTitle>Purchase Options</CardTitle>
                    <CardDescription>
                      See the prices of this product in other stores
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea
                    className={cn({
                      'h-[450px]': product.deals.length > 2,
                      hidden: product.deals.length == 0,
                    })}
                  >
                    {product.deals.map((deal) => (
                      <Card
                        key={deal.id}
                        className={cn(
                          'border-transparent shadow-none transition-colors hover:bg-muted/50',
                          {
                            'border-primary':
                              deal.id === bestDeal.id && deal.availability,
                          },
                        )}
                      >
                        <CardHeader className="relative p-4">
                          <span className="h-fit w-20 break-words text-sm font-semibold text-muted-foreground">
                            {deal.retailer.name}
                          </span>
                          {deal.id === bestDeal.id && deal.availability && (
                            <Badge className="absolute left-1/2 top-2.5 w-fit -translate-x-1/2 px-1">
                              {deal.saleId ? 'ON SALE' : 'BEST PRICE'}
                            </Badge>
                          )}
                        </CardHeader>
                        <div>
                          <CardContent className="flex-1 space-y-2 px-4 py-0">
                            <main className="flex items-center gap-x-2 ">
                              <div className="relative mx-auto aspect-square h-20">
                                <Image
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="rounded-lg object-contain"
                                  fill
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                              </div>

                              <div className="flex flex-1 flex-col text-xs">
                                {deal.availability ? (
                                  <>
                                    <p>
                                      <strong className="text-lg">
                                        {priceFormatter.format(
                                          priceCalculator(
                                            deal.price,
                                            deal.coupon?.availability
                                              ? deal.coupon.discount
                                              : undefined,
                                            deal.cashback?.value,
                                            deal.discounts.map(
                                              (discount) => discount.discount,
                                            ),
                                          ) / 100,
                                        )}
                                      </strong>{' '}
                                      <span className="text-muted-foreground">
                                        in cash{' '}
                                      </span>
                                    </p>
                                    {!!deal.installments &&
                                      !!deal.totalInstallmentPrice && (
                                        <span className="text-muted-foreground">
                                          or{' '}
                                          <strong className="text-sm md:text-base">
                                            {priceFormatter.format(
                                              priceCalculator(
                                                deal.totalInstallmentPrice,
                                                deal.coupon?.availability
                                                  ? deal.coupon.discount
                                                  : undefined,
                                                deal.cashback?.value,
                                                deal.discounts.map(
                                                  (discount) =>
                                                    discount.discount,
                                                ),
                                              ) / 100,
                                            )}
                                          </strong>{' '}
                                          in{' '}
                                          <strong className="text-sm md:text-base">
                                            {deal.installments}x
                                          </strong>{' '}
                                          of{' '}
                                          <strong className="text-sm md:text-base">
                                            {priceFormatter.format(
                                              priceCalculator(
                                                deal.totalInstallmentPrice,
                                                deal.coupon?.availability
                                                  ? deal.coupon.discount
                                                  : undefined,
                                                deal.cashback?.value,
                                                deal.discounts.map(
                                                  (discount) =>
                                                    discount.discount,
                                                ),
                                              ) /
                                                (100 * deal.installments),
                                            )}
                                          </strong>
                                        </span>
                                      )}
                                  </>
                                ) : (
                                  <strong className="text-lg text-destructive">
                                    Unavailable
                                  </strong>
                                )}
                              </div>
                            </main>
                            <div
                              className={cn('flex flex-col gap-2', {
                                hidden: !deal.availability,
                              })}
                            >
                              {deal.coupon?.availability && (
                                <CouponModal
                                  coupon={deal.coupon}
                                  description={
                                    <span className="text-muted-foreground">
                                      {couponFormatter(deal.coupon.discount)}{' '}
                                      off on this product
                                    </span>
                                  }
                                />
                              )}
                              {deal.cashback && (
                                <CashbackModal
                                  cashback={deal.cashback}
                                  description={
                                    <span className="text-muted-foreground">
                                      {deal.cashback.value}% back with{' '}
                                      {deal.cashback.provider}
                                    </span>
                                  }
                                />
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className="flex flex-col space-y-1 p-4 pt-2">
                            <>
                              <a
                                className={cn(
                                  buttonVariants(),
                                  'flex h-10 w-full cursor-pointer rounded-xl',
                                )}
                                href={deal.url}
                                target="_blank"
                              >
                                <span className="mr-2 font-semibold">
                                  ACCESS
                                </span>
                              </a>
                            </>
                          </CardFooter>
                        </div>
                      </Card>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </section>
          </aside>
        </article>
      </section>

      <section id="suggestions">
        <ProductSuggestions slug={product.slug} />
      </section>

      <section id="ficha-tecnica">
        <header className="space-y-1">
          <h2 className="font-semibold tracking-tight md:text-xl">
            Technical Sheet
          </h2>
          <p className="text-sm text-muted-foreground">
            Learn about the technical specifications of the product
          </p>
        </header>
        <Separator className="my-4" />
        {product.specs?.length > 0 ? (
          <div className="rounded-xl border shadow">
            <Table className="w-full">
              <TableBody className="rounded-xl text-sm font-medium">
                {product.specs.map((spec, index) => (
                  <TableRow key={index} className="even:bg-muted">
                    <TableCell
                      className={cn('border-r', {
                        'rounded-tl-xl': index === 0,
                        'rounded-bl-xl': index === product.specs.length - 1,
                      })}
                    >
                      {spec.title}
                    </TableCell>
                    <TableCell
                      className={cn({
                        'rounded-tr-xl': index === 0,
                        'rounded-br-xl': index === product.specs.length - 1,
                      })}
                    >
                      {spec.value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <h3 className="text-sm text-muted-foreground">
            We are working to bring all the necessary information soon. Thank
            you for your patience and interest in the product.
          </h3>
        )}
      </section>

      <section id="analise">
        <header className="space-y-1">
          <h2 className="font-semibold tracking-tight md:text-xl">Analysis</h2>
          <p className="text-sm text-muted-foreground">
            See what our team has to say about the product
          </p>
        </header>
        <Separator className="my-4" />
        {product.pros && product.cons && product.description ? (
          <div className="rounded-xl border shadow md:gap-x-8">
            <Card className="border-none shadow-none">
              <CardHeader className="space-y-1 p-4">
                <CardTitle>Pros and Cons</CardTitle>
                <CardDescription>
                  Learn about the positive and negative points of the product
                </CardDescription>
              </CardHeader>

              <CardContent className="grid grid-cols-1 gap-x-8 gap-y-4 p-4 pt-0 text-sm md:grid-cols-2">
                <Card className="border-success transition-colors hover:bg-muted/50">
                  <CardHeader className="flex items-center p-4">
                    <Badge variant={'success'} className="flex w-fit gap-x-1">
                      <Icons.Check className="h-4 w-4 " />
                      Pros
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <ul className="flex flex-col space-y-1 font-medium leading-tight">
                      {product.pros.map((pros, index) => (
                        <li key={index} className="flex gap-x-1">
                          <Icons.Check className="h-4 w-4 text-success" />
                          {pros.value}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card className="border-destructive transition-colors hover:bg-muted/50">
                  <CardHeader className="flex items-center p-4">
                    <Badge
                      variant={'destructive'}
                      className="flex w-fit gap-x-1"
                    >
                      <Icons.X className="h-4 w-4 " />
                      Cons
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <ul className="flex flex-col space-y-1 font-medium leading-tight">
                      {product.cons.map((con, index) => (
                        <li key={index} className="flex items-center gap-x-1">
                          <Icons.X className="h-4 w-4 text-destructive" />
                          {con.value}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
            <Card className="border-none shadow-none">
              <CardHeader className="space-y-1 p-4 pt-0">
                <CardTitle>Comments</CardTitle>
                <CardDescription>
                  Understand our team&apos;s analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Card className="relative h-fit transition-colors hover:bg-muted/50">
                  <Icons.Quote className="absolute left-4 top-0 h-4 w-4 -translate-y-1/2 rotate-180 bg-background text-muted-foreground " />
                  <Icons.Quote className="absolute bottom-0 right-4 h-4 w-4 translate-y-1/2 bg-background text-muted-foreground" />
                  <CardContent className="h-full p-4 text-sm font-medium">
                    {product.description}
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        ) : (
          <h3 className="text-sm text-muted-foreground">
            We are diligently working to bring detailed and accurate analyses
            soon. Thank you for your understanding and interest in our analysis.
          </h3>
        )}
      </section>

      <section id="benchmarks">
        <header className="space-y-1">
          <h2 className="font-semibold tracking-tight md:text-xl">
            Benchmarks
          </h2>
          <p className="text-sm text-muted-foreground">
            Find out how this product performs in our tests
          </p>
        </header>
        <Separator className="my-4" />
        <ProductBenchmarks productSlug={product.slug} />
      </section>

      <section id="files">
        <header className="space-y-1">
          <h2 className="font-semibold tracking-tight md:text-xl">Files</h2>
          <p className="text-sm text-muted-foreground">
            See some relevant files for this product
          </p>
        </header>
        <Separator className="my-4" />
        <ProductFiles productSlug={product.slug} />
      </section>

      <section id="review">
        <header className="space-y-1">
          <h2 className="font-semibold tracking-tight md:text-xl">Review</h2>
          <p className="text-sm text-muted-foreground">
            Watch the video about this product on our channel
          </p>
        </header>
        <Separator className="my-4" />
        {product.reviewUrl ? (
          <div
            style={{
              aspectRatio: product.reviewUrl.includes('instagram')
                ? 9 / 16
                : 16 / 9,
            }}
            className="flex w-full justify-center"
          >
            <iframe
              width="100%"
              height="100%"
              src={product.reviewUrl}
              className={cn('rounded-xl border bg-background shadow', {
                'max-w-xl': product.reviewUrl.includes('instagram'),
              })}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          <h3 className="text-sm text-muted-foreground">
            This product has not yet been reviewed on our channel, but stay
            tuned! As soon as we have reviews, you will be the first to know.
          </h3>
        )}
      </section>
    </main>
  )
}
