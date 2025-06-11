'use client'

import Image from 'next/image'
import Link from 'next/link'

import Logo from '@/assets/logo-benchpromos.svg'
import { Icons } from '@/components/icons'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'
import { type headerOption } from '@/types'

interface SideBarProps {
  options: headerOption[]
}

export function SidebarNav({ options }: SideBarProps) {
  const optionsWithoutContent = options.filter((option) => !option.content)

  return (
    <div className="xl:hidden">
      <Sheet>
        <SheetTrigger className="flex h-max items-center">
          <Icons.Menu />
        </SheetTrigger>

        <SheetContent side={'left'} className="w-3/4 space-y-3">
          <SheetHeader>
            <SheetClose asChild>
              <Link
                aria-label="Home"
                href="/"
                className="flex items-center gap-2"
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

                <strong className="text-sm sm:text-base">
                  {siteConfig.name}
                </strong>
              </Link>
            </SheetClose>
          </SheetHeader>
          <ScrollArea className="-mr-6 h-full pb-10">
            <div className="flex flex-1 flex-col px-[18px]">
              <div className="flex flex-col space-y-3">
                {optionsWithoutContent.map((option) => (
                  <SheetClose key={option.title} asChild>
                    <Link
                      className="flex items-center gap-1 font-medium hover:text-primary"
                      href={`/${option.slug}`}
                    >
                      {option.icon && <option.icon className="size-4" />}
                      {option.title}
                    </Link>
                  </SheetClose>
                ))}
              </div>

              {options.map((option) => (
                <div key={option.title} className="flex flex-col space-y-2">
                  {option.content && (
                    <>
                      <span className="flex items-center gap-1 pt-3 font-medium">
                        {option.icon && <option.icon className="size-4" />}
                        {option.title}
                      </span>
                      {option.content.map((content) => (
                        <SheetClose key={content.slug} asChild>
                          <Link
                            href={`/${content.slug}`}
                            className={cn(
                              'flex items-center gap-1 text-muted-foreground hover:text-primary',
                              { 'ml-5': option.icon },
                            )}
                          >
                            {content.title}
                          </Link>
                        </SheetClose>
                      ))}
                    </>
                  )}
                </div>
              ))}
              {/* <div className="space-y-2.5 pt-2.5">
                {externalLinkOptions.map((option) => (
                  <a
                    key={option.title}
                    className="flex items-center gap-1 font-medium hover:text-primary"
                    href={option.slug}
                    target="_blank"
                  >
                    {option.icon && <option.icon className="h-4 w-4" />}
                    {option.title}
                  </a>
                ))}
              </div> */}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
