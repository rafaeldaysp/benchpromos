import Link from 'next/link'

import { getCurrentUser } from '@/app/_actions/user'
import { Combobox } from '@/components/combobox'
import { ModeToggle } from '@/components/mode-toggle'
import { buttonVariants } from '@/components/ui/button'
import { UserAccountNav } from '@/components/user-account-nav'
import { headerOptions } from '@/constants/header'
import { MainNav } from './main-nav'
import Image from 'next/image'
import Logo from '@/public/logo.png'

export async function SiteHeader() {
  const user = await getCurrentUser()
  const options = await headerOptions()

  return (
    <header className="supports-backdrop-blur:bg-background/60 z-40 border-b bg-background/95 backdrop-blur">
      {/* MobileNav /> */}

      <div className="container flex h-14 items-center justify-between gap-x-4">
        <Link href="/" className="flex items-center text-sm font-bold">
          <div className="relative aspect-square h-14">
            <Image
              src={Logo}
              alt="Logo"
              className="object-contain py-2"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          Bench Promos
        </Link>

        <div className="flex flex-1 justify-between">
          <MainNav options={options} />

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
