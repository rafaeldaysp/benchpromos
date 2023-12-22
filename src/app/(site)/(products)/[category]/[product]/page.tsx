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
  Benchmark,
  BenchmarkResult,
  Cashback,
  Coupon,
  Deal,
  Product,
  Retailer,
} from '@/types'
import { couponFormatter, priceFormatter } from '@/utils/formatter'
import { priceCalculator } from '@/utils/price-calculator'

const GET_PRODUCT = gql`
  query GetProduct($productInput: GetProductInput!) {
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
        }
        cashback {
          value
          provider
          video
          affiliatedUrl
        }
      }
      benchmarksResults: benchmarks {
        id
        result
        unit
        description
        productAlias
        benchmark {
          name
          slug
        }
      }
      suggestionSlugs
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
        hasDeals: true,
      },
    },
    errorPolicy: 'all',
  })

  const product = data?.product

  if (errors || !product)
    return {
      title: 'Não encontrado',
      description: 'Essa página não foi encontrada.',
    }

  const metadata: Metadata = {
    title: product.name,
    description: `${product.category.name} | ${product.name}`,
    alternates: {
      canonical: `/${[product.category.slug]}/${product.slug}`,
    },
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
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
      })[]

      benchmarksResults: (Omit<BenchmarkResult, 'productId' | 'benchmarkId'> & {
        benchmark: Omit<Benchmark, 'id'>
      })[]
    }
  }>({
    query: GET_PRODUCT,
    variables: {
      productInput: {
        identifier: slug,
        hasDeals: true,
      },
    },
    errorPolicy: 'all',
  })

  if (errors || !data.product) notFound()

  const product = data.product
  const bestDeal = product.deals[0]

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
              {bestDeal.availability ? (
                <div className="flex w-full flex-col gap-y-2 text-sm">
                  <div className="flex flex-col gap-y-1">
                    <p className="text-muted-foreground">
                      menor preço via <strong>{bestDeal.retailer.name}</strong>
                    </p>

                    <p>
                      <strong className="text-3xl">
                        {priceFormatter.format(
                          priceCalculator(
                            bestDeal.price,
                            bestDeal.coupon?.availability
                              ? bestDeal.coupon.discount
                              : undefined,
                            bestDeal.cashback?.value,
                          ) / 100,
                        )}
                      </strong>{' '}
                      <span className="text-muted-foreground">à vista </span>
                    </p>

                    {!!bestDeal.installments &&
                      !!bestDeal.totalInstallmentPrice && (
                        <span className="text-muted-foreground">
                          ou{' '}
                          <strong className="text-base">
                            {priceFormatter.format(
                              priceCalculator(
                                bestDeal.totalInstallmentPrice,
                                bestDeal.coupon?.availability
                                  ? bestDeal.coupon.discount
                                  : undefined,
                                bestDeal.cashback?.value,
                              ) / 100,
                            )}
                          </strong>{' '}
                          em{' '}
                          <strong className="text-base">
                            {bestDeal.installments}x
                          </strong>{' '}
                          de{' '}
                          <strong className="text-base">
                            {priceFormatter.format(
                              priceCalculator(
                                bestDeal.totalInstallmentPrice,
                                bestDeal.coupon?.availability
                                  ? bestDeal.coupon.discount
                                  : undefined,
                                bestDeal.cashback?.value,
                              ) /
                                (100 * bestDeal.installments),
                            )}
                          </strong>
                        </span>
                      )}
                    {bestDeal.cashback && (
                      <div className="flex items-center gap-x-2 rounded-xl border p-2 text-sm text-muted-foreground">
                        <div>
                          <Icons.AlertCircle className="h-4 w-4 text-auxiliary" />
                        </div>
                        <div>
                          Você paga{' '}
                          <span className="font-bold text-foreground">
                            {priceFormatter.format(
                              priceCalculator(
                                bestDeal.price,
                                bestDeal.coupon?.availability
                                  ? bestDeal.coupon.discount
                                  : undefined,
                                undefined,
                              ) / 100,
                            )}{' '}
                          </span>
                          à vista
                          {bestDeal.installments &&
                            bestDeal.totalInstallmentPrice && (
                              <span>
                                {' '}
                                ou{' '}
                                <span className="font-bold text-foreground">
                                  {priceFormatter.format(
                                    priceCalculator(
                                      bestDeal.totalInstallmentPrice,
                                      bestDeal.coupon?.availability
                                        ? bestDeal.coupon.discount
                                        : undefined,
                                      undefined,
                                    ) / 100,
                                  )}
                                </span>{' '}
                                em até{' '}
                                <span className="font-bold text-foreground">
                                  {bestDeal.installments}x
                                </span>{' '}
                                e recebe{' '}
                                <span className="font-bold text-foreground">
                                  {bestDeal.cashback.value}%
                                </span>{' '}
                                de cashback
                              </span>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                  {bestDeal.coupon?.availability && (
                    <CouponModal
                      coupon={bestDeal.coupon}
                      description={
                        <span className="text-muted-foreground">
                          {couponFormatter(bestDeal.coupon.discount)} de
                          desconto{' '}
                          <span className="hidden sm:inline-flex">
                            neste produto
                          </span>
                        </span>
                      }
                    />
                  )}

                  {bestDeal.cashback && (
                    <CashbackModal
                      cashback={bestDeal.cashback}
                      description={
                        <span className="text-muted-foreground">
                          {bestDeal.cashback.value}% de volta com{' '}
                          {bestDeal.cashback.provider}
                        </span>
                      }
                    />
                  )}
                </div>
              ) : (
                <strong className="text-xl text-destructive">
                  Indisponível
                </strong>
              )}
              <a
                className={cn(
                  buttonVariants(),
                  'flex h-10 w-full cursor-pointer rounded-xl',
                )}
                href={bestDeal.url}
                target="_blank"
              >
                <span className="mr-2 font-semibold">ACESSAR</span>
                <Icons.ExternalLink strokeWidth={3} className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
        <aside className="flex w-full flex-col gap-y-2 xl:col-span-2">
          <AlertCard
            productId={product.id}
            switchId="alert-top"
            productPrice={bestDeal.price}
            token={token}
          />

          {/* <Card>
            <CardContent className="py-4">
              <div className="flex items-start space-x-2">
                <Icons.LineChart className="h-4 w-4 text-auxiliary" />
                <Label className="flex flex-1 flex-col space-y-1">
                  <CardTitle>O preço está bom?</CardTitle>
                  <CardDescription>
                    Utilize nosso histórico para analisar o preço do produto
                  </CardDescription>
                </Label>
              </div>
            </CardContent>
            <CardFooter className="scroll-smooth pb-4">
              <Link
                href={'#historico'}
                className={cn(buttonVariants({ variant: 'outline' }))}
              >
                Ver histórico
              </Link>
            </CardFooter>
          </Card> */}
          {product.suggestionSlugs.length > 0 && (
            <ProductSuggestions slug={product.slug} />
          )}
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
                  Testado pelo canal
                </span>
                <span className="text-muted-foreground">
                  Assista ao vídeo sobre este produto em nosso canal
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
          <h2 className="font-semibold tracking-tight md:text-xl">Histórico</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe o preço deste produto ao longo do tempo
          </p>
        </div>
        <Separator className="my-4" />
        <article className="space-y-4 md:gap-x-8 lg:grid lg:grid-cols-3 lg:space-y-0 xl:grid-cols-5">
          <div className="lg:col-span-2 xl:col-span-3">
            <PriceChart
              productSlug={slug}
              currentPrice={
                bestDeal.availability
                  ? priceCalculator(
                      bestDeal.price,
                      bestDeal.coupon?.availability
                        ? bestDeal.coupon.discount
                        : undefined,
                      bestDeal.cashback?.value,
                    )
                  : null
              }
            />
          </div>
          <aside className="flex flex-col gap-y-2 xl:col-span-2">
            <AlertCard
              productId={product.id}
              switchId="alert-middle"
              productPrice={bestDeal.price}
              token={token}
            />
          </aside>
        </article>
      </section>

      <section id="ficha-tecnica">
        <header className="space-y-1">
          <h2 className="font-semibold tracking-tight md:text-xl">
            Ficha técnica
          </h2>
          <p className="text-sm text-muted-foreground">
            Conheça as especificações técnicas do produto
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
            Estamos trabalhando para trazer todas as informações necessárias em
            breve. Agradecemos sua paciência e interesse pelo produto.
          </h3>
        )}
      </section>

      <section id="analise">
        <header className="space-y-1">
          <h2 className="font-semibold tracking-tight md:text-xl">Análise</h2>
          <p className="text-sm text-muted-foreground">
            Veja o que nossa equipe tem a dizer sobre o produto
          </p>
        </header>
        <Separator className="my-4" />
        {product.pros && product.cons && product.description ? (
          <div className="rounded-xl border shadow md:gap-x-8">
            <Card className="border-none shadow-none">
              <CardHeader className="space-y-1 p-4">
                <CardTitle>Prós e contras</CardTitle>
                <CardDescription>
                  Conheça os pontos positivos e negativos do produto
                </CardDescription>
              </CardHeader>

              <CardContent className="grid grid-cols-1 gap-x-8 gap-y-4 p-4 pt-0 text-sm md:grid-cols-2">
                <Card className="border-success transition-colors hover:bg-muted/50">
                  <CardHeader className="flex items-center p-4">
                    <Badge variant={'success'} className="flex w-fit gap-x-1">
                      <Icons.Check className="h-4 w-4 " />
                      Prós
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
                      Contras
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
                <CardTitle>Comentários</CardTitle>
                <CardDescription>
                  Entenda a análise de nossa equipe
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
            Estamos trabalhando diligentemente para trazer análises detalhadas e
            precisas em breve. Agradecemos sua compreensão e interesse em nossa
            análise.
          </h3>
        )}
      </section>

      <section id="precos">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="font-semibold tracking-tight md:text-xl">
              Opções de compra
            </h2>
            <p className="text-sm text-muted-foreground">
              Veja os preços deste produto em outras lojas
            </p>
          </div>
        </div>
        <Separator className="my-4" />

        <ScrollArea
          className={cn('rounded-xl border', {
            'h-[450px]': product.deals.length > 2,
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
                    MELHOR PREÇO
                  </Badge>
                )}
              </CardHeader>
              <div className="lg:flex">
                <CardContent className="flex-1 space-y-2 px-4 py-0 lg:pb-4">
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
                                ) / 100,
                              )}
                            </strong>{' '}
                            <span className="text-muted-foreground">
                              à vista{' '}
                            </span>
                          </p>
                          {!!deal.installments &&
                            !!deal.totalInstallmentPrice && (
                              <span className="text-muted-foreground">
                                ou{' '}
                                <strong className="text-sm md:text-base">
                                  {priceFormatter.format(
                                    priceCalculator(
                                      deal.totalInstallmentPrice,
                                      deal.coupon?.availability
                                        ? deal.coupon.discount
                                        : undefined,
                                      deal.cashback?.value,
                                    ) / 100,
                                  )}
                                </strong>{' '}
                                em{' '}
                                <strong className="text-sm md:text-base">
                                  {deal.installments}x
                                </strong>{' '}
                                de{' '}
                                <strong className="text-sm md:text-base">
                                  {priceFormatter.format(
                                    priceCalculator(
                                      deal.totalInstallmentPrice,
                                      deal.coupon?.availability
                                        ? deal.coupon.discount
                                        : undefined,
                                      deal.cashback?.value,
                                    ) /
                                      (100 * deal.installments),
                                  )}
                                </strong>
                              </span>
                            )}
                        </>
                      ) : (
                        <strong className="text-lg text-destructive">
                          Indisponível
                        </strong>
                      )}
                    </div>
                  </main>
                  <div
                    className={cn('flex flex-col gap-2 lg:flex-row lg:gap-4', {
                      hidden: !deal.availability,
                    })}
                  >
                    {deal.coupon?.availability && (
                      <CouponModal
                        coupon={deal.coupon}
                        className="lg:w-fit"
                        description={
                          <span className="text-muted-foreground">
                            {couponFormatter(deal.coupon.discount)} de desconto
                            neste produto
                          </span>
                        }
                      />
                    )}
                    {deal.cashback && (
                      <CashbackModal
                        cashback={deal.cashback}
                        className="lg:w-fit"
                        description={
                          <span className="text-muted-foreground">
                            {deal.cashback.value}% de volta com{' '}
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
                      <span className="mr-2 font-semibold">ACESSAR</span>
                      <Icons.ExternalLink strokeWidth={3} className="h-4 w-4" />
                    </a>
                  </>
                </CardFooter>
              </div>
            </Card>
          ))}
        </ScrollArea>
      </section>

      {/* <section id="promocoes">
        <header className="space-y-1">
          <h2 className="font-semibold tracking-tight md:text-xl">Promoções</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe as últimas promoções deste produto
          </p>
        </header>
        <Separator className="my-4" />
        <ProductSales product={product} />
      </section> */}
      <section id="benchmarks">
        <header className="space-y-1">
          <h2 className="font-semibold tracking-tight md:text-xl">
            Benchmarks
          </h2>
          <p className="text-sm text-muted-foreground">
            Saiba como este produto performa em nossos testes
          </p>
        </header>
        <Separator className="my-4" />
        {product.benchmarksResults.length > 0 ? (
          <ProductBenchmarks
            benchmarksResults={product.benchmarksResults}
            productSlug={product.slug}
          />
        ) : (
          <h3 className="text-sm text-muted-foreground">
            Esse produto não apresenta resultados em benchmarks.
          </h3>
        )}
      </section>

      <section id="review">
        <header className="space-y-1">
          <h2 className="font-semibold tracking-tight md:text-xl">Review</h2>
          <p className="text-sm text-muted-foreground">
            Assista ao vídeo sobre este produto em nosso canal
          </p>
        </header>
        <Separator className="my-4" />
        {product.reviewUrl ? (
          <div className="aspect-video">
            <iframe
              width="100%"
              height="100%"
              src={product.reviewUrl}
              className="rounded-xl border bg-background shadow"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          <h3 className="text-sm text-muted-foreground">
            Este produto ainda não foi avaliado em nosso canal, mas fique
            atento! Assim que tivermos avaliações, você será o primeiro a saber.
          </h3>
        )}
      </section>
    </main>
  )
}
