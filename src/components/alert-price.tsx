'use client'

import { gql, useMutation } from '@apollo/client'
import * as React from 'react'
import { toast } from 'sonner'

import { getCurrentUserToken } from '@/app/_actions/user'
import { Icons } from '@/components/icons'
import { PriceInput } from '@/components/price-input'
import { Button } from '@/components/ui/button'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { priceFormatter } from '@/utils/formatter'

const UPDATE_PRODUCT_ALERT = gql`
  mutation UpdateProductAlert($productId: ID!, $price: Int) {
    updateProductAlert(productId: $productId, price: $price) {
      id
    }
  }
`

interface AlertPriceProps {
  productId: string
  productPrice: number
  userAlertPrice?: number
}

export function AlertPrice({
  productId,
  productPrice,
  userAlertPrice,
}: AlertPriceProps) {
  const [price, setPrice] = React.useState(userAlertPrice ?? productPrice)

  const [mutateProductAlert] = useMutation(UPDATE_PRODUCT_ALERT, {
    onError(error) {
      toast.error(error.message)
    },
    refetchQueries: ['GetUserProductAlert'],
  })

  function incrementPrice() {
    setPrice((prev) => prev + 5000)
  }

  function decrementPrice() {
    setPrice((prev) => prev - 5000)
  }

  async function handleMutateAlert(price: number | null) {
    const token = await getCurrentUserToken()

    mutateProductAlert({
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      variables: {
        productId,
        price,
      },
      onCompleted() {
        if (!price) return toast.success('Alerta removido com sucesso.')

        if (userAlertPrice) return toast.success('Alerta editado com sucesso.')

        return toast.success('Alerta criado com sucesso.')
      },
    })
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="text-center text-xl">
          Alerta de Preço
        </DialogTitle>
        <DialogDescription className="text-center">
          {!!userAlertPrice
            ? `Você tem um alerta de preço para ${priceFormatter.format(
                userAlertPrice / 100,
              )}`
            : 'Você ainda não possui um alerta para esse produto'}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-8 text-center">
        <span>
          {!!userAlertPrice
            ? 'Para alterar o alerta, indique um novo valor:'
            : 'Para criar um alerta, indique um valor:'}
        </span>
        <div className="flex justify-center gap-x-2">
          <Button
            size="icon"
            variant="outline"
            className="rounded-full"
            onClick={decrementPrice}
          >
            <Icons.Minus />
          </Button>

          <PriceInput
            className="max-w-[150px] text-center"
            value={price / 100}
            onValueChange={({ floatValue }) =>
              setPrice(~~((floatValue ?? 0) * 100))
            }
          />

          <Button
            size="icon"
            variant="outline"
            className="rounded-full"
            onClick={incrementPrice}
          >
            <Icons.Plus />
          </Button>
        </div>
        <DialogFooter className="gap-y-4">
          <Button
            size="lg"
            className="w-full"
            onClick={() => handleMutateAlert(price)}
          >
            {!!userAlertPrice ? 'Editar' : 'Criar'}
          </Button>

          {!!userAlertPrice && (
            <Button
              variant="destructive"
              size="lg"
              className="w-full"
              onClick={() => handleMutateAlert(null)}
            >
              Remover
            </Button>
          )}
        </DialogFooter>
      </div>
    </DialogContent>
  )
}
