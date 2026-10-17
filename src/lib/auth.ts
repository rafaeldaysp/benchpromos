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
      role
      emailVerified
      sessionVersion
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
      role
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
              'api-key': env.API_KEY,
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
      const response = await getClient().query<{
        user: Session['user'] & { sessionVersion: number }
      }>({
        query: GET_USER,
        context: {
          headers: {
            'api-key': env.API_KEY,
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

      // A password reset bumps sessionVersion on the API. Sessions are pinned
      // to the version at sign-in, so older ones end here; throwing makes
      // NextAuth clear the session cookie.
      const sessionVersion = user ? dbUser.sessionVersion : token.sessionVersion

      if (sessionVersion !== dbUser.sessionVersion) {
        throw new Error('Session revoked by a password reset')
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
        role: dbUser.role,
        emailVerified: dbUser.emailVerified,
        sessionVersion: dbUser.sessionVersion,
      }
    },
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture
        session.user.role = token.role
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
            'api-key': env.API_KEY,
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
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
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
