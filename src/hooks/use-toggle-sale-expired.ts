import { gql, useMutation } from '@apollo/client'
import { useAuthHeaders } from '@/components/auth-token-provider'

const UPDATE_SALE = gql`
  mutation ToggleSaleExpired($updateSaleInput: UpdateSaleInput!) {
    updateSale(updateSaleInput: $updateSaleInput) {
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
  const [toggleSaleExpired] = useMutation(UPDATE_SALE, {
    context: {
      headers: {
        ...authHeaders,
      },
    },
    refetchQueries: ['GetSales'],
    variables: {
      updateSaleInput: {
        id,
        expired: !expired,
      },
    },
  })

  return { toggleSaleExpired }
}
