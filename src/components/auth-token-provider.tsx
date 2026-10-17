'use client'

import * as React from 'react'

const AuthTokenContext = React.createContext<string | undefined>(undefined)

interface AuthTokenProviderProps {
  token?: string
  children: React.ReactNode
}

// The API token lives in an httpOnly cookie, so a server component has to read
// it and hand it to the client components that call protected operations.
export function AuthTokenProvider({ token, children }: AuthTokenProviderProps) {
  return (
    <AuthTokenContext.Provider value={token}>
      {children}
    </AuthTokenContext.Provider>
  )
}

// Spread into an Apollo `context.headers` object. Without a provider (or when
// signed out) it adds nothing and the API rejects protected operations.
export function useAuthHeaders(): Record<string, string> {
  const token = React.useContext(AuthTokenContext)

  return React.useMemo(() => {
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    return headers
  }, [token])
}
