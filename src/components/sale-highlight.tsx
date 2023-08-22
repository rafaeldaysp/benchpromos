'use client'

import { gql, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'

import { getCurrentUserToken } from '@/app/_actions/user'
import { type Sale } from '@/types'
import { toast } from 'sonner'
import { Icons } from './icons'
import { ContextMenuItem } from './ui/context-menu'

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

export function Highlight({ sale, user }: HighlightProps) {
  const router = useRouter()

  const [toggleHighlight] = useMutation(TOGGLE_HIGHLIGHT, {
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      router.refresh()
    },
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
    <ContextMenuItem
      onClick={() => handleToggleHighlight(sale.id, user?.isAdmin)}
    >
      <Icons.Bookmark className="mr-2 h-4 w-4" />
      {sale.highlight ? 'Rebaixar' : 'Destacar'}
    </ContextMenuItem>
  )
}
