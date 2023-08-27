import { useQuery } from '@apollo/experimental-nextjs-app-support/ssr'

import { GET_SALES } from '@/queries'

export function useReactions() {
  const { client } = useQuery(GET_SALES)

  const data = client.cache.readQuery({ query: GET_SALES })

  const sales = data

  return {
    sales,
  }
}
