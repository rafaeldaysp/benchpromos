'use client'

import { gql, useMutation } from '@apollo/client'
import { toast } from 'sonner'

import { getCurrentUserToken } from '@/app/_actions/user'
import {
  ContextMenuItem,
  ContextMenuSubContent,
} from '@/components/ui/context-menu'
import { emotes } from '@/constants'

const TOGGLE_REACTION = gql`
  mutation ToggleReaction($input: ToggleSaleReactionInput!) {
    toggleSaleReaction(toggleSaleReactionInput: $input) {
      id
    }
  }
`

interface ReactionMenuProps {
  saleId: string
  onReact: (content: string) => void
}

export function ReactionMenu({ saleId, onReact }: ReactionMenuProps) {
  const [toggleReaction] = useMutation(TOGGLE_REACTION, {
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      const emote = _clientOptions?.variables?.input.content as string
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
