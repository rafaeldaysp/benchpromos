'use server'

import { getServerSession } from 'next-auth/next'
import { cookies } from 'next/headers'

import { authOptions } from '@/lib/auth'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)

  return session?.user
}

export async function getCurrentUserToken() {
  const token = cookies().get('bench-promos.session-token')

  return token?.value
}
