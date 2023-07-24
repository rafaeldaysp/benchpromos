'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
import { gql, useMutation } from '@apollo/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ReactionButtonProps {
  reaction: string
  saleId: string
  initialUsers: { id: string }[]
}

const TOGGLE_REACTION = gql`
  mutation ToggleReaction($input: ToggleSaleReactionInput!) {
    toggleSaleReaction(toggleSaleReactionInput: $input) {
      id
    }
  }
`

export function ReactionButton({
  reaction,
  initialUsers,
  saleId,
}: ReactionButtonProps) {
  const router = useRouter()

  //const [usersIds, setUsersIds] = React.useState<{ id: string }[]>(initialUsers)

  const [toggleReaction] = useMutation(TOGGLE_REACTION, {
    context: {
      headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNsa2JweDk4eTAwMDBoaHpjajY3dGZva3kiLCJpc0FkbWluIjp0cnVlfQ.iYwNIO99BqOCWIQVmuvoZBEkGo_2mY07bOnR_86AYzo`, // substituir com o token da sessão do usuário
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      router.refresh()
    },
  })

  const MY_SESSION_ID = 'clkbpx98y0000hhzcj67tfoky' // substituir com o id da sessão do usuário
  return (
    <div
      onClick={() =>
        toggleReaction({
          variables: {
            input: {
              content: reaction,
              saleId,
            },
          },
        })
      }
      className={cn(
        'mx-auto flex cursor-pointer items-center gap-1 rounded-xl border px-1 transition-colors hover:bg-accent',
        {
          'bg-violet-500 hover:bg-violet-400':
            MY_SESSION_ID &&
            initialUsers.some((user) => user.id === MY_SESSION_ID),
        },
      )}
    >
      {reaction}
      <span className="text-sm">{initialUsers.length}</span>
    </div>
  )
}
