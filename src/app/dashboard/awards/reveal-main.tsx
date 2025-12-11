'use client'

import { gql, useQuery } from '@apollo/client'
import { RevealCeremony } from '@/components/awards-reveal/reveal-ceremony'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  type Awards,
  type AwardsCategory,
  type AwardsCategoryOption,
  type Product,
} from '@/types'
import { env } from '@/env.mjs'

const GET_ALL_AWARDS = gql`
  query GetAllAwards {
    allAwards {
      id
      year
      isActive
      showResults
      createdAt
      updatedAt
      categories {
        id
        title
        shortTitle
        icon
        expiredAt
        description
        awardsId
        options {
          id
          title
          brand
          subtitle
          badge
          product {
            id
            imageUrl
            name
          }
          _count {
            votes
          }
        }
      }
    }
  }
`

export function AwardsRevealMain() {
  const { data, loading } = useQuery<{
    allAwards: (Awards & {
      categories: (AwardsCategory & {
        options: (AwardsCategoryOption & {
          product: Product
        })[]
      })[]
    })[]
  }>(GET_ALL_AWARDS, {
    fetchPolicy: 'cache-and-network',
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
  })

  const allAwards = data?.allAwards || []

  if (loading && !data) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-40" />
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-32" />
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return <RevealCeremony allAwards={allAwards} />
}
