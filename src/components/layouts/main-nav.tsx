'use client'

import Image from 'next/image'
import Link from 'next/link'

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'
import Logo from '@/public/logo.png'

interface MainNavProps {
  options: {
    title: string
    slug?: string
    content?: { title: string; slug: string }[]
  }[]
}

export function MainNav({ options }: MainNavProps) {
  return (
    <div className="hidden gap-x-6 lg:flex">
      <Link aria-label="Home" href="/" className="flex items-center">
        <div className="relative aspect-square h-12">
          <Image
            src={Logo}
            alt="Logo"
            className="object-contain py-2"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* <Icons.Logo className="h-6 w-6" aria-hidden="true" /> */}
        <span className="hidden font-bold lg:inline-block">
          {siteConfig.name}
        </span>
      </Link>
      <NavigationMenu>
        <NavigationMenuList>
          {options.map((option) => (
            <NavigationMenuItem key={option.title}>
              {option.content ? (
                <>
                  <NavigationMenuTrigger className="px-3">
                    {option.title}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[500px]">
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
                <NavigationMenuLink
                  className={navigationMenuTriggerStyle()}
                  href={option.slug}
                >
                  {option.title}
                </NavigationMenuLink>
              )}
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}
