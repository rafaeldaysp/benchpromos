'use client'

import { gql, useMutation, useSuspenseQuery } from '@apollo/client'
import * as React from 'react'
import { toast } from 'sonner'

import { getCurrentUserToken } from '@/app/_actions/user'
import { Icons } from '@/components/icons'
import { PriceInput } from '@/components/price-input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { priceFormatter } from '@/utils/formatter'
import { LoginPopup } from './login-popup'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card'
import { Label } from './ui/label'
import { Switch } from './ui/switch'

const GET_PRODUCT_ALERT = gql`
  query GetProductAlert($userAlertInput: UserProductAlertInput!) {
    userProductAlert(userProductAlertInput: $userAlertInput) {
      price
    }
  }
`

const UPDATE_PRODUCT_ALERT = gql`
  mutation UpdateProductAlert($productId: ID!, $price: Int) {
    updateProductAlert(productId: $productId, price: $price) {
      id
    }
  }
`

export function AlertCard({
  productId,
  switchId,
  productPrice,
  token,
}: {
  productId: string
  productPrice: number
  switchId: string
  token?: string
}) {
  const [openLoginPopup, setOpenLoginPopup] = React.useState(false)
  const { data } = useSuspenseQuery<{
    userProductAlert: {
      price: number
    } | null
  }>(GET_PRODUCT_ALERT, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      userAlertInput: {
        identifier: productId,
      },
    },
    errorPolicy: 'ignore',
  })
  const userAlertPrice = data?.userProductAlert?.price
  return (
    <>
      <LoginPopup open={openLoginPopup} setOpen={setOpenLoginPopup} />
      <Dialog>
        <Card id="alert-card" className="overflow-hidden">
          {userAlertPrice && (
            <CardHeader className="block bg-primary px-6 py-1 text-sm font-medium text-primary-foreground">
              Alerta em{' '}
              <strong>{priceFormatter.format(userAlertPrice / 100)}</strong>
            </CardHeader>
          )}
          <CardContent className="py-4">
            <div className="flex items-start space-x-2">
              <Icons.BellRing className="size-4 text-auxiliary" />
              <Label
                htmlFor={switchId}
                className="flex flex-1 flex-col space-y-1"
              >
                <CardTitle>Quer economizar?</CardTitle>
                <CardDescription>
                  Nós alertamos você quando o preço baixar
                </CardDescription>
              </Label>
              <DialogTrigger asChild>
                <div>
                  <Switch checked={!!userAlertPrice} id={switchId} />
                </div>
              </DialogTrigger>
            </div>
          </CardContent>
          {userAlertPrice && (
            <CardFooter className="pb-4">
              <DialogTrigger asChild>
                <Button variant="outline">Editar alerta</Button>
              </DialogTrigger>
            </CardFooter>
          )}
        </Card>

        <AlertPrice
          productId={productId}
          userAlertPrice={userAlertPrice}
          productPrice={productPrice}
          setOpenLoginPopup={setOpenLoginPopup}
        />
      </Dialog>
    </>
  )
}

interface AlertPriceProps {
  productId: string
  productPrice: number
  setOpenLoginPopup?: React.Dispatch<React.SetStateAction<boolean>>
  userAlertPrice?: number
}

export function AlertPrice({
  productId,
  productPrice,
  userAlertPrice,
  setOpenLoginPopup,
}: AlertPriceProps) {
  const [price, setPrice] = React.useState(userAlertPrice ?? productPrice)

  const [mutateProductAlert] = useMutation(UPDATE_PRODUCT_ALERT, {
    onError(error) {
      toast.error(error.message)
    },
    refetchQueries: ['GetProductAlert', 'GetProductsAlerts'],
  })

  function incrementPrice() {
    setPrice((prev) => prev + 5000)
  }

  function decrementPrice() {
    setPrice((prev) => prev - 5000)
  }

  async function handleMutateAlert(price: number | null) {
    const token = await getCurrentUserToken()

    if (!token) {
      if (setOpenLoginPopup) setOpenLoginPopup(true)
      return
    }

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
      <div className="space-y-4  text-center">
        <div className="space-y-4 rounded-xl border py-4">
          <span className="flex items-center justify-center">
            <Icons.Bell className="mr-2 size-4 text-auxiliary" />
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
