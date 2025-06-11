'use client'

import Link from 'next/link'
import { useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { type Sale } from '@/types'
import { Icons } from '../icons'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'

interface SalesByReactionsProps {
  data: {
    sale: Sale
    _count: {
      reactions: number
      comments: number
    }
  }[]
}

export function SalesByReactions({ data }: SalesByReactionsProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const pages = Math.ceil(data.length / 5)
  const paginatedData = data.slice(
    (currentPage - 1) * 5,
    (currentPage - 1) * 5 + 5,
  )
  return (
    <Card id="#salesByReaction">
      <CardHeader>
        <CardTitle>Promoções em destaque</CardTitle>
        <CardDescription>
          Página {currentPage} de {pages}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <ScrollArea className="h-[320px]">
          <div className="space-y-8 px-6">
            {paginatedData.map((saleData) => (
              <div key={saleData.sale.id} className="flex items-center">
                <Avatar className="size-9">
                  <AvatarImage src={saleData.sale.imageUrl} alt="Avatar" />
                  <AvatarFallback>N/A</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <Link
                    href={`/promocao/${saleData.sale.slug}/${saleData.sale.id}`}
                    className="text-sm transition-colors hover:text-primary"
                    target="_blank"
                  >
                    {saleData.sale.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {saleData._count.reactions} reações e{' '}
                    {saleData._count.comments} comentários
                  </p>
                </div>
                <div className="ml-auto font-medium">
                  +{saleData._count.comments + saleData._count.reactions}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-center justify-center">
          <Button
            variant={'ghost'}
            size={'icon'}
            disabled={currentPage == 1}
            onClick={() => setCurrentPage(1)}
          >
            <Icons.ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant={'ghost'}
            size={'icon'}
            disabled={currentPage == 1}
            onClick={() => setCurrentPage((v) => v - 1)}
          >
            <Icons.ChevronLeft className="size-4" />
          </Button>
          <Button
            variant={'ghost'}
            size={'icon'}
            disabled={currentPage == pages}
            onClick={() => setCurrentPage((v) => v + 1)}
          >
            <Icons.ChevronRight className="size-4" />
          </Button>
          <Button
            variant={'ghost'}
            size={'icon'}
            disabled={currentPage == pages}
            onClick={() => setCurrentPage(pages)}
          >
            <Icons.ChevronsRight className="size-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
