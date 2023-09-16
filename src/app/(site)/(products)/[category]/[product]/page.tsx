import { getClient } from '@/lib/apollo'
import { gql } from '@apollo/client'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getCurrentUser } from '@/app/_actions/user'
import { AlertPrice } from '@/components/alert-price'
import { Icons } from '@/components/icons'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from '@/components/ui/card'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
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
      deals {
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
    <div className="mx-auto px-4 py-10 sm:container">
      <main className="w-full space-y-4 md:gap-x-8 lg:grid lg:grid-cols-3 lg:space-y-0">
        <div className="space-y-4 md:col-span-2">
          <strong className="line-clamp-2 leading-none md:text-lg">
            {product.name}
          </strong>
          <div className="flex flex-col md:flex-row lg:gap-8 xl:gap-0">
            <div className="flex w-full justify-center md:w-1/2 md:justify-center">
              <div className="relative aspect-square w-1/2 md:w-3/4 lg:w-full xl:w-3/4">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  className="rounded-lg object-contain"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            </div>
            <div className="flex flex-col justify-start space-y-2 md:flex-1 md:items-center">
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
                        <p className="hidden sm:inline">
                          {' '}
                          de{' '}
                          <strong className="text-base">
                            {priceFormatter.format(
                              bestDeal.totalInstallmentPrice /
                                (100 * bestDeal.installments),
                            )}
                          </strong>
                        </p>
                      </span>
                    )}
                </div>
                {bestDeal.coupon?.availability && (
                  <Button
                    variant={'outline'}
                    className="flex h-fit w-full items-center justify-between gap-2 px-4"
                  >
                    <div className="flex flex-col items-start">
                      <span className="flex items-center font-semibold">
                        <Icons.Tag className="mr-1 h-4 w-4 fill-auxiliary text-auxiliary" />
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
                    variant={'outline'}
                    className="flex h-fit w-full items-center justify-between gap-2 px-4"
                  >
                    <div className="flex flex-col items-start">
                      <span className="flex items-center font-semibold">
                        <Icons.StarFilled className="mr-1 h-4 w-4 text-auxiliary" />
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
                  'flex h-10 w-full cursor-pointer',
                )}
                href={bestDeal.url}
                target="_blank"
              >
                <span className="mr-2">ACESSAR</span>

                <Icons.ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
        <section className="flex w-full flex-col gap-y-2">
          <Dialog>
            <Card>
              <CardContent className="pb-4 pt-6">
                <div className="flex items-start space-x-2">
                  <Icons.BellRing className="h-4 w-4" />
                  <Label
                    htmlFor="alert"
                    className="flex flex-1 flex-col space-y-1"
                  >
                    <CardTitle>Quer pagar mais barato?</CardTitle>
                    <CardDescription>
                      Avisamos quando o preço baixar
                    </CardDescription>
                  </Label>
                  <DialogTrigger asChild>
                    <div>
                      <Switch id="alert" />
                    </div>
                  </DialogTrigger>
                </div>
              </CardContent>
              <CardFooter>
                <DialogTrigger asChild>
                  <Button variant="outline">Editar alerta</Button>
                </DialogTrigger>
              </CardFooter>
            </Card>

            <AlertPrice productId={product.id} />
          </Dialog>

          <Card>
            <CardContent className="pb-4 pt-6">
              <div className="flex items-start space-x-2">
                <Icons.Check className="h-4 w-4" />
                <Label
                  htmlFor="alert"
                  className="flex flex-1 flex-col space-y-1"
                >
                  <CardTitle>O preço está muito bom</CardTitle>
                  <CardDescription>
                    Com base no histórico dos últimos 30 dias, o preço está
                    muito bom
                  </CardDescription>
                </Label>
              </div>
            </CardContent>
            <CardFooter>
              <Link
                href={'#historico'}
                className={cn(buttonVariants({ variant: 'outline' }))}
              >
                Ver histórico
              </Link>
            </CardFooter>
          </Card>
        </section>
      </main>
    </div>
  )
}
