'use client'

import * as React from 'react'

import { Button, type ButtonProps } from '@/components/ui/button'
import { Icons } from '@/components/icons'

export function CopyButton({
  value,
  variant = 'outline',
  ...props
}: ButtonProps) {
  const [isCopied, setIsCopied] = React.useState(false)

  return (
    <Button
      variant={variant}
      className="h-fit w-full border-dashed px-6 py-4 text-base"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (typeof window === 'undefined') return
        setIsCopied(true)
        void window.navigator.clipboard.writeText(value?.toString() ?? '')
        setTimeout(() => setIsCopied(false), 2000)
      }}
      {...props}
    >
      {isCopied ? (
        <Icons.Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Icons.Copy className="h-4 w-4" aria-hidden="true" />
      )}
      <span className="ml-2 font-semibold uppercase tracking-widest">
        {value}
      </span>
      <span className="sr-only">
        {isCopied ? 'Copiado' : 'Copiar para área de transferência'}
      </span>
    </Button>
  )
}
