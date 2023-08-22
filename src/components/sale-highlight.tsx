'use client'

import { gql, useMutation } from '@apollo/client'
import { BookmarkFilledIcon, BookmarkIcon } from '@radix-ui/react-icons'
import { useRouter } from 'next/navigation'

import { getCurrentUserToken } from '@/app/_actions/user'
import { cn } from '@/lib/utils'
import { type Sale } from '@/types'
import { toast } from 'sonner'

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

    console.log('oi')

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
    <div className="absolute right-1.5 top-[-2px]">
      {sale.highlight ? (
        <BookmarkFilledIcon
          className={cn({ 'cursor-pointer': user?.isAdmin })}
          onClick={() => handleToggleHighlight(sale.id, user?.isAdmin)}
        />
      ) : (
        <BookmarkIcon
          className={cn({
            'cursor-pointer': user?.isAdmin,
            hidden: !user?.isAdmin,
          })}
          onClick={() => handleToggleHighlight(sale.id, user?.isAdmin)}
        />
      )}
    </div>
  )
}
