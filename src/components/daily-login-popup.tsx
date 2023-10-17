'use client'

import * as React from 'react'

import { getCurrentUser } from '@/app/_actions/user'
import { LoginPopup } from './login-popup'

export function DailyLoginPopup() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    async function checkUserAndStorage() {
      const user = await getCurrentUser()

      const pop_status = localStorage.getItem('pop_status')

      if (
        !user &&
        (!pop_status ||
          new Date().getTime() - new Date(pop_status).getTime() >
            24 * 60 * 60 * 1000)
      ) {
        setOpen(true)
        localStorage.setItem('pop_status', new Date().toISOString())
      }
    }

    checkUserAndStorage()
  }, [])

  return <LoginPopup open={open} setOpen={setOpen} />
}
