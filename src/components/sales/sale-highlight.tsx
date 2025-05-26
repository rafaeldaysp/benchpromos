'use client'

import { gql, useMutation } from '@apollo/client'
import { toast } from 'sonner'

import { getCurrentUserToken } from '@/app/_actions/user'
import { Icons } from '@/components/icons'
import { cn } from '@/lib/utils'
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
  user?: { id: string; role: 'ADMIN' | 'MOD' | 'USER' }
  className?: string
}

export function HighlightSaleToggle({ sale, user, className }: HighlightProps) {
  const [toggleHighlight] = useMutation(TOGGLE_HIGHLIGHT, {
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    // refetchQueries: ['GetSales'],
  })

  async function handleToggleHighlight(
    id: string,
    role?: 'ADMIN' | 'MOD' | 'USER',
  ) {
    if (role !== 'ADMIN') return

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
      className={cn(
        'flex h-fit w-full cursor-default select-none items-center justify-start rounded-sm px-2 py-1.5 text-sm font-normal outline-none',
        className,
      )}
      onClick={() => handleToggleHighlight(sale.id, user?.role)}
    >
      <Icons.Bookmark className="mr-2 h-4 w-4" />
      {sale.highlight ? 'Unmark' : 'Mark'}
    </Button>
  )
}
