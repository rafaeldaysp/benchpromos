import { getClient } from '@/lib/apollo'
import { gql } from '@apollo/client'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { AlertPrice } from '@/components/alert-price'
import { CopyButton } from '@/components/copy-button'
import { Icons } from '@/components/icons'
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
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  type Cashback,
  type Coupon,
  type Deal,
  type Product,
  type Retailer,
} from '@/types'
import { priceFormatter } from '@/utils/formatter'
import { priceCalculator } from '@/utils/price-calculator'

const GET_PRODUCT = gql`
  query GetProduct($input: GetProductInput!) {
    product(getProductInput: $input) {
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
          discount
          code
        }
        cashback {
          value
          provider
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

export default async function ProductPage({ params }: ProductPageProps) {
  const { product: slug } = params

  const { data, errors } = await getClient().query<{
    product: Product & {
      deals: (Deal & {
        retailer: Retailer
        coupon: Coupon
        cashback: Cashback
      })[]
    }
  }>({
    query: GET_PRODUCT,
    variables: {
      input: {
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
    <div className="mx-auto px-4 py-10 sm:container">
      <div className="grid grid-cols-3">
        <div className="col-span-2 space-y-4">
          <strong className="text-lg">{product.name}</strong>
          <div className="mx-auto flex gap-4">
            <div className="relative aspect-square w-5/12">
              <Image
                src={product.imageUrl}
                alt={product.name}
                className="rounded-lg object-contain"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <div className="flex flex-col justify-center space-y-2">
              <div className="flex flex-col">
                <p className="text-muted-foreground">
                  menor preço via{' '}
                  <span className="text-primary">
                    {' '}
                    {bestDeal.retailer.name}
                  </span>
                </p>
                <strong className="text-3xl">
                  {priceFormatter.format(
                    priceCalculator(
                      bestDeal.price,
                      bestDeal.coupon?.discount,
                      bestDeal.cashback?.value,
                    ) / 100,
                  )}
                </strong>
                {bestDeal.installments && bestDeal.totalInstallmentPrice && (
                  <span className="text-muted-foreground">
                    ou{' '}
                    <strong>
                      {priceFormatter.format(
                        bestDeal.totalInstallmentPrice / 100,
                      )}
                    </strong>{' '}
                    em até <strong>{bestDeal.installments}x</strong> de{' '}
                    <strong>
                      {priceFormatter.format(
                        bestDeal.totalInstallmentPrice /
                          (100 * bestDeal.installments),
                      )}
                    </strong>
                  </span>
                )}
                {bestDeal.coupon && (
                  <div>
                    <span className="text-muted-foreground">Com cupom</span>
                    <div className="flex items-center overflow-hidden rounded-full border bg-amber-200 pl-2 text-black dark:bg-amber-200">
                      <Icons.Tag className="mr-2 h-4 w-4" />
                      <span className="flex-1 overflow-hidden text-sm font-medium uppercase tracking-widest">
                        {bestDeal.coupon.code}
                      </span>
                      <CopyButton
                        value={bestDeal.coupon.code}
                        variant="ghost"
                        className="hover:bg-inherit hover:text-inherit"
                      />
                    </div>
                  </div>
                )}
              </div>
              <a
                className={cn(
                  buttonVariants(),
                  'flex w-full cursor-pointer rounded-full',
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
        <div>
          <Dialog>
            <Card>
              <CardHeader></CardHeader>
              <CardContent>
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
                  <DialogTrigger>
                    <Switch id="alert" />
                  </DialogTrigger>
                </div>
              </CardContent>
              <CardFooter>
                <DialogTrigger asChild>
                  <Button variant="outline">Editar Alerta</Button>
                </DialogTrigger>
              </CardFooter>
            </Card>

            <AlertPrice productId={product.id} />
          </Dialog>
        </div>
      </div>
    </div>
  )
}
