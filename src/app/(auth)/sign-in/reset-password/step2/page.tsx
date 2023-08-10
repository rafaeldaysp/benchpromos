import { type Metadata } from 'next'

import { ResetPasswordStep2Form } from '@/components/forms/reset-password-form-step2'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { env } from '@/env.mjs'

interface ResetPasswordStep2PageProps {
  searchParams: {
    token: string
  }
}

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: 'Redefinir senha',
  description: 'Insira seu e-mail para redefinir sua senha',
}
export default function ResetPasswordStep2Page({
  searchParams,
}: ResetPasswordStep2PageProps) {
  const { token } = searchParams
  console.log(token)

  return (
    <div>
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Redefinir senha</CardTitle>
          <CardDescription>
            Insira sua nova senha e o código de verificação recebido por e-mail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordStep2Form token={token} />
        </CardContent>
      </Card>
    </div>
  )
}
