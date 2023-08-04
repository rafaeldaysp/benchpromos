'use client'

import { gql, useMutation } from '@apollo/client'
import { toast } from 'sonner'

import { getCurrentUserToken } from '@/app/_actions/user'
import { Button } from '@/components/ui/button'
import { type Reaction } from '@/types'

const TOGGLE_REACTION = gql`
  mutation ToggleReaction($input: ToggleSaleReactionInput!) {
    toggleSaleReaction(toggleSaleReactionInput: $input) {
      id
    }
  }
`

interface ReactionsProps {
  saleId: string
  reactions: Reaction[]
  userId?: string
  onReact: (content: string) => void
}

export function Reactions({
  saleId,
  reactions,
  userId,
  onReact,
}: ReactionsProps) {
  const [toggleReaction] = useMutation(TOGGLE_REACTION, {
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, clientOptions) {
      const emote = clientOptions?.variables?.input.content as string
      onReact(emote)
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

  return (
    <div className="flex flex-wrap gap-1">
      {reactions.map((reaction) => {
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
