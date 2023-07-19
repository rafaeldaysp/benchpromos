import Image, { type ImageProps } from 'next/image'

import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function DashboardItemCardRoot({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-start gap-x-6 rounded-md bg-inherit p-4 transition-colors hover:bg-muted sm:px-8',
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

interface DasboardItemCardAction extends ButtonProps {
  icon: React.ElementType
}

function DashboardItemCardAction({
  icon: Icon,
  variant = 'outline',
  ...props
}: DasboardItemCardAction) {
  return (
    <Button variant={variant} size="icon" {...props}>
      <Icon className="h-4 w-4" />
    </Button>
  )
}

export const DashboardItemCard = {
  Root: DashboardItemCardRoot,
  Image: DashboardItemCardImage,
  Content: DashboardItemCardContent,
  Actions: DashboardItemCardActions,
  Action: DashboardItemCardAction,
}
