'use client'

import { gql, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

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
  const router = useRouter()

  const [toggleReaction] = useMutation(TOGGLE_REACTION, {
    context: {
      headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNsa2JweDk4eTAwMDBoaHpjajY3dGZva3kiLCJpc0FkbWluIjp0cnVlfQ.iYwNIO99BqOCWIQVmuvoZBEkGo_2mY07bOnR_86AYzo`, // resolver o token e enviar para o server
      },
    },

    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      router.refresh()
    },
  })

  return (
    <ContextMenuSubContent>
      {reactions.map((reaction) => (
        <ContextMenuItem
          className="flex justify-between"
          key={reaction.emote}
          onClick={() =>
            toggleReaction({
              variables: {
                input: {
                  content: reaction.emote,
                  saleId,
                },
              },
            })
          }
        >
          <span>{reaction.emote}</span>
          <span className="sr-only">{reaction.label}</span>
        </ContextMenuItem>
      ))}
    </ContextMenuSubContent>
  )
}
