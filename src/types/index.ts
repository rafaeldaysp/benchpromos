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
  reviewUrl?: string
  description?: string
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
}

export type Filter = {
  id: string
  name: string
  categoryId: string
  priority: number
  options: {
    id: string
    value: string
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
  imageUrl: string
  url: string
  price: number
  categoryId: string
  installments?: number
  totalInstallmentPrice?: number
  caption?: string
  review?: string
  label?: string
  coupon?: string
  cashback?: string
  createdAt: string
  productId?: string
}
