import dayjs from 'dayjs'
import Image from 'next/image'

import { CopyButton } from '@/components/copy-button'
import { Icons } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { priceFormatter } from '@/utils/formatter'
import { SaleReactions } from './sale-reactions'

interface SaleCardProps {
  sale: {
    id: string
    title: string
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
        <p>{sale.title}</p>
      </div>

      <div className="relative mx-auto aspect-square w-8/12">
        <Image
          src={sale.imageUrl}
          alt={sale.title}
          className="rounded-lg object-contain"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      {sale.caption && (
        <div>
          <p className="text-muted-foreground">{sale.caption}</p>
        </div>
      )}

      <div className="flex items-center gap-x-2">
        <strong>{priceFormatter.format(sale.price / 100)}</strong>
        {sale.totalInstallmentPrice && (
          <span>
            ou {priceFormatter.format(sale.totalInstallmentPrice / 100)} em{' '}
            {sale.installments}x
          </span>
        )}
      </div>

      {sale.coupon && (
        <div>
          <span>Com cupom</span>
          <div className="flex items-center overflow-hidden rounded-full border pl-2">
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
          <span className="mr-2">Acessar</span>
          <Icons.ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  )
}
