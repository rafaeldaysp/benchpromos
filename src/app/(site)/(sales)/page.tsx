import { getCurrentUser, getCurrentUserToken } from '@/app/_actions/user'
import { AuthTokenProvider } from '@/components/auth-token-provider'
import { Sales } from '@/components/sales/sales'

export default async function Home() {
  const user = await getCurrentUser()
  const token = user ? await getCurrentUserToken() : undefined

  return (
    <div className="my-10 px-4 sm:container">
      <AuthTokenProvider token={token}>
        <Sales user={user} />
      </AuthTokenProvider>
    </div>
  )
}
