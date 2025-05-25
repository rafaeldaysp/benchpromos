import { gql } from '@apollo/client'
import GiveawaysMain from './main'
import { getClient } from '@/lib/apollo'
import { type Giveaway } from '@/types'
import { type User } from 'next-auth'
import { getCurrentUserToken } from '@/app/_actions/user'
import { format } from 'date-fns'
import { notFound } from 'next/navigation'

const GET_GIVEAWAYS = gql`
  query GetGiveaways($drawDate: String) {
    giveaways(drawDate: $drawDate) {
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
        winner {
          id
          name
          email
          image
        }
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
  const { drawDate } = searchParams

  const today = format(new Date(), 'yyyy-MM-dd')
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
  }>({
    query: GET_GIVEAWAYS,
    variables: {
      drawDate: _drawDate,
    },
  })

  if (errors) {
    console.error(errors[0].message)
    return notFound()
  }

  return (
    <main>
      <GiveawaysMain
        giveaways={data.giveaways.list}
        token={token}
        drawDate={_drawDate}
        distinctDates={data.giveaways.distinctDates}
        statusCounts={data.giveaways.statusCounts}
      />
    </main>
  )
}
