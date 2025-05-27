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
import { Icons } from '../icons'

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
      <div className="container flex h-14 items-center max-sm:px-4">
        <MainNav categories={categories} />

        <div className="flex flex-1 justify-end">
          <nav className="flex items-center space-x-2">
            <Combobox />

            <div className="lg:hidden">
              <Link
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'icon' }),
                )}
                href={'/benchmarks'}
              >
                <Icons.BarChart4 className="h-4 w-4" />
                <span className="sr-only">Change theme</span>
              </Link>
            </div>

            <ModeToggle />

            {user ? (
              <UserAccountNav user={user} />
            ) : (
              <Link
                href="/sign-in"
                className={buttonVariants({ variant: 'secondary' })}
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </div>
      <div className="h-1 w-full bg-gradient-to-r from-background via-primary to-background" />
    </header>
  )
}
