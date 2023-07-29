'use client'

import { gql, useMutation } from '@apollo/client'
import * as React from 'react'
import { toast } from 'sonner'

import { getCurrentUserToken } from '@/app/_actions/user'
import { Button } from '@/components/ui/button'

interface ReactionButtonProps {
  saleId: string
  userId?: string
  reaction: string
  users: { id: string }[]
}

const TOGGLE_REACTION = gql`
  mutation ToggleReaction($input: ToggleSaleReactionInput!) {
    toggleSaleReaction(toggleSaleReactionInput: $input) {
      id
    }
  }
`

export function ReactionButton({
  saleId,
  userId,
  reaction,
  users: initialUsers,
}: ReactionButtonProps) {
  const [users, setUsers] = React.useState(initialUsers)

  const [toggleReaction] = useMutation(TOGGLE_REACTION, {
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      // atualizar os usuários
    },
  })

  async function handleToggleReaction(emote: string) {
    const token = await getCurrentUserToken()

    await toggleReaction({
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      variables: {
        input: {
          saleId,
          content: emote,
        },
      },
    })
  }

  const userReacted = users.some((user) => user.id === userId)

  return (
    <Button
      variant={userReacted ? 'default' : 'outline'}
      size="icon"
      className="h-fit rounded-full"
      onClick={() => handleToggleReaction(reaction)}
    >
      {reaction}
      <span className="text-sm">{users.length}</span>
    </Button>
  )
}
