import { getCurrentUser } from '@/app/_actions/user'
import { SaleMain } from './main'

interface SalePageProps {
  params: {
    slug: string
    id: string
  }
}

export default async function SalePage({ params }: SalePageProps) {
  const { id } = params

  const user = await getCurrentUser()

  return <SaleMain saleId={id} user={user} />
}
