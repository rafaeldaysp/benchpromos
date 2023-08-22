import { Sales } from '@/components/sales'
import { getCurrentUser } from '../_actions/user'

export default async function Home() {
  const user = await getCurrentUser()

  return (
    <div className="px-4 sm:container">
      <Sales user={user} />
    </div>
  )
}
