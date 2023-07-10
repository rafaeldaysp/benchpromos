'use client'

import * as React from 'react'

import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

const tags = Array.from({ length: 50 }).map(
  (_, i, a) => `product.${a.length - i}`,
)

interface ProductSelectProps {
  products?: {
    name: string
    imageUrl: string
  }[]
}

export function ProductsSelect({ products }: ProductSelectProps) {
  return (
    <div className="flex h-full flex-col gap-y-4">
      <Input />
      <ScrollArea className="rounded-md border">
        <div className="p-4">
          <h4 className="mb-4 text-sm font-medium leading-none">Produtos</h4>
          {tags.map((tag) => (
            <React.Fragment key={tag}>
              <div className="text-sm">{tag}</div>
              <Separator className="my-2" />
            </React.Fragment>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
