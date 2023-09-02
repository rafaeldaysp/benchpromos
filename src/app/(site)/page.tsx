import { getCurrentUser } from '@/app/_actions/user'
import { Sales } from '@/components/sales/sales'

export default async function Home() {
  const user = await getCurrentUser()

  return (
    <div className="px-4 sm:container">
      <Sales user={user} />
    </div>
  )
}
