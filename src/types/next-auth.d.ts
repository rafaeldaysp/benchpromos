import { type User } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: User & {
      id: string
      role: 'ADMIN' | 'MOD' | 'USER'
      emailVerified?: Date
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'ADMIN' | 'MOD' | 'USER'
    emailVerified?: Date
  }
}
