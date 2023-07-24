import dayjs from 'dayjs'
import Image from 'next/image'

import { CopyButton } from '@/components/copy-button'
import { Icons } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { priceFormatter } from '@/utils/formatter'
import { ReactionButton } from './reaction-button'

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
    <div className="space-y-4 rounded-lg border p-2">
      <header className="flex items-center text-sm">
        <span className="flex-1">{sale.category.name}</span>
        {sale.label && <Badge>{sale.label}</Badge>}
        <span className="flex-1 text-end">
          {dayjs(sale.createdAt).fromNow()}
        </span>
      </header>

      <div>
        <a
          href={`/${sale.id}/${sale.slug}`}
          className="cursor-pointer hover:text-violet-500"
        >
          {sale.title}
        </a>
      </div>

      <div className="relative mx-auto aspect-square w-8/12">
        <a
          href={`/${sale.id}/${sale.slug}`}
          className="cursor-pointer hover:text-violet-500"
        >
          <Image
            src={sale.imageUrl}
            alt={sale.title}
            className="rounded-lg object-contain"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </a>
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

        {sale.totalInstallmentPrice && (
          <span className="text-sm text-muted-foreground">
            ou{' '}
            <strong>
              {priceFormatter.format(sale.totalInstallmentPrice / 100)}
            </strong>{' '}
            em até <strong>{sale.installments}x</strong> de{' '}
            <strong>
              {priceFormatter.format(
                sale.totalInstallmentPrice / (100 * sale.installments!),
              )}
            </strong>
          </span>
        )}
      </div>

      {sale.coupon && (
        <div>
          <span>Com cupom</span>
          <div className="flex items-center overflow-hidden rounded-full border bg-foreground pl-2 text-primary-foreground">
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

      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-0.5">
          {sale.reactions.map((reaction) => (
            <ReactionButton
              initialUsers={reaction.users}
              reaction={reaction.content}
              saleId={sale.id}
              key={reaction.content}
            />
          ))}
        </div>

        <a
          href={`/promocao/${sale.id}/${sale.slug}#comments`}
          className="flex items-center justify-between gap-1 px-1 hover:text-violet-400"
        >
          <span>{sale.comments.length}</span>
          <Icons.MessageCircle className="h-5 w-5" />
        </a>
      </div>
    </div>
  )
}
