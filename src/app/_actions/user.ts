'use server'

import { cookies } from 'next/headers'

import { getRequestSession } from '@/lib/server-session'

export async function getCurrentUser() {
  const session = await getRequestSession()

  return session?.user
}

export async function getCurrentUserToken() {
  const token = cookies().get('bench-promos.session-token')

  return token?.value
}
