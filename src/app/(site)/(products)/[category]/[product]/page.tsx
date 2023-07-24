interface ProductPageProps {
  params: {
    category: string
    product: string
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { category, product } = params

  return (
    <div>
      <h1>{category}</h1>
      <h1>{product}</h1>
    </div>
  )
}
