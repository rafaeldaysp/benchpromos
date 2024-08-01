'use client'

import { usePathname, useRouter } from 'next/navigation'

import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface RecommendedMain {
  recommendationCategories: {
    id: string
    name: string
    slug: string
  }[]
}

export function RecommendedMain({ recommendationCategories }: RecommendedMain) {
  const router = useRouter()
  const pathname = usePathname()
  return (
    <div>
      <Select onValueChange={(v) => router.push(`${pathname}?category=${v}`)}>
        <SelectTrigger className="w-full sm:max-w-[350px]">
          <SelectValue placeholder="Selecione uma categoria" />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-80">
            {recommendationCategories?.map((categoryItem) => (
              <SelectItem key={categoryItem.slug} value={categoryItem.slug}>
                {categoryItem.name}
              </SelectItem>
            ))}
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  )
}
