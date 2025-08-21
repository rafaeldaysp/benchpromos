import { gql } from '@apollo/client'

import { SalesByCategory } from '@/components/dashboard/sales-by-category'
import { SalesByMonth } from '@/components/dashboard/sales-by-month'
import { SalesByReactions } from '@/components/dashboard/sales-by-reactions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'

const GET_DASHBOARD_DATA = gql`
  query GetDashboardData($getDashboardDataInput: GetDashboardDataInput) {
    dashboardData(getDashboardDataInput: $getDashboardDataInput) {
      totalSales
      salesByMonth {
        amount
        date
      }
      salesTrending {
        sale {
          title
          id
          imageUrl
          slug
        }
        _count {
          comments
          reactions
        }
      }
      salesByCategory {
        amount
        categoryName
        fill
      }
    }
  }
`

interface DashboardPageProps {
  searchParams: {
    category: string
    periodStartDate: string
    periodEndDate: string
  }
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { category, periodStartDate, periodEndDate } = searchParams
  const { data } = await getClient().query({
    query: GET_DASHBOARD_DATA,
    variables: {
      getDashboardDataInput: {
        category,
        periodStartDate: periodStartDate
          ? new Date(periodStartDate)
          : undefined,
        periodEndDate: periodEndDate ? new Date(periodEndDate) : undefined,
      },
    },
    errorPolicy: 'all',
  })

  const dashboardData = data.dashboardData
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Dashboard</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie as informações do site, crie produtos, promoções, benchmarks
          e visualize os dados...
        </p>
      </div>
      <Separator />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de promoções
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="size-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalSales}</div>
            {/* <p className="text-xs text-muted-foreground">
              some description would be placed here
            </p> */}
          </CardContent>
        </Card>
      </div>
      <SalesByMonth data={dashboardData.salesByMonth} />
      <div className="grid gap-y-6 lg:grid-cols-3 lg:gap-x-6">
        <div className="col-span-2">
          <SalesByCategory chartData={dashboardData.salesByCategory} />
        </div>
        <SalesByReactions data={dashboardData.salesTrending} />
      </div>
    </div>
  )
}
