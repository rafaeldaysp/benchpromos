'use client'

import Image from 'next/image'

import { AlertPrice } from '@/components/alert-price'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { type Cashback, type Coupon, type Product } from '@/types'
import { priceFormatter } from '@/utils/formatter'
import { priceCalculator } from '@/utils/price-calculator'

interface UserProductAlertCard {
  subscribedPrice: number
  product: Pick<Product, 'id' | 'imageUrl' | 'slug' | 'name'> & {
    deals: {
      price: number
      availability: boolean
      coupon: Coupon
      cashback: Cashback
    }[]
  }
}

export function ProductAlertCard({
  subscribedPrice,
  product,
}: UserProductAlertCard) {
  const deals = [...product.deals]
  const bestDeal = deals
    .sort(
      (a, b) =>
        priceCalculator(
          a.price,
          a.coupon?.availability ? a.coupon.discount : undefined,
          a.cashback?.value,
        ) -
        priceCalculator(
          b.price,
          b.coupon?.availability ? b.coupon.discount : undefined,
          b.cashback?.value,
        ),
    )
    .sort((a, b) => Number(b.availability) - Number(a.availability))[0]
  return (
    <Dialog>
      <Card className="relative flex select-none flex-col overflow-hidden transition-colors hover:bg-muted/50">
        <CardContent className="p-3 sm:space-y-3">
          <CardTitle className="line-clamp-2 space-x-1 p-2 text-sm font-semibold">
            {product.name}
          </CardTitle>
          <div className="grid grid-cols-2 gap-x-3 text-sm text-muted-foreground">
            <div className="flex h-full items-center">
              <div className="relative mx-auto aspect-square w-full sm:w-8/12">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  className="rounded-lg object-contain"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            </div>

            <div className="col-span-1 flex flex-col justify-center space-y-1">
              <div className="flex flex-col">
                <span>Preço atual</span>
                {bestDeal.availability ? (
                  <strong className="text-lg text-foreground">
                    {priceFormatter.format(
                      priceCalculator(
                        bestDeal.price,
                        bestDeal.coupon?.availability
                          ? bestDeal.coupon.discount
                          : undefined,
                        bestDeal.cashback?.value,
                      ) / 100,
                    )}
                  </strong>
                ) : (
                  <strong className="text-destructive">INDISPONÍVEL</strong>
                )}
              </div>

              <div className="flex flex-col">
                <span>Preço desejado</span>

                <strong className="text-lg text-foreground">
                  {priceFormatter.format(subscribedPrice / 100)}
                </strong>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between p-3 pt-0">
          <DialogTrigger asChild>
            <Button type="button" variant={'ghost'}>
              Editar
            </Button>
          </DialogTrigger>
        </CardFooter>
      </Card>

      <AlertPrice
        productPrice={subscribedPrice}
        userAlertPrice={subscribedPrice}
        productId={product.id}
      />
    </Dialog>
  )
}
