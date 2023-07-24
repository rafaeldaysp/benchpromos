import { type Metadata } from 'next'

import { VerifyEmailForm } from '@/components/forms/verify-email-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { env } from '@/env.mjs'

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: 'Verificar Email',
  description:
    'Verifique seu endereço de e-mail para continuar com seu cadastro',
}

export default function VerifyEmailPage() {
  return (
    <div>
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Verificar e-mail</CardTitle>
          <CardDescription>
            Verifique seu endereço de e-mail para concluir a criação da conta
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <VerifyEmailForm />
        </CardContent>
      </Card>
    </div>
  )
}
