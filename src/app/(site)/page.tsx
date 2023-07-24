import { gql } from '@apollo/client'

import { getClient } from '@/lib/apollo'
import { type Comment, type Category, type Sale } from '@/types'
import { SaleCard } from '@/components/sale-card'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Icons } from '@/components/icons'
import { ReactionMenu } from '@/components/reaction-menu'

const GET_SALES = gql`
  query GetSales {
    sales {
      id
      title
      slug
      imageUrl
      url
      price
      installments
      totalInstallmentPrice
      caption
      review
      label
      coupon
      cashback
      createdAt
      categoryId
      productSlug
      category {
        name
        slug
      }
      comments {
        id
      }
      reactions {
        content
        users {
          id
        }
      }
    }
  }
`

export default async function Home() {
  const response = await getClient().query<{
    sales: (Sale & {
      category: Pick<Category, 'name' | 'slug'>
      comments: Pick<Comment, 'id'>[]
      reactions: { content: string; users: { id: string }[] }[]
    })[]
  }>({
    query: GET_SALES,
  })

  const sales = response.data.sales

  return (
    <div className="px-4 sm:container">
      <div className="my-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sales.map((sale) => (
          <ContextMenu key={sale.id}>
            <ContextMenuTrigger>
              <SaleCard sale={sale} />
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuSub>
                <ContextMenuSubTrigger className="flex gap-2">
                  <Icons.SmilePlus className="h-4 w-4" />
                  <span>Reagir</span>
                </ContextMenuSubTrigger>
                <ReactionMenu saleId={sale.id} />
              </ContextMenuSub>
              <ContextMenuSeparator />
              <a href={`/promocao/${sale.id}/${sale.slug}`}>
                <ContextMenuItem className="flex gap-2">
                  <Icons.GanttChartSquare className="h-4 w-4" />
                  <span>Mais detalhes</span>
                </ContextMenuItem>
              </a>
              {sale.productSlug && (
                <a href={`/${sale.category.slug}/${sale.productSlug}`}>
                  <ContextMenuItem className="flex gap-2">
                    <Icons.Eye className="h-4 w-4" />
                    <span>Ver produto</span>
                  </ContextMenuItem>
                </a>
              )}

              <a href={`/promocao/${sale.id}/${sale.slug}#comments`}>
                <ContextMenuItem className="flex gap-2">
                  <Icons.MessageCircle className="h-4 w-4" />
                  <span>Comentários</span>
                </ContextMenuItem>
              </a>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
    </div>
  )
}
