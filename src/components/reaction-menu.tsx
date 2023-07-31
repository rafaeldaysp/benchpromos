'use client'

import { gql, useMutation } from '@apollo/client'
import { toast } from 'sonner'

import { getCurrentUserToken } from '@/app/_actions/user'
import {
  ContextMenuItem,
  ContextMenuSubContent,
} from '@/components/ui/context-menu'
import { useReactionStore } from '@/hooks/use-reaction-store'

type Emote = {
  emote: string
  label: string
}

const emotes: Emote[] = [
  {
    emote: '👍',
    label: 'Curtida',
  },
  {
    emote: '👎',
    label: 'Descurtida',
  },
  {
    emote: '❤️',
    label: 'Coração',
  },
  {
    emote: '🔥',
    label: 'Fogo',
  },
  {
    emote: '💩',
    label: 'Cocô',
  },
]

const TOGGLE_REACTION = gql`
  mutation ToggleReaction($input: ToggleSaleReactionInput!) {
    toggleSaleReaction(toggleSaleReactionInput: $input) {
      id
    }
  }
`

interface ReactionMenuProps {
  saleId: string
  userId: string | undefined
}

export function ReactionMenu({ saleId, userId }: ReactionMenuProps) {
  const { reactions, setReactions } = useReactionStore()

  const [toggleReaction] = useMutation(TOGGLE_REACTION, {
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(data, clientOptions) {
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
