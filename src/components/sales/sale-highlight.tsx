'use client'

import { gql, useMutation } from '@apollo/client'
import { toast } from 'sonner'

import { getCurrentUserToken } from '@/app/_actions/user'
import { Icons } from '@/components/icons'
import type { Sale } from '@/types'
import { Button } from '../ui/button'

const TOGGLE_HIGHLIGHT = gql`
  mutation ToggleHighlight($id: ID!) {
    toggleHighlight(id: $id) {
      id
      highlight
    }
  }
`

interface HighlightProps {
  sale: Pick<Sale, 'id' | 'highlight'>
  user?: { id: string; isAdmin: boolean }
}

export function HighlightSaleToggle({ sale, user }: HighlightProps) {
  const [toggleHighlight] = useMutation(TOGGLE_HIGHLIGHT, {
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    // refetchQueries: ['GetSales'],
  })

  async function handleToggleHighlight(id: string, isAdmin?: boolean) {
    if (!isAdmin) return

    const token = await getCurrentUserToken()

    await toggleHighlight({
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      variables: {
        id,
      },
    })
  }

  return (
    <Button
      variant={'ghost'}
      className="flex h-fit w-full cursor-default select-none items-center justify-start rounded-sm px-2 py-1.5 text-sm font-normal outline-none"
      onClick={() => handleToggleHighlight(sale.id, user?.isAdmin)}
    >
      <Icons.Bookmark className="mr-2 h-4 w-4" />
      {sale.highlight ? 'Desmarcar' : 'Marcar'}
    </Button>
  )
}
