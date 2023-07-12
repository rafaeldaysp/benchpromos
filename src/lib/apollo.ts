import { env } from '@/env.mjs'
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { registerApolloClient } from '@apollo/experimental-nextjs-app-support/rsc'

export const { getClient } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: env.NEXT_PUBLIC_API_URL,
      fetchOptions: { cache: 'no-store' },
    }),
  })
})
