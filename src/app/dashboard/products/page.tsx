import { gql } from '@apollo/client'
import * as React from 'react'

import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'
import { type Filter } from '@/types'
import { ProductsMain } from './main'

const GET_FILTERS = gql`
  query GetFilters {
    filters {
      id
      name
      categoryId
      options {
        id
        value
      }
    }
  }
`

export default async function ProductsDashboardPage() {
  const response = await getClient().query<{
    filters: Filter[]
  }>({
    query: GET_FILTERS,
  })

  const filters = response.data.filters

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Produtos</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de um produto.
        </p>
      </div>
      <Separator />
      <ProductsMain filters={filters} />
    </div>
  )
}
