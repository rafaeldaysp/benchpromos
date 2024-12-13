import { getClient } from '@/lib/apollo'
import {
  type AwardsCategory,
  type AwardsCategoryOption,
  type Product,
  type AwardsCategoryOptionVote,
} from '@/types'
import { gql } from '@apollo/client'
import { AwardsMain } from './main'
import { getCurrentUser, getCurrentUserToken } from '@/app/_actions/user'

const GET_AWARDS_CATEGORIES = gql`
  query GetPublicAwardsCategories {
    awardsCategories {
      id
      title
      expiredAt
      description
      options {
        id
        title
        product {
          id
          imageUrl
          name
        }
        _count {
          votes
        }
        votes {
          id
          userId
          user {
            id
          }
        }
      }
    }
  }
`

export default async function AwardsPage() {
  const { data } = await getClient().query<{
    awardsCategories: (AwardsCategory & {
      options: (AwardsCategoryOption & {
        product: Product
        votes: AwardsCategoryOptionVote[]
      })[]
    })[]
  }>({
    query: GET_AWARDS_CATEGORIES,
  })
  const awardsCategories = data?.awardsCategories || []
  const user = await getCurrentUser()
  const token = await getCurrentUserToken()

  return (
    <div className="my-10 px-4 sm:container">
      <h1 className="mb-8 text-center text-3xl font-bold uppercase tracking-widest">
        Bench Awards 2024
      </h1>
      <AwardsMain
        awardsCategories={awardsCategories}
        userId={user?.id}
        token={token}
      />
    </div>
  )
}
