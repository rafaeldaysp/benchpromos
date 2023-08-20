'use client'

import * as React from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'

interface MainNavProps {
  options: {
    title: string
    slug?: string
    content?: { title: string; slug: string }[]
  }[]
}

export function MainNav({ options }: MainNavProps) {
  return (
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
  )
}
