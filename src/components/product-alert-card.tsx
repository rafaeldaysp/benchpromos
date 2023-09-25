'use client'

import Image from 'next/image'

import { AlertPrice } from '@/components/alert-price'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { priceFormatter } from '@/utils/formatter'

interface UserProductAlertCard {
  subscribedPrice: number
  product: {
    id: string
    imageUrl: string
    slug: string
    name: string
    deals: { price: number }[]
  }
}

export function ProductAlertCard({
  subscribedPrice,
  product,
}: UserProductAlertCard) {
  return (
    <Dialog>
      <Card className="relative flex select-none flex-col overflow-hidden transition-colors hover:bg-muted/50">
        <CardContent className="p-3 pb-0 sm:space-y-3">
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
                <strong className="text-lg text-foreground">
                  {priceFormatter.format(product.deals[0].price / 100)}
                </strong>
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
