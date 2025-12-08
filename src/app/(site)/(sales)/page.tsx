import { getCurrentUser } from '@/app/_actions/user'
import { BenchAwardsBanner } from '@/components/awards-v2/banner'
import { Sales } from '@/components/sales/sales'

export default async function Home() {
  const user = await getCurrentUser()

  return (
    <div className="my-10 space-y-4 px-4 sm:container">
      <BenchAwardsBanner href="/awards" dismissible={false} />
      <Sales user={user} />
    </div>
  )
}
