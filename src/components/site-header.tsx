import Link from 'next/link'

import { UserAccountNav } from '@/components/user-account-nav'
import { SignInButton } from './sign-in-button'
import { getCurrentUser } from '@/app/_actions/get-current-user'

export async function SiteHeader() {
  const user = await getCurrentUser()

  return (
    <header className="supports-backdrop-blur:bg-background/60 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <div>
          <Link href="/" className="font-bold">
            Bench Promos
          </Link>
        </div>

        <nav>
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
    </header>
  )
}
