import { headers } from 'next/headers'
import { userAgent } from 'next/server'

import { getCurrentUser } from '@/app/_actions/user'
import { Sales } from '@/components/sales/sales'

export default async function Home() {
  const headersList = headers()
  const user = await getCurrentUser()

  const { device } = userAgent({ headers: headersList })
  const viewport = device.type === 'mobile' ? 'mobile' : 'desktop'

  return (
    <div className="px-4 sm:container">
      <Sales user={user} viewport={viewport} />
    </div>
  )
}
