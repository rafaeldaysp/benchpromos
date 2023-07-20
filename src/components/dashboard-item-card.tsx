import Image, { type ImageProps } from 'next/image'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function DashboardItemCardRoot({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-start gap-x-6 rounded-md bg-card p-4 transition-colors hover:bg-muted sm:px-8',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function DashboardItemCardImage({ className, src, alt, ...props }: ImageProps) {
  return (
    <div className="relative h-16 w-16">
      <Image
        src={src}
        alt={alt}
        className={cn('object-contain', className)}
        fill
        {...props}
      />
    </div>
  )
}

function DashboardItemCardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex-1', className)} {...props}>
      {children}
    </div>
  )
}

function DashboardItemCardActions({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col gap-2 self-center sm:flex-row', className)}
      {...props}
    >
      {children}
    </div>
  )
}

const DashboardItemCardAction = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentPropsWithoutRef<typeof Button> & { icon: React.ElementType }
>(({ icon: Icon, variant = 'outline', ...props }, ref) => (
  <Button ref={ref} variant={variant} size="icon" {...props}>
    <Icon className="h-4 w-4" />
  </Button>
))
DashboardItemCardAction.displayName = 'DashboardItemCardAction'

export const DashboardItemCard = {
  Root: DashboardItemCardRoot,
  Image: DashboardItemCardImage,
  Content: DashboardItemCardContent,
  Actions: DashboardItemCardActions,
  Action: DashboardItemCardAction,
}
