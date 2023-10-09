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
  subcategoryId?: string
  recommended: boolean
}

export type Coupon = {
  id: string
  availability: boolean
  code: string
  discount: string
  retailerId: string
  minimumSpend: number
  description?: string
}

export type Cashback = {
  id: string
  provider: string
  value: number
  url: string
  affiliatedUrl: string
  video?: string
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
}

export type BenchmarkResult = {
  id: string
  benchmarkId: string
  result: number
  productAlias: string
  description?: string
}

export type headerOption = {
  title: string
  slug?: string
  content?: { title: string; slug: string }[]
  icon?: React.ComponentType<{ className?: string }>
}
