'use server'

import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)

  return session?.user
}

export async function getCurrentUserToken() {
  const token = cookies().get('bench-promos.session-token')

  return token?.value
}
