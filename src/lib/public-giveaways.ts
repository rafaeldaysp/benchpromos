import 'server-only'

import { ApolloClient, gql, HttpLink, InMemoryCache } from '@apollo/client'
import { unstable_cache } from 'next/cache'
import { env } from '@/env.mjs'
import { type Giveaway, type GiveawayRuleConfig } from '@/types'
import { type User } from 'next-auth'

export const GIVEAWAYS_PER_PAGE = 12
export const PUBLIC_GIVEAWAYS_TAG = 'public-giveaways'

const GET_PUBLIC_GIVEAWAYS = gql`
  query GetPublicGiveaways($getGiveawaysInput: GetGiveawaysInput) {
    giveaways(getGiveawaysInput: $getGiveawaysInput) {
      statusCounts {
        status
        count
      }
      list {
        id
        name
        description
        drawAt
        imageUrl
        status
        rules {
          type
          config
        }
        participantsCount
        winnerId
        winner {
          id
          name
          image
        }
      }
    }
  }
`

const GET_RULES = gql`
  query GetPublicGiveawayRules {
    giveawayRulesConfig {
      type
      label
      configSchema {
        key
        label
        type
        options {
          value
          label
        }
      }
    }
  }
`

type PublicGiveaways = {
  list: (Giveaway & { winner: User | null })[]
  statusCounts: { status: string; count: number }[]
}

// This client never receives cookies, authorization, or user-specific variables.
// Cache only successful GraphQL results, not HTTP 200 error responses.
function publicClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: env.NEXT_PUBLIC_API_URL,
      fetchOptions: { cache: 'no-store' },
    }),
  })
}

// Coalesce concurrent cold misses and background refreshes within this process.
const pending = new Map<string, Promise<PublicGiveaways>>()
const loadPublicGiveaways = async (
  status: 'OPEN' | 'COMPLETED',
  page: number,
) => {
  const key = `${status}:${page}`
  const existing = pending.get(key)
  if (existing) return existing

  const request = publicClient()
    .query<{ giveaways: PublicGiveaways }>({
      query: GET_PUBLIC_GIVEAWAYS,
      variables: {
        getGiveawaysInput: {
          status,
          pagination: { limit: GIVEAWAYS_PER_PAGE, page },
        },
      },
    })
    .then(({ data }) => data.giveaways)
    .finally(() => pending.delete(key))
  pending.set(key, request)
  return request
}

export const getPublicGiveaways = unstable_cache(
  loadPublicGiveaways,
  ['public-giveaways-v1', env.NEXT_PUBLIC_API_URL],
  { revalidate: 20, tags: [PUBLIC_GIVEAWAYS_TAG] },
)

let pendingRules: Promise<GiveawayRuleConfig[]> | undefined
export const getPublicGiveawayRules = unstable_cache(
  async () => {
    pendingRules ??= publicClient()
      .query<{
        giveawayRulesConfig: GiveawayRuleConfig[]
      }>({ query: GET_RULES })
      .then(({ data }) => data.giveawayRulesConfig)
      .finally(() => {
        pendingRules = undefined
      })
    return pendingRules
  },
  ['public-giveaway-rules-v1', env.NEXT_PUBLIC_API_URL],
  { revalidate: 300, tags: [PUBLIC_GIVEAWAYS_TAG] },
)
