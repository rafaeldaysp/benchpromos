'use client'

import { gql, useSuspenseQuery } from '@apollo/client'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'

import { useQueryString } from '@/hooks/use-query-string'
import { type Category } from '@/types'
import { Icons } from '../icons'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Toggle } from '../ui/toggle'

const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      slug
      name
      id
    }
  }
`

export function SalesNav() {
  const [isPending, startTransition] = React.useTransition()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selectedCategories = new Set(
    searchParams.get('categories')?.split('.') ?? [],
  )
  const { createQueryString } = useQueryString()

  const { data } = useSuspenseQuery<{
    categories: Pick<Category, 'id' | 'name' | 'slug'>[]
  }>(GET_CATEGORIES)

  const categories = data?.categories ?? []

  const [scrollIndex, setScrollIndex] = React.useState(0)
  const optionsRef = React.useRef<HTMLDivElement>(null)
  const handlePrevClick = () => {
    if (scrollIndex > 0) {
      setScrollIndex(scrollIndex - 1)
    }
  }

  const handleNextClick = () => {
    if (optionsRef.current) {
      const containerWidth = optionsRef.current.offsetWidth
      const optionsWidth = optionsRef.current.scrollWidth

      if (containerWidth * (scrollIndex + 1) < optionsWidth) {
        setScrollIndex(scrollIndex + 1)
      }
    }
  }

  return (
    <div className="flex w-full flex-col justify-between gap-4 sm:flex-row">
      <div className="flex w-full items-center space-x-2 sm:w-[65%] md:w-[70%] lg:w-[80%] xl:w-[83%]">
        <Button
          size={'sm'}
          variant={'outline'}
          onClick={handlePrevClick}
          disabled={scrollIndex === 0}
          className="hidden sm:inline-flex"
        >
          <Icons.ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="overflow-x-scroll sm:overflow-hidden" id="scroll">
          <div
            className="flex gap-x-2 transition-transform duration-300"
            style={{ transform: `translateX(-${scrollIndex * 100}%)` }}
            ref={optionsRef}
          >
            {categories.map((category) => (
              <Toggle
                key={category.id}
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
        </div>
        <Button
          size={'sm'}
          variant={'outline'}
          onClick={handleNextClick}
          className="hidden sm:inline-flex"
          disabled={
            optionsRef.current
              ? optionsRef.current.offsetWidth * (scrollIndex + 1) >=
                optionsRef.current.scrollWidth
              : false
          }
        >
          <Icons.ChevronRight className="h-4 w-4" />
        </Button>
      </div>

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
  )
}
