'use client'

import { AppProgressProvider } from '@bprogress/next'

const RouteProgressProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AppProgressProvider
      height="2px"
      color="hsl(var(--auxiliary))"
      options={{ showSpinner: false }}
      shallowRouting
    >
      {children}
    </AppProgressProvider>
  )
}

export default RouteProgressProvider
