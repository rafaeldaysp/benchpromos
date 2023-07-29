'use client'

import { gql, useMutation } from '@apollo/client'
import { toast } from 'sonner'

import { getCurrentUserToken } from '@/app/_actions/user'
import {
  ContextMenuItem,
  ContextMenuSubContent,
} from '@/components/ui/context-menu'

type Reaction = {
  emote: string
  label: string
}

const reactions: Reaction[] = [
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
}

export function ReactionMenu({ saleId }: ReactionMenuProps) {
  const [toggleReaction] = useMutation(TOGGLE_REACTION, {
    onError(error, _clientOptions) {
      toast.error(error.message)
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
      {reactions.map((reaction) => (
        <ContextMenuItem
          key={reaction.emote}
          onClick={() => handleToggleReaction(reaction.emote)}
        >
          <span>{reaction.emote}</span>
          <span className="sr-only">{reaction.label}</span>
        </ContextMenuItem>
      ))}
    </ContextMenuSubContent>
  )
}
