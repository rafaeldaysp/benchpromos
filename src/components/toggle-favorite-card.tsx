'use client'

import { gql, useMutation, useSuspenseQuery } from '@apollo/client'
import * as React from 'react'
import { toast } from 'sonner'

import { getCurrentUserToken } from '@/app/_actions/user'
import { Icons } from '@/components/icons'
import { LoginPopup } from './login-popup'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import { Label } from './ui/label'
import { Switch } from './ui/switch'

const GET_USER_FAVORITED = gql`
  query GetUserFavorited($productId: String!) {
    userFavorited(productId: $productId)
  }
`

const TOGGLE_FAVORITE = gql`
  mutation ToggleUserFavorited($productId: String!) {
    toggleFavorite(productId: $productId)
  }
`

export function ToggleFavoriteCard({
  productId,
  switchId,
  token,
}: {
  productId: string
  switchId: string
  token?: string
}) {
  const [openLoginPopup, setOpenLoginPopup] = React.useState(false)
  const { data } = useSuspenseQuery<{
    userFavorited: boolean
  }>(GET_USER_FAVORITED, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      productId,
    },
    errorPolicy: 'ignore',
  })

  const [toggleFavorite] = useMutation(TOGGLE_FAVORITE, {
    onError(error) {
      toast.error(error.message)
    },
    refetchQueries: ['GetUserFavorited', 'GetUserFavoritedProducts'],
  })

  async function handleToggleFavorite(favorite: boolean) {
    const token = await getCurrentUserToken()

    if (!token) {
      if (setOpenLoginPopup) setOpenLoginPopup(true)
      return
    }

    toggleFavorite({
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      variables: {
        productId,
      },
      onCompleted() {
        if (!favorite)
          return toast.success('Produto removido dos favoritos com sucesso.')

        return toast.success('Produto adicionado aos favoritos com sucesso.')
      },
    })
  }

  const userFavorited = data?.userFavorited
  return (
    <>
      <LoginPopup open={openLoginPopup} setOpen={setOpenLoginPopup} />
      <Card id="alert-card" className="overflow-hidden">
        {userFavorited && (
          <CardHeader className="block bg-primary px-6 py-1 text-sm font-medium text-primary-foreground">
            Salvo nos favoritos
          </CardHeader>
        )}
        <CardContent className="py-4">
          <div className="flex items-start space-x-2">
            <Icons.Heart className="h-4 w-4 text-auxiliary" />
            <Label
              htmlFor={switchId}
              className="flex flex-1 flex-col space-y-1"
            >
              <CardTitle>Salvar como favorito</CardTitle>
              <CardDescription>
                Acompanhe esse produto salvando entre seus produtos favoritos
              </CardDescription>
            </Label>
            <Switch
              checked={!!userFavorited}
              id={switchId}
              onCheckedChange={(checked) => handleToggleFavorite(checked)}
            />
          </div>
        </CardContent>
      </Card>
    </>
  )
}
