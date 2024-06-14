import { gql } from '@apollo/client'
import { useSuspenseQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import * as React from 'react'
import { InView } from 'react-intersection-observer'

import { Icons } from '@/components/icons'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { env } from '@/env.mjs'
import { cn } from '@/lib/utils'
import { removeNullValues } from '@/utils'
import { Button } from './ui/button'

const USERS_PER_PAGE = 12

const GET_USERS = gql`
  query GetUsers($getUsersInput: GetUsersInput) {
    users(getUsersInput: $getUsersInput) {
      count
      list {
        id
        name
        email
        image
        role
      }
    }
  }
`

interface DashboardUsersProps {
  children: (data: {
    users: {
      id: string
      name: string
      email: string
      image: string
      role: 'USER' | 'MOD' | 'ADMIN'
    }[]
  }) => React.ReactNode
}

export function DashboardUsers({ children }: DashboardUsersProps) {
  const [isPending, startTransition] = React.useTransition()
  const [searchInput, setSearchInput] = React.useState('')
  const [query, setQuery] = React.useState('')

  const { data, fetchMore } = useSuspenseQuery<{
    users: {
      count: number
      list: {
        id: string
        name: string
        email: string
        image: string
        role: 'USER' | 'MOD' | 'ADMIN'
      }[]
    }
  }>(GET_USERS, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    fetchPolicy: 'cache-and-network',
    refetchWritePolicy: 'overwrite',
    variables: {
      getUsersInput: {
        search: query,
        pagination: {
          limit: USERS_PER_PAGE,
          page: 1,
        },
      },
    },
  })

  const users = data?.users.list.map(removeNullValues)
  const count = data?.users.count
  const page = Math.ceil(users.length / USERS_PER_PAGE)
  const pageCount = Math.ceil(count / USERS_PER_PAGE)

  function onEntry() {
    startTransition(() => {
      fetchMore({
        context: {
          headers: {
            'api-key': env.NEXT_PUBLIC_API_KEY,
          },
        },
        variables: {
          getUsersInput: {
            search: query,
            pagination: {
              limit: USERS_PER_PAGE,
              page: page + 1,
            },
          },
        },
        updateQuery(previousResult, { fetchMoreResult }) {
          const fetchMorePages = previousResult.users.count
          const previousUsers = previousResult.users.list
          const fetchMoreUsers = fetchMoreResult.users.list

          fetchMoreResult.users.count = fetchMorePages
          fetchMoreResult.users.list = [...previousUsers, ...fetchMoreUsers]

          return { ...fetchMoreResult }
        },
      })
    })
  }

  const hasMoreUsers = page < pageCount

  return (
    <div className="space-y-4">
      <h3 className="font-medium tracking-tight">Usuários • {count}</h3>
      <div className="flex w-full items-center space-x-2">
        <Input
          placeholder="Pesquise por um usuário..."
          className="w-full"
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              setQuery(searchInput)
            }
          }}
        />
        <Button onClick={() => setQuery(searchInput)}>Pesquisar</Button>
      </div>
      {users.length > 0 ? (
        <ScrollArea
          className={cn('rounded-md border', {
            'h-[600px]': users.length > 6,
          })}
        >
          {children({ users })}
          {isPending ? (
            <div className="flex justify-center py-4">
              <Icons.Spinner
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            </div>
          ) : (
            <InView
              as="div"
              delay={500}
              hidden={!hasMoreUsers}
              onChange={(_, entry) => {
                if (entry.isIntersecting) onEntry()
              }}
            />
          )}
        </ScrollArea>
      ) : (
        <div className="flex justify-center">
          <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
        </div>
      )}
    </div>
  )
}
