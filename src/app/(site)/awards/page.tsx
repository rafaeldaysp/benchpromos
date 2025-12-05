import { getClient } from '@/lib/apollo'
import {
  type Awards,
  type AwardsCategory,
  type AwardsCategoryOption,
  type AwardsCategoryOptionVote,
  type Product,
} from '@/types'
import { gql } from '@apollo/client'
import { BenchAwards } from './main'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCurrentUserToken } from '@/app/_actions/user'

const GET_AWARDS_2025 = gql`
  query GetAwards2025($year: Int) {
    allAwards(year: $year) {
      id
      year
      isActive
      showResults
      categories {
        id
        title
        shortTitle
        icon
        expiredAt
        description
        options {
          id
          title
          brand
          subtitle
          badge
          awardsCategoryId
          productId
          product {
            id
            name
            imageUrl
          }
          _count {
            votes
          }
        }
      }
    }
  }
`

const GET_MY_VOTES = gql`
  query GetMyAwardsVotes($year: Int) {
    myAwardsVotes(year: $year) {
      id
      userId
      awardsCategoryOptionId
      awardsCategoryOption {
        awardsCategoryId
      }
    }
  }
`

export default async function Awards2025Page() {
  const token = await getCurrentUserToken()

  const { data } = await getClient().query<{
    allAwards: (Awards & {
      categories: (AwardsCategory & {
        options: (AwardsCategoryOption & {
          product: Product
          _count: { votes: number }
        })[]
      })[]
    })[]
  }>({
    query: GET_AWARDS_2025,
    variables: { year: 2025 },
  })

  const { data: myVotesData } = await getClient().query<{
    myAwardsVotes: (AwardsCategoryOptionVote & {
      awardsCategoryOption: AwardsCategoryOption
    })[]
  }>({
    query: GET_MY_VOTES,
    variables: { year: 2025 },
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    errorPolicy: 'ignore',
  })

  // Find the 2025 awards
  const awards2025 = data?.allAwards.find((award) => award.year === 2025)
  const myVotes = myVotesData?.myAwardsVotes || []

  if (!awards2025) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Prêmios 2025 não encontrados</h1>
          <p className="text-muted-foreground">
            Os prêmios de 2025 ainda não estão disponíveis.
          </p>
        </div>
      </div>
    )
  }

  return <BenchAwards awards={awards2025} myVotes={myVotes} token={token} />
}
