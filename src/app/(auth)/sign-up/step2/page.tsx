import { gql } from '@apollo/client'
import { type Session } from 'next-auth'

import { getCurrentUser } from '@/app/_actions/user'
import { SendEmail } from '@/components/auth/send-email-confirmation'
import { Icons } from '@/components/icons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { env } from '@/env.mjs'
import { getClient } from '@/lib/apollo'

const VERIFY_EMAIL = gql`
  mutation VerifyEmail($token: String!) {
    verified: verifyEmail(token: $token) {
      id
      emailVerified
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
  const user = await getCurrentUser()
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

  const userVerified = data?.verified || user?.emailVerified

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Verificação de email</CardTitle>
      </CardHeader>
      <CardContent>
        {user ? (
          <>
            {userVerified ? (
              <Alert variant="success">
                <Icons.Check className="h-4 w-4" />
                <AlertTitle>Verificação concluída</AlertTitle>
                <AlertDescription>
                  Parabéns! Seu e-mail foi verificado com sucesso. Você pode
                  agora desfrutar de todos os recursos do nosso aplicativo.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="warning">
                <Icons.AlertCircle className="h-4 w-4" />
                <AlertTitle>Verificação pendente</AlertTitle>
                <AlertDescription>
                  Por favor, verifique seu e-mail e clique no link de
                  verificação para acessar todos os recursos do nosso
                  aplicativo.
                </AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <Alert variant="destructive">
            <Icons.X className="h-4 w-4" />
            <AlertTitle>Login necessário</AlertTitle>
            <AlertDescription>
              Efetue o login para realizar a verificação de email. Se o seu
              email já foi confirmado, faça o login e desconsidere esta
              mensagem.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      {user?.email && !userVerified && (
        <CardFooter>
          <SendEmail
            email={user.email}
            tokenType="EMAIL_CONFIRMATION"
            redirectUrl={`${env.NEXT_PUBLIC_APP_URL}/sign-up/step2`}
          />
        </CardFooter>
      )}
    </Card>
  )
}
