import GiveawaysMain from './main'
import { getCurrentUser, getCurrentUserToken } from '@/app/_actions/user'
import {
  getPublicGiveaways,
  getPublicGiveawayRules,
  GIVEAWAYS_PER_PAGE,
} from '@/lib/public-giveaways'

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
  const status = searchParams.status === 'COMPLETED' ? 'COMPLETED' : 'OPEN'
  const requestedPage = Number(searchParams.page ?? '1')
  const currentPage =
    Number.isSafeInteger(requestedPage) &&
    requestedPage > 0 &&
    requestedPage <= 2147483647
      ? requestedPage
      : 1
  const [data, rulesConfigData, currentUser, token] = await Promise.all([
    getPublicGiveaways(status, currentPage),
    getPublicGiveawayRules(),
    getCurrentUser(),
    getCurrentUserToken(),
  ])
  const giveaways = data.list
  const statusCounts = data.statusCounts
  const pageCount = Math.ceil(
    (statusCounts.find((count) => count.status === status)?.count || 0) /
      GIVEAWAYS_PER_PAGE,
  )

  // Since we're filtering by status in the backend, all giveaways will be of the same type
  const activeGiveaways = status === 'COMPLETED' ? [] : giveaways
  const endedGiveaways = status === 'COMPLETED' ? giveaways : []

  return (
    <GiveawaysMain
      key={currentUser?.id ?? 'anonymous'}
      activeGiveaways={activeGiveaways}
      endedGiveaways={endedGiveaways}
      userId={currentUser?.id}
      token={token}
      statusCounts={statusCounts}
      page={currentPage}
      pageCount={pageCount}
      rulesConfigData={rulesConfigData}
    />
  )
}
