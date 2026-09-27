import 'server-only'

import { cache } from 'react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth'

// Request-local only: never share a personalized session across visitors.
export const getRequestSession = cache(() => getServerSession(authOptions))
