export type Retailer = {
  id: string
  name: string
}

export type Category = {
  id: string
  name: string
  slug: string
  priority: number
  subcategories: Omit<Category, 'subcategories' | 'slug'>[]
}

export type Product = {
  id: string
  name: string
  imageUrl: string
  specs: {
    title: string
    value: string
  }[]
  pros: {
    value: string
  }[]
  cons: {
    value: string
  }[]
  description?: string
  reviewUrl?: string
  referencePrice?: number
  categoryId: string
  slug: string
  recommended: boolean
  views: number
  suggestionSlugs: string[]
  subcategoryId?: string
}

export type Coupon = {
  id: string
  availability: boolean
  code: string
  discount: string
  retailerId: string
  minimumSpend: number
  description?: string
  updatedAt: string
}

export type Discount = {
  id: string
  discount: string
  retailerId: string
  description?: string
  label?: string
  updatedAt: string
}

export type RecommendedProduct = {
  id: string
  minPrice: number
  maxPrice: number
  productId: string
  categoryId: string
}

export type Cashback = {
  id: string
  provider: string
  value: number
  url: string
  affiliatedUrl: string
  video?: string
  updatedAt: string
}

export type Filter = {
  id: string
  name: string
  slug: string
  categoryId: string
  priority: number
  options: {
    id: string
    value: string
    slug: string
    priority: number
  }[]
}

export type Deal = {
  id: string
  price: number
  availability: boolean
  retailerIsSeller: boolean
  url: string
  priority: number
  installments?: number
  totalInstallmentPrice?: number
  sku?: string
  productId: string
  retailerId: string
  couponId?: string
  cashbackId?: string
  createdAt: string
  updatedAt: string
  saleId?: string
  lastScrapedAt?: string
  lastScrapedMessage?: string
  scrapingStatus?: string
}

export type Sale = {
  id: string
  title: string
  slug: string
  imageUrl: string
  url: string
  price: number
  categoryId: string
  highlight: boolean
  installments?: number
  totalInstallmentPrice?: number
  caption?: string
  review?: string
  label?: string
  coupon?: string
  cashbackId?: string
  createdAt: string
  productSlug?: string
  sponsored: boolean
  expired: boolean
  retailerId?: string
  couponId?: string
}

export type Comment = {
  id: string
  saleId: string
  userId: string
  text: string
  createdAt: string
  updatedAt: string
  commentId?: string
}

export type Like = {
  id: string
  commentId: string
  userId: string
}

export type Benchmark = {
  id: string
  name: string
  slug: string
  hidden: boolean
  lowerIsBetter: boolean
  imageUrl?: string
  parentId?: string
}

export type BenchmarkResult = {
  id: string
  benchmarkId: string
  result: number
  unit: string
  hidden: boolean
  productAlias: string
  description?: string
  video?: string
}

export type headerOption = {
  title: string
  slug?: string
  content?: { title: string; slug: string }[]
  icon?: React.ComponentType<{ className?: string }>
}

export type AwardsCategory = {
  id: string
  title: string
  expiredAt: string
  description?: string
}

export type AwardsCategoryOption = {
  id: string
  title?: string

  productId: string
  awardsCategoryId: string

  _count: {
    votes: number
  }
}

export type AwardsCategoryOptionVote = {
  id: string
  userId: string
  awardsCategoryOptionId: string
}
