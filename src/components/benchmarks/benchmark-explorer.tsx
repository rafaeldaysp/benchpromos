'use client'

import { gql, useQuery } from '@apollo/client'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

import { cn } from '@/lib/utils'
import { type Benchmark } from '@/types'
import { Icons } from '../icons'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion'
import { buttonVariants } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { useQueryString } from '@/hooks/use-query-string'

const GET_PARENTS = gql`
  query ($getBenchmarksInput: GetBenchmarksInput) {
    benchmarks(getBenchmarksInput: $getBenchmarksInput) {
      name
      id
      childrenCount
      slug
    }
  }
`

export function BenchmarkExplorer({
  root,
}: {
  root: (Benchmark & { childrenCount: number })[]
}) {
  const parents = root?.map((parent) => {
    return <Parent key={parent.id} parent={parent} />
  })

  return parents
}

function Parent({ parent }: { parent: Benchmark & { childrenCount: number } }) {
  if (parent.childrenCount > 0)
    return (
      <Accordion type="single" key={parent.id} collapsible className="py-0">
        <AccordionItem key={parent.id} value={parent.id}>
          <AccordionTrigger
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'h-fit justify-start px-2 hover:no-underline',
            )}
          >
            <Icons.Folder className="size-4 fill-auxiliary text-auxiliary" />
            {parent.name}
          </AccordionTrigger>
          <AccordionContent className="pl-4 pt-1">
            <Children
              parentId={parent.id}
              childrenCount={parent.childrenCount}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    )

  return <File file={parent} />
}

function Children({
  parentId,
  childrenCount,
}: {
  parentId: string
  childrenCount: number
}) {
  const { data, loading } = useQuery<{
    benchmarks: (Benchmark & { childrenCount: number })[]
  }>(GET_PARENTS, {
    variables: {
      getBenchmarksInput: {
        parentId,
      },
    },
  })
  const children = data?.benchmarks

  if (loading) {
    return Array.from({ length: childrenCount }).map((_, i) => (
      <Skeleton key={i} className="h-9 w-full py-2" />
    ))
  }

  return (
    <div className="space-y-1">
      {children?.map((chield) => {
        if (chield.childrenCount > 0)
          return <Parent parent={chield} key={chield.id} />
        return <File file={chield} key={chield.id} />
      })}
    </div>
  )
}

function File({ file }: { file: Benchmark }) {
  const pathname = usePathname()
  const { createQueryString } = useQueryString()
  const params = useSearchParams()

  const products = params.get('products')
  const queryString = '?'.concat(createQueryString({ products }))

  return (
    <Link
      key={file.id}
      href={`/benchmarks/${file.slug}`.concat(queryString)}
      className={cn(
        'flex h-fit min-h-9 w-full items-start justify-start rounded-md p-2 pl-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        {
          'bg-muted': pathname.includes(file.slug),
        },
      )}
    >
      <div className="mr-2 mt-0.5 shrink-0">
        <Icons.MenuSquare className="size-4" />
      </div>
      <span className="min-w-0 flex-1 break-words text-left leading-tight">
        {file.name}
      </span>
    </Link>
  )
}
