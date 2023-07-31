'use client'

import { gql, useMutation } from '@apollo/client'
import * as React from 'react'
import { toast } from 'sonner'

import { getCurrentUserToken } from '@/app/_actions/user'
import { Button } from '@/components/ui/button'
import { useReactionStore } from '@/hooks/use-reaction-store'

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
  const { reactions, setReactions } = useReactionStore()

  React.useEffect(() => {
    setReactions([
      ...reactions,
      ...initialUsers.map((user) => {
        return {
          userId: user.id,
          saleId,
          content: reaction,
        }
      }),
    ])
    // console.log(reactions)
  }, [setReactions, initialUsers])

  const [users, setUsers] = React.useState(initialUsers)

  const [toggleReaction] = useMutation(TOGGLE_REACTION, {
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, clientOptions) {
      const emote = clientOptions?.variables?.input.content as string

      if (!userId) return
      const currentToggle = { userId, saleId, content: emote }

      reactions.includes(currentToggle)
        ? setReactions(
            reactions.filter((reaction) => reaction !== currentToggle),
          )
        : setReactions([...reactions, currentToggle])
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
  console.log(reactions)
  const userReacted = reactions.some((reaction) => reaction.userId === userId)

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
