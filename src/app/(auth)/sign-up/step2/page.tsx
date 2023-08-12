import { gql } from '@apollo/client'
import { type Session } from 'next-auth'
import Link from 'next/link'

import { Icons } from '@/components/icons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { env } from '@/env.mjs'
import { getClient } from '@/lib/apollo'
import { cn } from '@/lib/utils'

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

  const { data } = await getClient().mutate<{
    verified: Session['user']
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
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Verificação de email</CardTitle>
      </CardHeader>
      <CardContent>
        {userVerified ? (
          <Alert>
            <Icons.Check className="h-4 w-4" />
            <AlertTitle>Verificação concluída</AlertTitle>
            <AlertDescription>
              Parabéns! Seu e-mail foi verificado com sucesso. Você pode agora
              desfrutar de todos os recursos do nosso aplicativo.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <Icons.X className="h-4 w-4" />
            <AlertTitle>Verificação pendente</AlertTitle>
            <AlertDescription>
              Parece que ainda não verificamos seu e-mail. Por favor, verifique
              seu e-mail e clique no link de verificação para acessar todos os
              recursos do nosso aplicativo.
            </AlertDescription>
          </Alert>
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
