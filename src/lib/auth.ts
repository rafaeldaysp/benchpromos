import { gql } from '@apollo/client'
import dayjs from 'dayjs'
import type { NextAuthOptions, Session } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { cookies } from 'next/headers'

import { env } from '../env.mjs'
import { BenchAdapter } from './adapter'
import { getClient } from './apollo'
import { authSchema } from './validations/auth'

const GET_USER = gql`
  query GetUser($userId: String!) {
    user: getUser(id: $userId) {
      id
      name
      email
      image
      isAdmin
      emailVerified
    }
  }
`

const GET_TOKEN = gql`
  query Query($userId: String!) {
    token(userId: $userId)
  }
`

const AUTHORIZE = gql`
  query ($credentials: CredentialsInput!) {
    user: authorize(credentials: $credentials) {
      id
      email
      emailVerified
      image
      name
      isAdmin
    }
  }
`

export const authOptions: NextAuthOptions = {
  adapter: BenchAdapter(),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/sign-in',
  },
  secret: env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      credentials: {
        email: { type: 'text', placeholder: 'exemplo@seuemail.com' },
        password: { type: 'password', placeholder: '********' },
      },
      async authorize(credentials) {
        const { email, password } = authSchema
          .omit({ name: true })
          .parse(credentials)

        const { data, errors } = await getClient().query<{
          user: Session['user']
        }>({
          query: AUTHORIZE,
          context: {
            headers: {
              'api-key': env.NEXT_PUBLIC_API_KEY,
            },
          },
          variables: {
            credentials: {
              email,
              password,
            },
          },
        })

        if (errors) return null

        const user = data?.user

        if (!user) return null

        return user
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const response = await getClient().query<{ user: Session['user'] }>({
        query: GET_USER,
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
        emailVerified: dbUser.emailVerified,
      }
    },
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture
        session.user.isAdmin = token.isAdmin
        session.user.emailVerified = token.emailVerified
      }

      return session
    },
  },
  events: {
    async signIn({ user }) {
      const { data } = await getClient().query<{ token: string }>({
        query: GET_TOKEN,
        context: {
          headers: {
            'api-key': env.NEXT_PUBLIC_API_KEY,
          },
        },
        variables: {
          userId: user.id,
        },
      })

      const token = data.token

      cookies().set({
        name: 'bench-promos.session-token',
        value: token,
        expires: dayjs().add(30, 'days').toDate(),
      })
    },
    async signOut() {
      cookies().set({
        name: 'bench-promos.session-token',
        value: '',
        maxAge: 0,
      })
    },
  },
  debug: env.NODE_ENV === 'development',
}
