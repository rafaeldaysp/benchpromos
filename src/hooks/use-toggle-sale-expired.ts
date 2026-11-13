import { gql, useMutation } from '@apollo/client'
import { toast } from 'sonner'

import { useAuthHeaders } from '@/components/auth-token-provider'

const UPDATE_SALE = gql`
  mutation ToggleSaleExpired($updateSaleInput: UpdateSaleInput!) {
    updateSale(updateSaleInput: $updateSaleInput) {
      id
    }
  }
`

const EXPIRE_SALE = gql`
  mutation ExpireSale($id: ID!, $remove: Boolean) {
    expireSale(id: $id, remove: $remove) {
      id
    }
  }
`

interface SaleExpired {
  id: string
  expired: boolean
}

export function useSaleExpired({ id, expired }: SaleExpired) {
  const authHeaders = useAuthHeaders()
  const context = { headers: { ...authHeaders } }

  const [toggleSaleExpired] = useMutation(UPDATE_SALE, {
    context,
    refetchQueries: ['GetSales'],
    variables: {
      updateSaleInput: {
        id,
        expired: !expired,
      },
    },
  })

  const [expireSaleMutation, { loading: isExpiring }] = useMutation(
    EXPIRE_SALE,
    {
      context,
      refetchQueries: ['GetSales'],
      onError(error) {
        toast.error(error.message)
      },
    },
  )

  /** Expires the sale and, when `remove` is true, deletes it in the same call. */
  async function expireSale(remove: boolean) {
    // onError handles failures; the promise then resolves without data.
    const { data } = await expireSaleMutation({ variables: { id, remove } })
    if (data?.expireSale)
      toast.success(
        remove
          ? 'Promoção expirada e excluída com sucesso.'
          : 'Promoção marcada como expirada.',
      )
  }

  return { toggleSaleExpired, expireSale, isExpiring }
}
