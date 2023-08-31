'use client'

import { type ApolloClient } from '@apollo/client'

import { getCurrentUserToken } from '@/app/_actions/user'
import {
  ContextMenuItem,
  ContextMenuSubContent,
} from '@/components/ui/context-menu'
import { emotes } from '@/constants'
import { useReactions } from '@/hooks/use-reactions'

interface ReactionMenuProps {
  saleId: string
  userId?: string
  apolloClient: ApolloClient<unknown>
}

export function ReactionMenu({
  saleId,
  userId = '',
  apolloClient,
}: ReactionMenuProps) {
  const { toggleReaction } = useReactions({ saleId, userId, apolloClient })

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
    <ContextMenuSubContent>
      {emotes.map((emote) => (
        <ContextMenuItem
          key={emote.emote}
          onClick={() => handleToggleReaction(emote.emote)}
        >
          <span>{emote.emote}</span>
          <span className="sr-only">{emote.label}</span>
        </ContextMenuItem>
      ))}
    </ContextMenuSubContent>
  )
}
