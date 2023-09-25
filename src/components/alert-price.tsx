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

const UPDATE_USER_ALERTS = gql`
  mutation UpdateUserAlerts($input: UpdateUserAlertsInput!) {
    updateUserAlerts(updateUserAlertsInput: $input) {
      id
    }
  }
`

interface AlertPriceProps {
  mode?: 'create' | 'update'
  productId: string
}

export function AlertPrice({ mode = 'create', productId }: AlertPriceProps) {
  const [price, setPrice] = React.useState(200345)

  const [updateUserAlerts] = useMutation(UPDATE_USER_ALERTS, {
    onError(error) {
      toast.error(error.message)
    },
    onCompleted(data) {
      toast.success('Seu alerta foi criado!')
    },
  })

  function incrementPrice() {
    setPrice((prev) => prev + 5000)
  }

  function decrementPrice() {
    setPrice((prev) => prev - 5000)
  }

  async function handleCreateAlert() {
    const token = await getCurrentUserToken()

    updateUserAlerts({
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      variables: {
        input: {
          subscribedProducts: [
            {
              price,
              productId,
            },
          ],
        },
      },
    })
  }

  async function handleDeleteAlert() {
    const token = await getCurrentUserToken()
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="text-center text-xl">
          Alerta de Preço
        </DialogTitle>
        <DialogDescription className="text-center">
          {mode === 'create'
            ? 'Você ainda não possui um alerta para esse produto'
            : 'Você tem um alerta de preço para R$ 1.136,00'}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-8 text-center">
        <span>
          {mode === 'create'
            ? 'Para criar um alerta, indique um valor:'
            : 'Para alterar o alerta, indique um novo valor:'}
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
          {mode === 'create' ? (
            <Button size="lg" className="w-full" onClick={handleCreateAlert}>
              Criar
            </Button>
          ) : (
            <>
              <Button variant="destructive" size="lg" className="w-full">
                Remover
              </Button>
              <Button size="lg" className="w-full">
                Editar
              </Button>
            </>
          )}
        </DialogFooter>
      </div>
    </DialogContent>
  )
}
