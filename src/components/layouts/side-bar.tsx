import Image from 'next/image'
import Link from 'next/link'

import { siteConfig } from '@/config/site'
import { externalLinkOptions } from '@/constants/index'
import Logo from '@/public/LOGO BENCHPROMOS SITE_48.png'
import { type headerOption } from '@/types'
import { Icons } from '../icons'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from '../ui/sheet'

interface SideBarProps {
  options: headerOption[]
}

export function SideBar({ options }: SideBarProps) {
  const optionsWithoutContent = options.filter((option) => !option.content)

  return (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger>
          <Button variant={'link'} className="select-none p-0 text-foreground ">
            <Icons.Menu className="" />
          </Button>
        </SheetTrigger>

        <SheetContent side={'left'} className="space-y-2.5">
          <SheetHeader>
            <Link aria-label="Home" href="/" className="flex items-center">
              <div className="relative -ml-2 aspect-square h-12 select-none">
                <Image
                  src={Logo}
                  alt="Logo"
                  className="object-contain py-2"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>

              <span className="font-bold">{siteConfig.name}</span>
            </Link>
          </SheetHeader>
          <ScrollArea className="-mr-6 h-full pb-10">
            <div className="flex flex-1 flex-col px-10 max-sm:overflow-y-auto">
              <div className="flex flex-col space-y-2.5">
                {optionsWithoutContent.map((option) => (
                  <Link
                    key={option.title}
                    className="font-medium"
                    href={`/${option.slug}`}
                  >
                    {option.title}
                  </Link>
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
                        <Link
                          key={content.slug}
                          href={`/${content.slug}`}
                          className="text-muted-foreground"
                        >
                          {content.title}
                        </Link>
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
