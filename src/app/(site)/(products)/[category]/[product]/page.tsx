import { getClient } from '@/lib/apollo'
import { gql } from '@apollo/client'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getCurrentUser } from '@/app/_actions/user'
import { AlertPrice } from '@/components/alert-price'
import { Icons } from '@/components/icons'
import { ProductNavbar } from '@/components/product-navbar'
import PriceChart from '@/components/product-price-chart'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  type Cashback,
  type Coupon,
  type Deal,
  type Product,
  type Retailer,
} from '@/types'
import { couponFormatter, priceFormatter } from '@/utils/formatter'
import { priceCalculator } from '@/utils/price-calculator'

const GET_PRODUCT = gql`
  query GetProduct(
    $productInput: GetProductInput!
    $userAlertInput: UserProductAlertInput!
  ) {
    product(getProductInput: $productInput) {
      id
      name
      imageUrl
      reviewUrl
      deals {
        id
        installments
        totalInstallmentPrice
        price
        url
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
        }
      }
      history {
        date
        lowestPrice
      }
    }
    userProductAlert(userProductAlertInput: $userAlertInput) {
      price
    }
  }
`

interface ProductPageProps {
  params: {
    product: string
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { product: slug } = params

  const user = await getCurrentUser()

  const { data, errors } = await getClient().query<{
    product: Product & {
      deals: (Deal & {
        retailer: Retailer
        coupon: Coupon
        cashback: Cashback
      })[]
      history: {
        date: string
        lowestPrice: number
      }[]
    }
    userProductAlert: {
      price: number
    } | null
  }>({
    query: GET_PRODUCT,
    variables: {
      productInput: {
        identifier: slug,
        hasDeals: true,
      },
      userAlertInput: {
        identifier: slug,
        userId: user?.id,
      },
    },
    errorPolicy: 'all',
  })

  if (errors || !data.product) notFound()

  const product = data.product
  const bestDeal = product.deals[0]
  const userAlert = data.userProductAlert?.price

  return (
    <main className="relative mx-auto space-y-8 px-4 py-10 sm:container">
      <section className="space-y-4 md:gap-x-8 lg:grid lg:grid-cols-3 lg:space-y-0 xl:grid-cols-5">
        <div className="space-y-4 lg:col-span-2 xl:col-span-3">
          <strong className="line-clamp-3 leading-none tracking-tight md:text-xl">
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
                            bestDeal.totalInstallmentPrice / 100,
                          )}
                        </strong>{' '}
                        em{' '}
                        <strong className="text-base">
                          {bestDeal.installments}x
                        </strong>{' '}
                        de{' '}
                        <strong className="text-base">
                          {priceFormatter.format(
                            bestDeal.totalInstallmentPrice /
                              (100 * bestDeal.installments),
                          )}
                        </strong>
                      </span>
                    )}
                </div>
                {bestDeal.coupon?.availability && (
                  <Button
                    variant={'secondary'}
                    className="flex h-fit w-full items-center justify-between gap-2 rounded-xl border-dashed px-4"
                  >
                    <div className="flex flex-col items-start">
                      <span className="flex items-center font-semibold">
                        <Icons.Tag className="mr-2 h-4 w-4 text-auxiliary" />
                        Cupom disponível
                      </span>
                      <span className="text-muted-foreground">
                        {couponFormatter(bestDeal.coupon.discount)} de desconto
                        neste produto
                      </span>
                    </div>
                    <Icons.ChevronRight className="h-4 w-4" />
                  </Button>
                )}

                {bestDeal.cashback && (
                  <Button
                    variant={'secondary'}
                    className="flex h-fit w-full items-center justify-between gap-2 rounded-xl border-dashed px-4"
                  >
                    <div className="flex flex-col items-start">
                      <span className="flex items-center font-semibold">
                        <Icons.RotateCcw className="mr-2 h-4 w-4 text-auxiliary" />
                        Cashback
                      </span>
                      <span className="text-muted-foreground">
                        {bestDeal.cashback.value}% de volta com{' '}
                        {bestDeal.cashback.provider}
                      </span>
                    </div>
                    <Icons.ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
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
          <AlertCard productId={product.id} switchId="alert-top" />

          <Card>
            <CardContent className="py-4">
              <div className="flex items-start space-x-2">
                <Icons.Check className="h-4 w-4 text-auxiliary" />
                <Label className="flex flex-1 flex-col space-y-1">
                  <CardTitle>O preço está muito bom</CardTitle>
                  <CardDescription>
                    Com base no histórico dos últimos 30 dias, o preço está
                    muito bom
                  </CardDescription>
                </Label>
              </div>
            </CardContent>
            <CardFooter className="pb-4">
              <Link
                href={'#historico'}
                className={cn(buttonVariants({ variant: 'outline' }))}
              >
                Ver histórico
              </Link>
            </CardFooter>
          </Card>
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

      <section id="navbar" className="sticky top-[58px] z-30 sm:top-[60px]">
        <ProductNavbar />
        {/* <div className="absolute left-1/2 w-screen -translate-x-1/2"> */}
        <Separator />
        {/* </div> */}
      </section>

      <section id="precos">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="font-semibold tracking-tight md:text-xl">
              Comparação de preços
            </h2>
            <p className="text-sm text-muted-foreground">
              Veja os preços deste produto em outras lojas
            </p>
          </div>
        </div>
        <Separator className="my-4" />

        <ScrollArea
          className={cn('rounded-xl border', {
            'h-[600px]': product.deals.length > 2,
          })}
        >
          {product.deals.map((deal) => (
            <Card
              key={deal.id}
              className={cn(
                'border-transparent shadow-none transition-colors hover:bg-muted/50',
                {
                  'border-primary': deal.id === bestDeal.id,
                },
              )}
            >
              <CardHeader className="relative p-4">
                <span className="text-sm font-semibold text-muted-foreground">
                  {deal.retailer.name}
                </span>
                {deal.id === bestDeal.id && (
                  <Badge className="absolute left-1/2 top-2.5 w-fit -translate-x-1/2">
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
                        <span className="text-muted-foreground">à vista </span>
                      </p>
                      {!!deal.installments && !!deal.totalInstallmentPrice && (
                        <span className="text-muted-foreground">
                          ou{' '}
                          <strong className="text-sm md:text-base">
                            {priceFormatter.format(
                              deal.totalInstallmentPrice / 100,
                            )}
                          </strong>{' '}
                          em{' '}
                          <strong className="text-sm md:text-base">
                            {deal.installments}x
                          </strong>{' '}
                          de{' '}
                          <strong className="text-sm md:text-base">
                            {priceFormatter.format(
                              deal.totalInstallmentPrice /
                                (100 * deal.installments),
                            )}
                          </strong>
                        </span>
                      )}
                    </div>
                  </main>
                  <div className="flex flex-col gap-2 lg:flex-row lg:gap-4">
                    {deal.coupon?.availability && (
                      <Button
                        variant={'secondary'}
                        className="flex h-fit w-full items-center justify-between gap-2 rounded-xl border-dashed px-4 lg:w-fit"
                      >
                        <div className="flex flex-col items-start">
                          <span className="flex items-center font-semibold">
                            <Icons.Tag className="mr-2 h-4 w-4 text-auxiliary" />
                            Cupom disponível
                          </span>
                          <span className="text-muted-foreground">
                            {couponFormatter(deal.coupon.discount)} de desconto
                            neste produto
                          </span>
                        </div>
                        <Icons.ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                    {deal.cashback && (
                      <Button
                        variant={'secondary'}
                        className="flex h-fit w-full items-center justify-between gap-2 rounded-xl border-dashed px-4 lg:w-fit"
                      >
                        <div className="flex flex-col items-start">
                          <span className="flex items-center font-semibold">
                            <Icons.RotateCcw className="mr-2 h-4 w-4 text-auxiliary" />
                            Cashback
                          </span>
                          <span className="text-muted-foreground">
                            {bestDeal.cashback.value}% de volta com{' '}
                            {bestDeal.cashback.provider}
                          </span>
                        </div>
                        <Icons.ChevronRight className="h-4 w-4" />
                      </Button>
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
                      href={bestDeal.url}
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
            <PriceChart data={product.history} />
          </div>
          <aside className="flex flex-col gap-y-2 xl:col-span-2">
            <AlertCard productId={product.id} switchId="alert-middle" />
            <Card>
              <CardContent className="py-4">
                <div className="flex items-start space-x-2">
                  <Icons.Check className="h-4 w-4 text-auxiliary" />
                  <Label className="flex flex-1 flex-col space-y-1">
                    <CardTitle>O preço está muito bom</CardTitle>
                    <CardDescription>
                      Com base no histórico dos últimos 30 dias, o preço está
                      muito bom
                    </CardDescription>
                  </Label>
                </div>
              </CardContent>
            </Card>
          </aside>
        </article>
      </section>

      <section id="ficha-tecnica">
        <header className="space-y-1">
          <h2 className="font-semibold tracking-tight md:text-xl">
            Ficha técnica
          </h2>
          <p className="text-sm text-muted-foreground">
            Analise as especificações técnicas do produto
          </p>
        </header>
        <Separator className="my-4" />
      </section>
    </main>
  )
}

function AlertCard({
  productId,
  switchId,
}: {
  productId: string
  switchId: string
}) {
  return (
    <Dialog>
      <Card id="alert-card">
        <CardContent className="py-4">
          <div className="flex items-start space-x-2">
            <Icons.BellRing className="h-4 w-4 text-auxiliary" />
            <Label
              htmlFor={switchId}
              className="flex flex-1 flex-col space-y-1"
            >
              <CardTitle>Quer pagar mais barato?</CardTitle>
              <CardDescription>Avisamos quando o preço baixar</CardDescription>
            </Label>
            <DialogTrigger asChild>
              <div>
                <Switch id={switchId} />
              </div>
            </DialogTrigger>
          </div>
        </CardContent>
        <CardFooter className="pb-4">
          <DialogTrigger asChild>
            <Button variant="outline">Editar alerta</Button>
          </DialogTrigger>
        </CardFooter>
      </Card>

      <AlertPrice productId={productId} />
    </Dialog>
  )
}
