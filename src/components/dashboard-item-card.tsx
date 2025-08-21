import Image, { type ImageProps } from 'next/image'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

const DashboardItemCardRoot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function DashboardItemCardRoot({ className, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex items-start gap-x-6 rounded-md bg-card p-4 transition-colors hover:bg-muted/50 sm:px-8',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})

function DashboardItemCardImage({ className, src, alt, ...props }: ImageProps) {
  return (
    <div className="relative size-16">
      <Image
        src={src}
        alt={alt}
        className={cn('object-contain', className)}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        {...props}
      />
    </div>
  )
}

const DashboardItemCardSelect = React.forwardRef<
  React.ElementRef<typeof Checkbox>,
  React.ComponentPropsWithoutRef<typeof Checkbox>
>(({ ...props }, ref) => (
  <Checkbox
    ref={ref}
    className="translate-y-[2px] self-center border-black data-[state=checked]:bg-black data-[state=checked]:text-white dark:border-white dark:data-[state=checked]:bg-white dark:data-[state=checked]:text-black"
    {...props}
  />
))
DashboardItemCardSelect.displayName = 'DashboardItemCardSelect'

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
      className={cn(
        'flex flex-col flex-wrap justify-end gap-2 self-center sm:flex-row',
        className,
      )}
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
    <Icon className="size-4" />
  </Button>
))
DashboardItemCardAction.displayName = 'DashboardItemCardAction'

export const DashboardItemCard = {
  Root: DashboardItemCardRoot,
  Image: DashboardItemCardImage,
  Content: DashboardItemCardContent,
  Actions: DashboardItemCardActions,
  Action: DashboardItemCardAction,
  Select: DashboardItemCardSelect,
}
