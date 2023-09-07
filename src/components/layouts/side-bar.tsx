'use client'

import Image from 'next/image'
import Link from 'next/link'

import { siteConfig } from '@/config/site'
import { externalLinkOptions } from '@/constants/index'
import Logo from '@/public/logo-benchpromos.svg'
import { type headerOption } from '@/types'
import { Icons } from '../icons'
import { ScrollArea } from '../ui/scroll-area'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '../ui/sheet'

interface SideBarProps {
  options: headerOption[]
}

export function SideBar({ options }: SideBarProps) {
  const optionsWithoutContent = options.filter((option) => !option.content)

  return (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger className="flex h-max items-center">
          <Icons.Menu />
        </SheetTrigger>

        <SheetContent side={'left'} className="space-y-2.5">
          <SheetHeader>
            <SheetClose asChild>
              <Link
                aria-label="Home"
                href="/"
                className="flex items-center gap-2"
              >
                <div className="relative aspect-square h-8 select-none">
                  <Image
                    src={Logo}
                    alt="Logo"
                    className="object-contain"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>

                <span className="font-bold">{siteConfig.name}</span>
              </Link>
            </SheetClose>
          </SheetHeader>
          <ScrollArea className="-mr-6 h-full pb-10">
            <div className="flex flex-1 flex-col px-10 max-sm:overflow-y-auto">
              <div className="flex flex-col space-y-2.5">
                {optionsWithoutContent.map((option) => (
                  <SheetClose key={option.title} asChild>
                    <Link className="font-medium" href={`/${option.slug}`}>
                      {option.title}
                    </Link>
                  </SheetClose>
                ))}
                {externalLinkOptions.map((option) => (
                  <a
                    key={option.title}
                    className="font-medium"
                    href={option.slug}
                    target="_blank"
                  >
                    {option.title}
                  </a>
                ))}
              </div>

              {options.map((option) => (
                <div key={option.title} className="flex flex-col space-y-2.5">
                  {option.content && (
                    <>
                      <span className="pt-5 font-medium"> {option.title}</span>
                      {option.content.map((content) => (
                        <SheetClose key={content.slug} asChild>
                          <Link
                            href={`/${content.slug}`}
                            className="text-muted-foreground"
                          >
                            {content.title}
                          </Link>
                        </SheetClose>
                      ))}
                    </>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
