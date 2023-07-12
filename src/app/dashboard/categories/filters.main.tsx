import { Category, Filter } from '@/types'

interface FiltersMainProps {
  category: Omit<Category, 'subcategories'> & { filters: Filter }
}

export function FiltersMain({ category }: FiltersMainProps) {
  return <div></div>
}
