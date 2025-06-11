import { gql } from '@apollo/client'
import GiveawaysMain from './main'
import { getClient } from '@/lib/apollo'
import { type User } from 'next-auth'
import { type Giveaway } from '@/types'
import { getCurrentUser, getCurrentUserToken } from '@/app/_actions/user'

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
        participants {
          id
          name
          email
          image
        }
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
    [key: string]: string | undefined
  }
}

export default async function GiveawaysPage({
  searchParams,
}: GiveawaysPageProps) {
  const { status } = searchParams
  const token = await getCurrentUserToken()
  const currentUser = await getCurrentUser()

  const { data } = await getClient().query<{
    giveaways: {
      distinctDates: string[]
      statusCounts: {
        status: string
        count: number
      }[]
      list: (Giveaway & {
        participants: User[]
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
      },
    },
  })

  const userSubscribedIds = data?.giveaways.userSubscribedIds || []

  return (
    <GiveawaysMain
      giveaways={data?.giveaways.list}
      currentUser={currentUser}
      token={token}
      userSubscribedIds={userSubscribedIds}
    />
  )
}
