'use client'

import { usePathname, useRouter } from 'next/navigation'
import * as React from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useQueryString } from '@/hooks/use-query-string'

interface BlogFiltersProps {
  categories: string[]
  initialCategory?: string
}

export function BlogFilters({ categories, initialCategory }: BlogFiltersProps) {
  const [selectedCategory, setSelectedCategory] =
    React.useState(initialCategory)
  // const [search, setSearch] = React.useState('')
  const [isPending, startTransition] = React.useTransition()
  const router = useRouter()
  const { createQueryString } = useQueryString()
  const pathname = usePathname()

  React.useEffect(() => {
    if (!selectedCategory) return

    startTransition(() => {
      router.push(
        `${pathname}?${createQueryString({
          category: selectedCategory == 'all' ? null : selectedCategory,
        })}`,
      )
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory])

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      {/* <Input
        placeholder="Pesquisar blogs..."
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      /> */}
      <Select
        value={selectedCategory}
        onValueChange={setSelectedCategory}
        defaultValue="all"
        disabled={isPending}
      >
        <SelectTrigger className="line-clamp-1 w-full sm:w-[300px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          <SelectItem value="all">Todas categorias</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* <CategoryFilterPopover
        categoryFilter={{
          name: 'Tag 1',
          slug: 'Tags',
          options: [{ slug: 'tag 1', value: 'tag 1' }],
        }}
        initialFilterOptions={[]}
      /> */}
    </div>
  )
}
