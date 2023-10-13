'use client'

import { gql, useQuery } from '@apollo/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
              'h-fit justify-start hover:no-underline',
            )}
          >
            <Icons.Folder className="h-4 w-4 fill-auxiliary text-auxiliary" />
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

  return (
    <Link
      key={file.id}
      href={`/benchmarks/${file.slug}`}
      className={cn(
        buttonVariants({ variant: 'ghost' }),
        'h-fit w-full justify-start space-x-2 pl-10',
        {
          'bg-muted': pathname.includes(file.slug),
        },
      )}
    >
      <div>
        <Icons.MenuSquare className="h-4 w-4" />
      </div>
      <span className="line-clamp-3">{file.name}</span>
    </Link>
  )
}
