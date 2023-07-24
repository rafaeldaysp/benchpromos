'use client'

import * as React from 'react'

import { gql, useMutation } from '@apollo/client'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'

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
  const [users, setUsers] = React.useState<typeof initialUsers>(initialUsers)

  const [toggleReaction] = useMutation(TOGGLE_REACTION, {
    context: {
      headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNsa2JweDk4eTAwMDBoaHpjajY3dGZva3kiLCJpc0FkbWluIjp0cnVlfQ.iYwNIO99BqOCWIQVmuvoZBEkGo_2mY07bOnR_86AYzo`, // substituir com o token da sessão do usuário
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message) // login toast
    },
    onCompleted(_data, _clientOptions) {
      users.some((user) => user.id === MY_SESSION_ID)
        ? setUsers(users.filter((user) => user.id !== MY_SESSION_ID))
        : setUsers(users.concat({ id: MY_SESSION_ID }))
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
        'mx-auto flex cursor-pointer items-center gap-x-1 rounded-xl border px-1 transition-colors hover:bg-accent',
        {
          'bg-primary hover:bg-primary/80 text-primary-foreground':
            MY_SESSION_ID && users.some((user) => user.id === MY_SESSION_ID),
          hidden: users.length < 1,
        },
      )}
    >
      {reaction}
      <span className="text-sm">{users.length}</span>
    </div>
  )
}
