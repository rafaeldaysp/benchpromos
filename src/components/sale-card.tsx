import dayjs from 'dayjs'
import Image from 'next/image'
import Link from 'next/link'

import { CopyButton } from '@/components/copy-button'
import { Icons } from '@/components/icons'
import { ReactionButton } from '@/components/reaction-button'
import { ReactionMenu } from '@/components/reaction-menu'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
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

interface SaleCardProps {
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
    reactions: {
      content: string
      users: {
        id: string
      }[]
    }[]
  }
}

export function SaleCard({ sale }: SaleCardProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="flex h-full flex-col gap-4 rounded-lg border p-2.5">
          <div className="flex-1 space-y-4">
            <header className="flex items-center text-sm">
              <span className="flex-1">{sale.category.name}</span>
              {sale.label && (
                <Badge className="bg-amber-200 text-black dark:bg-amber-200">
                  {sale.label}
                </Badge>
              )}
              <span className="flex-1 text-end">
                {dayjs(sale.createdAt).fromNow()}
              </span>
            </header>

            <div>
              <Link href={`/promocao/${sale.id}/${sale.slug}`}>
                {sale.title}
              </Link>
            </div>

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
              <div>
                <p className="line-clamp-3 text-sm tracking-wide text-muted-foreground ">
                  {sale.caption}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-x-2">
              <span>
                <strong className="text-2xl">
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
                <div className="flex items-center overflow-hidden rounded-full border-2 bg-amber-200 pl-2 text-black dark:bg-amber-200">
                  <Icons.Tag className="mr-2 h-4 w-4 text-primary" />
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
                className={cn(buttonVariants(), 'w-full rounded-full')}
              >
                <span className="mr-2">ACESSAR</span>
                <Icons.ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          <footer className="flex items-end justify-between">
            <div className="flex items-center gap-x-0.5">
              {sale.reactions.map((reaction) => (
                <ReactionButton
                  key={reaction.content}
                  saleId={sale.id}
                  reaction={reaction.content}
                  initialUsers={reaction.users}
                />
              ))}
            </div>

            <Link
              href={`/promocao/${sale.id}/${sale.slug}#comments`}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
            >
              <span className="mr-1 text-sm">{sale.comments.length}</span>
              <Icons.MessageCircle className="h-4 w-4" />
            </Link>
          </footer>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex gap-2">
            <Icons.SmilePlus className="h-4 w-4" />
            <span>Reagir</span>
          </ContextMenuSubTrigger>
          <ReactionMenu saleId={sale.id} />
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
