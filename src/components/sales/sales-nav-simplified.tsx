'use client'

import { gql, useSuspenseQuery } from '@apollo/client'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'

import { MIN_SALES_DT } from '@/constants'
import { useQueryString } from '@/hooks/use-query-string'
import { type Category } from '@/types'
import { Label } from '../ui/label'
import { ScrollArea, ScrollBar } from '../ui/scroll-area'
import { Switch } from '../ui/switch'
import { Toggle } from '../ui/toggle'

const GET_CATEGORIES_RANK = gql`
  query getCategoriesRank($minDt: Date) {
    salesCategoryRank(minDt: $minDt) {
      name
      slug
    }
  }
`

export function SalesNavSimplified() {
  const [isPending, startTransition] = React.useTransition()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selectedCategories = new Set(
    searchParams.get('categories')?.split('.') ?? [],
  )
  const { createQueryString } = useQueryString()

  const { data } = useSuspenseQuery<{
    salesCategoryRank: Pick<Category, 'name' | 'slug'>[]
  }>(GET_CATEGORIES_RANK, {
    variables: {
      minDt: MIN_SALES_DT,
    },
  })

  const categories = data.salesCategoryRank

  return (
    <div className="flex w-full flex-col justify-between gap-4 sm:flex-row">
      <div className="flex w-full items-center gap-x-2">
        <ScrollArea className="flex-1">
          <div className="flex w-fit gap-x-2 ">
            {categories.map((category) => (
              <Toggle
                key={category.slug}
                variant={'outline'}
                size={'sm'}
                className="min-w-max"
                disabled={isPending}
                pressed={selectedCategories.has(category.slug)}
                onPressedChange={() => {
                  const setted = selectedCategories.has(category.slug)
                  startTransition(() => {
                    if (setted) {
                      selectedCategories.delete(category.slug)
                    } else {
                      selectedCategories.add(category.slug)
                    }

                    const value = selectedCategories.size
                      ? Array.from(selectedCategories).join('.')
                      : null

                    router.push(
                      `${pathname}?${createQueryString({
                        categories: value,
                      })}`,
                    )
                  })
                }}
              >
                {category.name}
              </Toggle>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <div className="flex items-center justify-between gap-x-2">
          <Label className="w-max text-sm" htmlFor="showExpired">
            Mostrar expiradas
          </Label>
          <Switch
            id="showExpired"
            defaultChecked={searchParams.get('expired') ? true : false}
            onCheckedChange={(value) =>
              startTransition(() => {
                router.push(
                  `${pathname}?${createQueryString({
                    expired: value ? 'true' : null,
                  })}`,
                )
              })
            }
          />
        </div>
      </div>
    </div>
  )
}
