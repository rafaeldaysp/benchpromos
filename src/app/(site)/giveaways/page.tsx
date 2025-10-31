import { gql } from '@apollo/client'
import GiveawaysMain from './main'
import { getClient } from '@/lib/apollo'
import { type User } from 'next-auth'
import { type Giveaway } from '@/types'
import { getCurrentUser, getCurrentUserToken } from '@/app/_actions/user'

const GIVEAWAYS_PER_PAGE = 12

const GET_PUBLIC_GIVEAWAYS = gql`
  query GetPublicGiveaways($getGiveawaysInput: GetGiveawaysInput) {
    giveaways(getGiveawaysInput: $getGiveawaysInput) {
      distinctDates
      statusCounts {
        status
        count
      }
      list {
        id
        name
        description
        drawAt
        status

        participantsCount
        winnerId
        winner {
          id
          name
          email
          image
        }
      }
      userSubscribedIds
    }
  }
`

interface GiveawaysPageProps {
  searchParams: {
    status?: string
    page?: string
    [key: string]: string | undefined
  }
}

export default async function GiveawaysPage({
  searchParams,
}: GiveawaysPageProps) {
  const { status, page } = searchParams
  const token = await getCurrentUserToken()
  const currentUser = await getCurrentUser()
  const currentPage = Number(page ?? '1')

  const { data } = await getClient().query<{
    giveaways: {
      distinctDates: string[]
      statusCounts: {
        status: string
        count: number
      }[]
      list: (Giveaway & {
        participantsCount: number
        winner: User | null
      })[]
      userSubscribedIds?: string[]
    }
  }>({
    query: GET_PUBLIC_GIVEAWAYS,
    variables: {
      getGiveawaysInput: {
        status: status || 'OPEN',
        userId: currentUser?.id,
        pagination: {
          limit: GIVEAWAYS_PER_PAGE,
          page: currentPage,
        },
      },
    },
  })

  const userSubscribedIds = data?.giveaways.userSubscribedIds || []
  const giveaways = data?.giveaways.list || []
  const statusCounts = data?.giveaways.statusCounts
  const pageCount = Math.ceil(
    (data.giveaways.statusCounts.find((count) => count.status === status)
      ?.count || 0) / GIVEAWAYS_PER_PAGE,
  )

  // Since we're filtering by status in the backend, all giveaways will be of the same type
  const activeGiveaways = status === 'COMPLETED' ? [] : giveaways
  const endedGiveaways = status === 'COMPLETED' ? giveaways : []

  return (
    <GiveawaysMain
      activeGiveaways={activeGiveaways}
      endedGiveaways={endedGiveaways}
      currentUser={currentUser}
      token={token}
      userSubscribedIds={userSubscribedIds}
      statusCounts={statusCounts}
      page={currentPage}
      pageCount={pageCount}
    />
  )
}
