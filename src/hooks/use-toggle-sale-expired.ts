import { env } from '@/env.mjs'
import { gql, useMutation } from '@apollo/client'

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
  const [toggleSaleExpired] = useMutation(UPDATE_SALE, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
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
