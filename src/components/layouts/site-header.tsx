import Link from 'next/link'

import { getCurrentUser } from '@/app/_actions/user'
import { Combobox } from '@/components/combobox'
import { ModeToggle } from '@/components/mode-toggle'
import { buttonVariants } from '@/components/ui/button'
import { UserAccountNav } from '@/components/user-account-nav'
import { headerOptions } from '@/constants/header'
import { MainNav } from './main-nav'

export async function SiteHeader() {
  const user = await getCurrentUser()
  const options = await headerOptions()

  return (
    <header className="sticky top-0 z-40 w-full bg-background">
      <div className="container flex h-14 items-center max-sm:px-4">
        <MainNav options={options} />

        <div className="flex flex-1 justify-end">
          <nav className="flex items-center space-x-2">
            <Combobox />

            <ModeToggle />

            {user ? (
              <UserAccountNav user={user} />
            ) : (
              <Link
                href="/sign-in"
                className={buttonVariants({ variant: 'secondary' })}
              >
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </div>
      <div className="h-1 w-full bg-gradient-to-r from-background via-primary to-background" />
    </header>
  )
}
