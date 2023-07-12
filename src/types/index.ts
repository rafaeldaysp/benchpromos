export type Retailer = {
  id: string
  name: string
}

export type Category = {
  id: string
  name: string
  subcategories: Omit<Category, 'subcategories'>[]
}

export type Product = {
  id: string
  name: string
  imageUrl: string
  specs: {
    title: string
    value: string
  }[]
  reviewUrl: string
  description: string
  referencePrice: number
  categoryId: string
  slug: string
  subcategoryId: string
  recommended: boolean
}
