import dayjs from 'dayjs'
import Image from 'next/image'
import Link from 'next/link'

import { CopyButton } from '@/components/copy-button'
import { Icons } from '@/components/icons'
import { ReactionButton } from '@/components/reaction-button'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
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
    category: {
      name: string
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
    <div className="flex h-full flex-col gap-4 rounded-lg border p-2">
      <div className="flex-1 space-y-4">
        <header className="flex items-center text-sm">
          <span className="flex-1">{sale.category.name}</span>
          {sale.label && <Badge variant="secondary">{sale.label}</Badge>}
          <span className="flex-1 text-end">
            {dayjs(sale.createdAt).fromNow()}
          </span>
        </header>

        <div>
          <Link
            href={`/promocao/${sale.id}/${sale.slug}`}
            className="cursor-pointer hover:text-primary"
          >
            {sale.title}
          </Link>
        </div>

        <div>
          <Link
            href={`/promocao/${sale.id}/${sale.slug}`}
            className="cursor-pointer"
          >
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
            <p className="text-muted-foreground">{sale.caption}</p>
          </div>
        )}

        <div className="flex flex-col gap-x-2">
          <span>
            <strong className="text-2xl">
              {priceFormatter.format(sale.price / 100)}
            </strong>{' '}
            à vista
          </span>

          {sale.totalInstallmentPrice && sale.installments && (
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
            <div className="flex items-center overflow-hidden rounded-full border bg-secondary pl-2 text-secondary-foreground">
              <Icons.Tag className="mr-2 h-4 w-4" />
              <span className="flex-1 uppercase tracking-widest">
                {sale.coupon}
              </span>
              <CopyButton value={sale.coupon} variant="ghost" />
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
              initialUsers={reaction.users}
              saleId={sale.id}
              reaction={reaction.content}
            />
          ))}
        </div>

        <Link
          href={`/promocao/${sale.id}/${sale.slug}#comments`}
          className="flex items-center justify-between gap-x-1 hover:text-primary"
        >
          <span className="text-sm">{sale.comments.length}</span>
          <Icons.MessageCircle className="h-5 w-5" />
        </Link>
      </footer>
    </div>
  )
}
