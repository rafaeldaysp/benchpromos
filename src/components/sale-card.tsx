import dayjs from 'dayjs'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'

import { getCurrentUser } from '@/app/_actions/user'
import { CopyButton } from '@/components/copy-button'
import { Icons } from '@/components/icons'
import { ReactionButton } from '@/components/reaction-button'
import { ReactionMenu } from '@/components/reaction-menu'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { cn } from '@/lib/utils'
import { priceFormatter } from '@/utils/formatter'

interface SaleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  sale: {
    id: string
    title: string
    slug: string
    imageUrl: string
    url: string
    price: number
    installments?: number
    totalInstallmentPrice?: number
    caption?: string
    review?: string
    label?: string
    coupon?: string
    cashback?: string
    createdAt: string
    productSlug?: string
    category: {
      name: string
      slug: string
    }
    comments: {
      id: string
    }[]
    reactions: { content: string; users: { id: string }[] }[]
  }
}

export async function SaleCard({ sale, className, ...props }: SaleCardProps) {
  const user = await getCurrentUser()
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card
          className={cn('flex flex-col overflow-hidden', className)}
          {...props}
        >
          <CardHeader className="flex-row items-center text-sm">
            <span className="flex-1">{sale.category.name}</span>
            {sale.label && (
              <Badge
                variant="outline"
                className="bg-amber-200 text-black dark:bg-amber-200"
              >
                {sale.label}
              </Badge>
            )}
            <span className="flex-1 text-end">
              {dayjs(sale.createdAt).fromNow()}
            </span>
          </CardHeader>

          <CardContent className="flex-1 space-y-2.5">
            <CardTitle>
              <Link href={`/promocao/${sale.id}/${sale.slug}`}>
                {sale.title}
              </Link>
            </CardTitle>

            <div>
              <Link href={`/promocao/${sale.id}/${sale.slug}`}>
                <div className="relative mx-auto aspect-square w-8/12">
                  <Image
                    src={sale.imageUrl}
                    alt={sale.title}
                    className="rounded-lg object-contain"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              </Link>
            </div>

            {sale.caption && (
              <CardDescription className="line-clamp-3">
                {sale.caption}
              </CardDescription>
            )}

            <div className="flex flex-col">
              <span>
                <strong className="text-xl">
                  {priceFormatter.format(sale.price / 100)}
                </strong>{' '}
                à vista
              </span>

              {sale.installments && sale.totalInstallmentPrice && (
                <span className="text-sm text-muted-foreground">
                  ou{' '}
                  <strong>
                    {priceFormatter.format(sale.totalInstallmentPrice / 100)}
                  </strong>{' '}
                  em até <strong>{sale.installments}x</strong> de{' '}
                  <strong>
                    {priceFormatter.format(
                      sale.totalInstallmentPrice / (100 * sale.installments),
                    )}
                  </strong>
                </span>
              )}
            </div>

            {sale.coupon && (
              <div>
                <span>Com cupom</span>
                <div className="flex items-center overflow-hidden rounded-full border bg-amber-200 pl-2 text-black dark:bg-amber-200">
                  <Icons.Tag className="mr-2 h-4 w-4" />
                  <span className="flex-1 overflow-hidden text-sm font-medium uppercase tracking-widest">
                    {sale.coupon}
                  </span>
                  <CopyButton
                    value={sale.coupon}
                    variant="ghost"
                    className="hover:bg-inherit hover:text-inherit"
                  />
                </div>
              </div>
            )}

            <div>
              <a
                href={sale.url}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'w-full rounded-full',
                )}
              >
                <span className="mr-2">ACESSAR</span>
                <Icons.ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between gap-x-2">
            <div className="flex flex-wrap gap-1">
              {sale.reactions.map((reaction) => (
                <ReactionButton
                  key={reaction.content}
                  saleId={sale.id}
                  userId={user?.id}
                  reaction={reaction.content}
                  users={reaction.users}
                />
              ))}
            </div>

            <Link
              href={`/promocao/${sale.id}/${sale.slug}#comments`}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'shrink-0',
              )}
            >
              <span className="mr-1 text-sm">{sale.comments.length}</span>
              <Icons.MessageCircle className="h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex gap-2">
            <Icons.SmilePlus className="h-4 w-4" />
            <span>Reagir</span>
          </ContextMenuSubTrigger>
          <ReactionMenu saleId={sale.id} userId={user?.id} />
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuItem asChild>
          <Link href={`/promocao/${sale.id}/${sale.slug}`}>
            <Icons.GanttChartSquare className="mr-2 h-4 w-4" />
            <span>Mais detalhes</span>
          </Link>
        </ContextMenuItem>

        {sale.productSlug && (
          <ContextMenuItem asChild>
            <Link href={`/${sale.category.slug}/${sale.productSlug}`}>
              <Icons.Eye className="mr-2 h-4 w-4" />
              <span>Ver produto</span>
            </Link>
          </ContextMenuItem>
        )}

        <ContextMenuItem asChild>
          <Link href={`/promocao/${sale.id}/${sale.slug}#comments`}>
            <Icons.MessageCircle className="mr-2 h-4 w-4" />
            <span>Comentários</span>
          </Link>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
