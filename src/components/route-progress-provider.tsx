'use client'

import { AppProgressProvider } from '@bprogress/next'

const RouteProgressProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AppProgressProvider
      height="3px"
      color="hsl(var(--auxiliary))"
      options={{ showSpinner: false }}
      shallowRouting
    >
      {children}
    </AppProgressProvider>
  )
}

export default RouteProgressProvider
