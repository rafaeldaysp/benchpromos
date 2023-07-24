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
      size="sm"
      onClick={() => {
        if (typeof window === 'undefined') return
        setIsCopied(true)
        void window.navigator.clipboard.writeText(value?.toString() ?? '')
        setTimeout(() => setIsCopied(false), 2000)
      }}
      {...props}
    >
      {isCopied ? (
        <Icons.Check className="h-3 w-3" aria-hidden="true" />
      ) : (
        <Icons.Copy className="h-3 w-3" aria-hidden="true" />
      )}
      <span className="sr-only">
        {isCopied ? 'Copiado' : 'Copiar para área de transferência'}
      </span>
    </Button>
  )
}
