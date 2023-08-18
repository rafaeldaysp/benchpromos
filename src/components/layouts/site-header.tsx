import Link from 'next/link'

import { getCurrentUser } from '@/app/_actions/user'
import { Combobox } from '@/components/combobox'
import { ModeToggle } from '@/components/mode-toggle'
import { buttonVariants } from '@/components/ui/button'
import { UserAccountNav } from '@/components/user-account-nav'
import { MainNav } from './main-nav'

export async function SiteHeader() {
  const user = await getCurrentUser()

  return (
    <header className="supports-backdrop-blur:bg-background/60 z-40 border-b bg-background/95 backdrop-blur">
      {/* MobileNav /> */}

      <div className="container flex h-14 items-center justify-between gap-x-4">
        <div>
          <Link href="/" className="font-bold">
            Bench Promos
          </Link>
        </div>

        <div className="flex flex-1 justify-between">
          <MainNav />

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
    </header>
  )
}
