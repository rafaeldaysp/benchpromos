'use client'

import { type ApolloClient } from '@apollo/client'

import { getCurrentUserToken } from '@/app/_actions/user'
import { emotes } from '@/constants'
import { useReactions } from '@/hooks/use-reactions'
import { Button } from '../ui/button'

interface ReactionMenuProps {
  saleId: string
  userId?: string
  apolloClient: ApolloClient<unknown>
  setOpenLoginPopup: React.Dispatch<React.SetStateAction<boolean>>
}

export function ReactionPopover({
  saleId,
  userId = '',
  apolloClient,
  setOpenLoginPopup,
}: ReactionMenuProps) {
  const { toggleReaction } = useReactions({ saleId, userId, apolloClient })

  async function handleToggleReaction(emote: string) {
    if (!userId) {
      setOpenLoginPopup(true)
      return
    }

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
    <div>
      {emotes.map((emote) => (
        <Button
          variant={'ghost'}
          key={emote.emote}
          onClick={() => handleToggleReaction(emote.emote)}
        >
          <span>{emote.emote}</span>
          <span className="sr-only">{emote.label}</span>
        </Button>
      ))}
    </div>
  )
}
