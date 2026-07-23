'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import Logo from '@/assets/logo-benchpromos.svg'
// import LogoXmas from '@/assets/logo-natalina.svg'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { siteConfig } from '@/config/site'
import { headerOptions } from '@/constants/header'
import { cn } from '@/lib/utils'
import { type Category } from '@/types'
import { SidebarNav } from './sidebar-nav'

interface MainNavProps {
  categories: Pick<Category, 'name' | 'slug'>[]
}

export function MainNav({ categories }: MainNavProps) {
  const options = headerOptions({ categories })
  const pathname = usePathname()

  const navItemClassName =
    'relative h-10 px-2.5 transition-[background-color,color,transform] after:absolute after:inset-x-2 after:-bottom-[8px] after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-primary after:opacity-0 after:transition-[opacity,transform] hover:after:scale-x-50 hover:after:opacity-40 active:scale-[0.96] data-[active]:after:scale-x-100 data-[active]:after:opacity-100'

  const iconlessDesktopLinks = new Set([
    'Benchmarks',
    'Recomendações',
    'Sorteios',
  ])

  const aliasesBySlug: Record<string, string[]> = {
    'tier-lists': ['/recommendations', '/recomendacoes'],
    sorteios: ['/giveaways'],
  }

  const isPathActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`)

  const pathsForSlug = (slug: string) => [
    `/${slug}`,
    ...(aliasesBySlug[slug] ?? []),
  ]

  const isOptionActive = (option: (typeof options)[number]) => {
    if (option.slug && pathsForSlug(option.slug).some(isPathActive)) {
      return true
    }

    return (
      option.content?.some((suboption) =>
        pathsForSlug(suboption.slug).some(isPathActive),
      ) ?? false
    )
  }

  return (
    <div className="flex shrink-0 items-center gap-x-1.5 lg:gap-x-2.5">
      <SidebarNav options={options} />
      <Link
        aria-label="Home"
        href="/"
        className="flex items-center gap-x-1.5 sm:gap-x-2"
      >
        <div className="relative aspect-square h-[30px] select-none">
          <Image
            src={Logo}
            alt="Logo"
            className="object-contain"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        <strong className="hidden whitespace-nowrap text-sm font-semibold leading-none xl:inline-flex 2xl:text-base">
          {siteConfig.name}
        </strong>
      </Link>
      <NavigationMenu className="max-xl:hidden">
        <NavigationMenuList className="space-x-0.5">
          {options.map((option) => {
            const isActive = isOptionActive(option)

            return (
              <NavigationMenuItem key={option.title}>
                {option.content ? (
                  <>
                    <NavigationMenuTrigger
                      className={navItemClassName}
                      data-active={isActive ? '' : undefined}
                    >
                      {option.icon && <option.icon className="mr-1 size-4" />}
                      {option.title}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-2 p-2 md:w-[500px] md:grid-cols-3">
                        {option.content.map((suboption) => {
                          const isSuboptionActive = pathsForSlug(
                            suboption.slug,
                          ).some(isPathActive)

                          return (
                            <li key={suboption.slug}>
                              <NavigationMenuLink asChild>
                                <Link
                                  href={`/${suboption.slug}`}
                                  data-active={
                                    isSuboptionActive ? '' : undefined
                                  }
                                  className={cn(
                                    navigationMenuTriggerStyle(),
                                    'w-full justify-start data-[active]:bg-accent data-[active]:text-accent-foreground',
                                  )}
                                >
                                  {suboption.title}
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          )
                        })}
                      </ul>
                    </NavigationMenuContent>
                  </>
                ) : (
                  <NavigationMenuLink asChild>
                    <Link
                      className={cn(
                        navigationMenuTriggerStyle(),
                        navItemClassName,
                      )}
                      data-active={isActive ? '' : undefined}
                      href={`/${option.slug}`}
                    >
                      {option.icon &&
                        !iconlessDesktopLinks.has(option.title) && (
                          <option.icon className="mr-1 size-4" />
                        )}
                      {option.title}
                    </Link>
                  </NavigationMenuLink>
                )}
              </NavigationMenuItem>
            )
          })}
          <NavigationMenuIndicator>
            <div className="relative top-[70%] size-[10px] rotate-45 rounded-tl-[2px]" />
          </NavigationMenuIndicator>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}
