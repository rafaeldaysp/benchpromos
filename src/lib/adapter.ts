import { gql } from '@apollo/client'
import type { Adapter } from 'next-auth/adapters'

import { env } from '@/env.mjs'
import { getClient } from './apollo'

export function BenchAdapter(): Adapter {
  return {
    async createUser(user) {
      const { data } = await getClient().mutate({
        mutation: gql`
          mutation CreateUser($input: AddUserInput!) {
            createUser(input: $input) {
              id
              name
              email
              emailVerified
              image
            }
          }
        `,
        context: {
          headers: {
            'api-key': env.NEXT_PUBLIC_API_KEY,
          },
        },
        variables: {
          input: user,
        },
      })

      return data.createUser
    },
    async getUser(id) {
      const response = await getClient().query({
        query: gql`
          query GetUser($id: String!) {
            getUser(id: $id) {
              id
              name
              email
              emailVerified
              image
            }
          }
        `,
        context: {
          headers: {
            'api-key': env.NEXT_PUBLIC_API_KEY,
          },
        },
        variables: {
          id,
        },
      })

      return response?.data.getUser
    },
    async getUserByEmail(email) {
      const response = await getClient().query({
        query: gql`
          query GetUserByEmail($email: String!) {
            getUserByEmail(email: $email) {
              id
              name
              email
              emailVerified
              image
            }
          }
        `,
        context: {
          headers: {
            'api-key': env.NEXT_PUBLIC_API_KEY,
          },
        },
        variables: {
          email,
        },
      })

      return response?.data.getUserByEmail
    },
    async getUserByAccount({ providerAccountId, provider }) {
      const response = await getClient().query({
        query: gql`
          query GetUserByAccount(
            $providerAccountId: String!
            $provider: String!
          ) {
            getUserByAccount(
              providerAccountId: $providerAccountId
              provider: $provider
            ) {
              id
              name
              email
              emailVerified
              image
            }
          }
        `,
        context: {
          headers: {
            'api-key': env.NEXT_PUBLIC_API_KEY,
          },
        },
        variables: {
          providerAccountId,
          provider,
        },
      })

      return response?.data.getUserByAccount
    },
    async updateUser({ id, ...user }) {
      const { data } = await getClient().mutate({
        mutation: gql`
          mutation UpdateUser($id: ID!, $input: UserPatch!) {
            updateUser(id: $id, input: $input) {
              id
              name
              email
              emailVerified
              image
            }
          }
        `,
        context: {
          headers: {
            'api-key': env.NEXT_PUBLIC_API_KEY,
          },
        },
        variables: {
          id,
          input: user,
        },
      })

      return data.updateUser
    },
    async deleteUser(userId) {
      const { data } = await getClient().mutate({
        mutation: gql`
          mutation DeleteUser($id: ID!) {
            deleteUser(id: $id) {
              id
              name
              email
              emailVerified
              image
            }
          }
        `,
        context: {
          headers: {
            'api-key': env.NEXT_PUBLIC_API_KEY,
          },
        },
        variables: {
          id: userId,
        },
      })

      return data.deleteUser
    },
    async linkAccount(account) {
      const { data } = await getClient().mutate({
        mutation: gql`
          mutation LinkAccount($input: AddAccountInput!) {
            linkAccount(input: $input) {
              id
              userId
              type
              provider
              providerAccountId
              refreshToken
              expires_at
              accessToken
              token_type
              refresh_token
              access_token
              scope
              id_token
              session_state
            }
          }
        `,
        context: {
          headers: {
            'api-key': env.NEXT_PUBLIC_API_KEY,
          },
        },
        variables: {
          input: account,
        },
      })

      return data.linkAccount
    },
    async unlinkAccount({ providerAccountId, provider }) {
      const { data } = await getClient().mutate({
        mutation: gql`
          mutation UnlinkAccount(
            $providerAccountId: String!
            $provider: String!
          ) {
            unlinkAccount(
              providerAccountId: $providerAccountId
              provider: $provider
            ) {
              id
              userId
              type
              provider
              providerAccountId
              refreshToken
              expires_at
              accessToken
              token_type
              refresh_token
              access_token
              scope
              id_token
              session_state
            }
          }
        `,
        context: {
          headers: {
            'api-key': env.NEXT_PUBLIC_API_KEY,
          },
        },
        variables: {
          providerAccountId,
          provider,
        },
      })

      return data.unlinkAccount
    },
    async createSession(session) {
      const { data } = await getClient().mutate({
        mutation: gql`
          mutation CreateSession($input: AddSessionInput!) {
            createSession(input: $input) {
              id
              sessionToken
              userId
              expires
            }
          }
        `,
        context: {
          headers: {
            'api-key': env.NEXT_PUBLIC_API_KEY,
          },
        },
        variables: {
          input: session,
        },
      })

      return data.createSession
    },
    async getSessionAndUser(sessionToken) {
      const response = await getClient().query({
        query: gql`
          query GetSessionAndUser($sessionToken: String!) {
            getSessionAndUser(sessionToken: $sessionToken) {
              session
              user
            }
          }
        `,
        context: {
          headers: {
            'api-key': env.NEXT_PUBLIC_API_KEY,
          },
        },
        variables: {
          sessionToken,
        },
      })

      return response?.data.getSessionAndUser
    },
    async updateSession({ sessionToken, ...session }) {
      const { data } = await getClient().mutate({
        mutation: gql`
          mutation UpdateSession(
            $input: SessionPatch!
            $sessionToken: String!
          ) {
            updateSession(input: $input, sessionToken: $sessionToken) {
              id
              sessionToken
              userId
              expires
            }
          }
        `,
        context: {
          headers: {
            'api-key': env.NEXT_PUBLIC_API_KEY,
          },
        },
        variables: {
          sessionToken,
          input: session,
        },
      })

      return data.updateSession
    },
    async deleteSession(sessionToken) {
      const { data } = await getClient().mutate({
        mutation: gql`
          mutation DeleteSession($sessionToken: String!) {
            deleteSession(sessionToken: $sessionToken) {
              id
              sessionToken
              userId
              expires
            }
          }
        `,
        context: {
          headers: {
            'api-key': env.NEXT_PUBLIC_API_KEY,
          },
        },
        variables: {
          sessionToken,
        },
      })

      return data.deleteSession
    },
    async createVerificationToken(verificationToken) {
      const { data } = await getClient().mutate({
        mutation: gql`
          mutation CreateVerificationToken($input: AddVerificationTokenInput!) {
            createVerificationToken(input: $input) {
              id
              identifier
              expires
              token
            }
          }
        `,
        context: {
          headers: {
            'api-key': env.NEXT_PUBLIC_API_KEY,
          },
        },
        variables: {
          input: verificationToken,
        },
      })

      return data.createVerificationToken
    },
    async useVerificationToken({ identifier, token }) {
      const { data } = await getClient().mutate({
        mutation: gql`
          mutation UseVerificationToken($token: String!, $identifier: String!) {
            useVerificationToken(token: $token, identifier: $identifier) {
              id
              identifier
              expires
              token
            }
          }
        `,
        context: {
          headers: {
            'api-key': env.NEXT_PUBLIC_API_KEY,
          },
        },
        variables: {
          token,
          identifier,
        },
      })

      return data.useVerificationToken
    },
  }
}
