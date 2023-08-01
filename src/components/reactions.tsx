'use client'

import { gql, useMutation } from '@apollo/client'
import { toast } from 'sonner'
import * as React from 'react'

import { getCurrentUserToken } from '@/app/_actions/user'
import { Button } from '@/components/ui/button'

const TOGGLE_REACTION = gql`
  mutation ToggleReaction($input: ToggleSaleReactionInput!) {
    toggleSaleReaction(toggleSaleReactionInput: $input) {
      id
    }
  }
`

interface ReactionsProps {
  saleId: string
  userId?: string
  reactions: {
    content: string
    users: { id: string }[]
  }[]
}

export function Reactions({
  saleId,
  userId,
  reactions: initialReactions,
}: ReactionsProps) {
  const [toggleReaction] = useMutation(TOGGLE_REACTION, {
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {},
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

  return (
    <div className="flex flex-wrap gap-1">
      {initialReactions.map((reaction) => {
        const userReacted = reaction.users.some((user) => user.id === userId)

        return (
          <Button
            key={reaction.content}
            variant={userReacted ? 'default' : 'outline'}
            size="icon"
            className="h-fit rounded-full"
            onClick={() => handleToggleReaction(reaction.content)}
          >
            {reaction.content}
            <span className="text-sm">{reaction.users.length}</span>
          </Button>
        )
      })}
    </div>
  )
}
