import { gql } from '@apollo/client'
import GiveawaysMain from './main'
import { getClient } from '@/lib/apollo'
import { type Giveaway } from '@/types'
import { type User } from 'next-auth'
import { getCurrentUserToken } from '@/app/_actions/user'
import { notFound } from 'next/navigation'
import { env } from '@/env.mjs'

const USERS_PER_PAGE = 12

const GET_GIVEAWAYS = gql`
  query GetGiveaways(
    $getGiveawaysInput: GetGiveawaysInput
    $getUsersInput: GetUsersInput
  ) {
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
    }
    users(getUsersInput: $getUsersInput) {
      count
      list {
        id
        name
        email
        image
        role
      }
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
  const { drawDate, subscribersPage, subscribersSearch, selectedGiveaway } =
    searchParams

  // Get today's date in Brazilian timezone using Intl.DateTimeFormat
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const parts = formatter.formatToParts(now)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  const today = `${year}-${month}-${day}`
  const _drawDate = drawDate ?? today

  const token = await getCurrentUserToken()

  const { data, errors } = await getClient().query<{
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
    }
    users: {
      count: number
      list: {
        id: string
        name: string
        email: string
        image: string
        role: 'USER' | 'MOD' | 'ADMIN'
      }[]
    }
  }>({
    query: GET_GIVEAWAYS,
    variables: {
      getGiveawaysInput: {
        drawDate: _drawDate,
      },
      getUsersInput: {
        search: subscribersSearch,
        pagination: {
          limit: USERS_PER_PAGE,
          page: Number(subscribersPage ?? '1'),
        },
        giveawayId: selectedGiveaway,
        includeGiveaways: true,
      },
    },
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
  })

  if (errors) {
    console.error(errors[0].message)
    return notFound()
  }

  const usersPageCount = Math.ceil(data.users.count / USERS_PER_PAGE)

  return (
    <main>
      <GiveawaysMain
        giveaways={data.giveaways.list}
        token={token}
        drawDate={_drawDate}
        distinctDates={data.giveaways.distinctDates}
        statusCounts={data.giveaways.statusCounts}
        subscribersToShow={data.users.list}
        subscribersPageCount={usersPageCount}
        subscribersPage={Number(subscribersPage ?? '1')}
      />
    </main>
  )
}
