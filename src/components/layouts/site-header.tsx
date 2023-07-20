import Link from 'next/link'

import { getCurrentUser } from '@/app/_actions/get-current-user'
import { Combobox } from '@/components/combobox'
import { SignInButton } from '@/components/sign-in-button'
import { UserAccountNav } from '@/components/user-account-nav'

export async function SiteHeader() {
  const user = await getCurrentUser()

  return (
    <header className="supports-backdrop-blur:bg-background/60 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        {/* <MainNav /> */}
        {/* MobileNav /> */}
        <div>
          <Link href="/" className="font-bold">
            Bench Promos
          </Link>
        </div>

        <div className="flex flex-1 justify-end">
          <nav className="flex items-center space-x-2">
            <Combobox />

            {user ? (
              <UserAccountNav
                user={{
                  name: user.name,
                  image: user.image,
                  email: user.email,
                }}
              />
            ) : (
              <SignInButton />
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
