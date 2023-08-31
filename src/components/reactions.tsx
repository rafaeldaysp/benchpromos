'use client'

import { type ApolloClient } from '@apollo/client'

import { getCurrentUserToken } from '@/app/_actions/user'
import { Toggle } from '@/components/ui/toggle'
import { useReactions } from '@/hooks/use-reactions'
import { type Reaction } from '@/types'

interface ReactionsProps {
  saleId: string
  reactions: Reaction[]
  userId?: string
  apolloClient: ApolloClient<unknown>
}

export function Reactions({
  saleId,
  reactions,
  userId = '',
  apolloClient,
}: ReactionsProps) {
  const { toggleReaction } = useReactions({ saleId, userId, apolloClient })

  async function handleToggleReaction(emote: string) {
    if (!userId) return

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
          <Toggle
            key={reaction.content}
            pressed={userReacted}
            className="h-fit rounded-full p-0 px-1.5"
            variant="outline"
            onClick={() => handleToggleReaction(reaction.content)}
          >
            {reaction.content}
            <span className="ml-0.5 text-xs">{reaction.users.length}</span>
          </Toggle>
        )
      })}
    </div>
  )
}
