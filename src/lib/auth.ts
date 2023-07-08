import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

import { env } from '../env.mjs'
import { BenchAdapter } from './adapter'

export const authOptions: NextAuthOptions = {
  adapter: BenchAdapter(),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/',
  },
  secret: env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  debug: env.NODE_ENV === 'development',
}
