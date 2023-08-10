import { Icons } from '@/components/icons'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { env } from '@/env.mjs'
import { getClient } from '@/lib/apollo'
import { cn } from '@/lib/utils'
import { gql } from '@apollo/client'
import { type User } from 'next-auth'
import Link from 'next/link'

const VERIFY_EMAIL = gql`
  mutation VerifyEmail($token: String!) {
    verified: verifyEmail(token: $token) {
      id
    }
  }
`

interface SignUpStep2PageProps {
  searchParams: {
    token: string
  }
}

export default async function SignUpStep2Page({
  searchParams,
}: SignUpStep2PageProps) {
  const { token } = searchParams

  console.log(token)

  const { data } = await getClient().mutate<{
    verified: User
  }>({
    mutation: VERIFY_EMAIL,
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    variables: {
      token,
    },
    errorPolicy: 'all',
  })

  const userVerified = data?.verified

  return (
    <Card className="text-center">
      <CardHeader>
        <h1 className="text-xl font-semibold">Verificação de email</h1>
      </CardHeader>
      <CardContent className="flex items-center justify-center space-y-4">
        {userVerified ? (
          <>
            <Icons.Check className="text-green-500" /> Conta verificada com
            sucesso
          </>
        ) : (
          <>
            <Icons.X className="text-red-500" /> Verificação inválida
          </>
        )}
      </CardContent>
      <CardFooter>
        <Link href="/" className={cn(buttonVariants(), 'w-full')}>
          Início
        </Link>
      </CardFooter>
    </Card>
  )
}
