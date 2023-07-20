import { gql } from '@apollo/client'
import { type NextAuthOptions, type Session } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

import { env } from '../env.mjs'
import { BenchAdapter } from './adapter'
import { getClient } from './apollo'

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
  callbacks: {
    async jwt({ token, user }) {
      const response = await getClient().query<{ user: Session['user'] }>({
        query: gql`
          query GetUser($userId: String!) {
            user: getUser(id: $userId) {
              id
              name
              email
              image
              isAdmin
            }
          }
        `,
        context: {
          headers: {
            'api-key': env.NEXT_PUBLIC_API_KEY,
          },
        },
        variables: {
          userId: token?.sub ?? token.id,
        },
      })

      const dbUser = response?.data.user

      if (!dbUser) {
        if (user) {
          token.id = user.id
        }

        return token
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
        isAdmin: dbUser.isAdmin,
      }
    },
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture
        session.user.isAdmin = token.isAdmin
      }

      return session
    },
  },
  debug: env.NODE_ENV === 'development',
}
