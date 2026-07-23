import Link from 'next/link'

import { getCurrentUser } from '@/app/_actions/user'
import { Combobox } from '@/components/combobox'
import { ModeToggle } from '@/components/mode-toggle'
import { buttonVariants } from '@/components/ui/button'
import { UserAccountNav } from '@/components/user-account-nav'
import { MainNav } from './main-nav'
import { getClient } from '@/lib/apollo'
import { type Category } from '@/types'
import { gql } from '@apollo/client'
import { cn } from '@/lib/utils'

const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      name
      slug
    }
  }
`

export async function SiteHeader() {
  const user = await getCurrentUser()

  const { data } = await getClient().query<{
    categories: Pick<Category, 'name' | 'slug'>[]
  }>({
    query: GET_CATEGORIES,
  })

  const categories = data?.categories ?? []
  // const options = await headerOptions()

  return (
    <header className="sticky top-0 z-40 w-full bg-background">
      <div className="container flex h-14 items-center gap-2 max-sm:px-4 sm:gap-3">
        <MainNav categories={categories} />

        <div className="flex min-w-0 flex-1 justify-end">
          <nav className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-2.5">
            <Combobox />

            {user ? (
              <UserAccountNav user={user} />
            ) : (
              <>
                <ModeToggle />
                <Link
                  href="/sign-in"
                  className={cn(
                    buttonVariants({ variant: 'secondary' }),
                    'h-10',
                  )}
                >
                  Entrar
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
      <div className="h-1 w-full bg-gradient-to-r from-background via-primary to-background" />
    </header>
  )
}
