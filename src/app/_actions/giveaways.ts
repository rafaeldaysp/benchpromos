'use server'

import { revalidateTag } from 'next/cache'
import { getCurrentUser } from './user'
import { PUBLIC_GIVEAWAYS_TAG } from '@/lib/public-giveaways'

export async function invalidatePublicGiveaways() {
  const user = await getCurrentUser()
  if (user?.role !== 'ADMIN') throw new Error('Não autorizado')
  revalidateTag(PUBLIC_GIVEAWAYS_TAG)
}
