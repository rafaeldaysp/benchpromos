'use client'

import { gql, useMutation } from '@apollo/client'
import { toast } from 'sonner'

import { getCurrentUser } from '@/app/_actions/get-current-user'
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
    context: {
      headers: {
        Authorization: `Bearer eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..lXeMhCGgVjrU_aIY.xwtWsISOtKeIqLY5O9Bsrgp9I6PpW2TOZsNn9zNstuOs06AMILDHG1aWfWSU9A9SXDlohYPH_ykVChJvl6mQAa_ckT_oBvQJ_bIC4R2EimIKpvhQQsKZWh_tolYfw3sZINn5NlgDuGSEXabfcU89K79jd11jK4oZ9pOSjpj-aVT4zB_KIJ40l8I6GCxILB3kUkTibwaehp4DVFpCiYZG5H7CUvXYOPnYlN-ymRoL8WRdt1hgJz2jV80l9yiHg_tLLyvs-Nsl6TifeWTOUJFkAXf7jdXjF4lKTK78CIJwOS17IDtzjM5FhEsLffZL9M_1CgKFucjntw9O7YKHDdLsHNJQsZNM5dEx3iIiH7f-rnOmIPO4f9aQqdQLlKLu4W5G-EKq-Yx6.uDrEiBgIObLpBSyRz-0USQ`, // resolver o token e enviar para o server
      },
    },

    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {},
  })

  return (
    <ContextMenuSubContent>
      {reactions.map((reaction) => (
        <ContextMenuItem
          key={reaction.emote}
          onClick={() =>
            toggleReaction({
              variables: {
                input: {
                  saleId,
                  content: reaction.emote,
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
