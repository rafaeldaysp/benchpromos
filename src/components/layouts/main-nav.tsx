'use client'

import Image from 'next/image'
import Link from 'next/link'

import Logo from '@/assets/logo-benchpromos.svg'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { siteConfig } from '@/config/site'
import { headerOptions } from '@/constants/header'
import { cn } from '@/lib/utils'
import { type Category } from '@/types'
import { SideBar } from './sidebar-nav'

interface MainNavProps {
  categories: Pick<Category, 'name' | 'slug'>[]
}

export function MainNav({ categories }: MainNavProps) {
  const options = headerOptions({ categories })
  return (
    <div className="flex items-center gap-x-1 lg:gap-x-2.5">
      <SideBar options={options} />
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

        {/* <Icons.Logo className="h-6 w-6" aria-hidden="true" /> */}
        <strong className="hidden text-sm sm:inline-flex sm:text-base">
          {siteConfig.name}
        </strong>
      </Link>
      <NavigationMenu className="max-lg:hidden">
        <NavigationMenuList>
          {options.map((option) => (
            <NavigationMenuItem key={option.title}>
              {option.content ? (
                <>
                  <NavigationMenuTrigger>
                    {option.icon && <option.icon className="mr-1 h-4 w-4" />}
                    {option.title}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-2 p-2 md:w-[500px] md:grid-cols-3">
                      {option.content.map((suboption) => (
                        <li key={suboption.slug}>
                          <NavigationMenuLink asChild>
                            <Link
                              href={`/${suboption.slug}`}
                              className={cn(
                                navigationMenuTriggerStyle(),
                                'w-full justify-start',
                              )}
                            >
                              {suboption.title}
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </>
              ) : (
                <NavigationMenuLink asChild>
                  <Link
                    className={navigationMenuTriggerStyle()}
                    href={`/${option.slug}` ?? '/'}
                  >
                    {option.icon && <option.icon className="mr-1 h-4 w-4" />}
                    {option.title}
                  </Link>
                </NavigationMenuLink>
              )}
            </NavigationMenuItem>
          ))}
          <NavigationMenuIndicator>
            <div className="relative top-[70%] h-[10px] w-[10px] rotate-[45deg] rounded-tl-[2px]" />
          </NavigationMenuIndicator>
        </NavigationMenuList>
        <NavigationMenuViewport />
      </NavigationMenu>
    </div>
  )
}
