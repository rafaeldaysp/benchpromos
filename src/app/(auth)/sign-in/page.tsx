import { type Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getCurrentUser } from '@/app/_actions/user'
import { OAuthSignIn } from '@/components/auth/oauth-sign-in'
import { SignInForm } from '@/components/forms/sign-in-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { env } from '@/env.mjs'

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: 'Entrar',
  description: 'Entre com a sua conta',
}

export default async function SignInPage() {
  const user = await getCurrentUser()
  if (user) redirect('/')

  return (
    <div>
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Entrar</CardTitle>
          <CardDescription>
            Escolha seu método de login preferido
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <OAuthSignIn />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou continue com
              </span>
            </div>
          </div>
          <SignInForm />
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            <span className="mr-1 hidden sm:inline-block">
              Não possui uma conta?
            </span>
            <Link
              aria-label="Cadastrar"
              href="/sign-up"
              className="text-primary underline-offset-4 transition-colors hover:underline"
            >
              Cadastrar
            </Link>
          </div>
          <Link
            aria-label="Redefinir senha"
            href="/sign-in/reset-password"
            className="text-sm text-primary underline-offset-4 transition-colors hover:underline"
          >
            Redefinir senha
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
