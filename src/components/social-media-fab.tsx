'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { LayoutGrid, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Icons } from '@/components/icons'
import {
  socialMediaPlatformMeta,
  socialMediaPlatformOrder,
} from '@/constants/social-media'
import { cn } from '@/lib/utils'
import type { SocialMediaLink } from '@/types'

interface SocialMediaFabProps {
  links: Pick<SocialMediaLink, 'id' | 'url' | 'platform'>[]
}

export function SocialMediaFab({ links }: SocialMediaFabProps) {
  const [open, setOpen] = useState(false)
  const [canHover, setCanHover] = useState(false)
  const dockRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  // Only treat hover as an open trigger on devices that actually hover.
  // Touch browsers emulate mouseenter on tap, which would skip the dial.
  useEffect(() => {
    const query = window.matchMedia('(hover: hover)')
    const update = () => setCanHover(query.matches)

    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  // Quick shortcuts: one entry per platform, in canonical order.
  const platformLinks = socialMediaPlatformOrder
    .map((platform) => links.find((link) => link.platform === platform))
    .filter((link): link is NonNullable<typeof link> => Boolean(link))

  // Close on tap/click outside (mainly for touch, where there is no hover).
  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (dockRef.current && !dockRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  function handleFabClick(event: React.MouseEvent) {
    // First interaction reveals the options; once open, let it navigate.
    if (!open) {
      event.preventDefault()
      setOpen(true)
    }
  }

  // Animate the whole menu as one unit so every option lights up together,
  // instead of revealing one after another.
  const menuMotion = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.12 },
      }
    : {
        initial: { opacity: 0, y: 8, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 8, scale: 0.98 },
        transition: { duration: 0.18, ease: 'easeOut' as const },
      }

  return (
    <div
      ref={dockRef}
      onMouseEnter={canHover ? () => setOpen(true) : undefined}
      onMouseLeave={canHover ? () => setOpen(false) : undefined}
      className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-3 print:hidden"
    >
      <AnimatePresence>
        {open && (
          <motion.ul
            key="social-fab-menu"
            {...menuMotion}
            className="flex flex-col items-start gap-2.5"
          >
            {platformLinks.map((link) => {
              const platform = socialMediaPlatformMeta[link.platform]

              return (
                <li key={link.id}>
                  <FabOption
                    href={link.url}
                    label={platform.label}
                    color={platform.color}
                    external
                  >
                    <platform.icon className="size-5" aria-hidden="true" />
                  </FabOption>
                </li>
              )
            })}

            <li>
              <FabOption
                href="/comunidades"
                label="Ver todas"
                onClick={() => setOpen(false)}
              >
                <LayoutGrid className="size-5" aria-hidden="true" />
              </FabOption>
            </li>
          </motion.ul>
        )}
      </AnimatePresence>

      <Link
        href="/comunidades"
        onClick={handleFabClick}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Comunidades do Bench Promos"
        className={cn(
          'relative flex size-14 items-center justify-center rounded-full',
          'border border-white/10 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground',
          'shadow-[0_8px_24px_-6px_hsl(var(--primary)/0.45),0_10px_28px_-8px_rgba(0,0,0,0.35)]',
          'outline-none ring-offset-2 ring-offset-background transition-transform',
          'hover:scale-[1.04] focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96]',
        )}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={open ? 'close' : 'open'}
            initial={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
            className="absolute"
          >
            {open ? (
              <Icons.X className="size-6" aria-hidden="true" />
            ) : (
              <Users className="size-6" aria-hidden="true" />
            )}
          </motion.span>
        </AnimatePresence>
      </Link>
    </div>
  )
}

interface FabOptionProps {
  href: string
  label: string
  color?: string
  external?: boolean
  onClick?: () => void
  children: React.ReactNode
}

function FabOption({
  href,
  label,
  color,
  external,
  onClick,
  children,
}: FabOptionProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label={label}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="group flex items-center gap-2.5 transition-transform active:scale-[0.96]"
    >
      <span
        className={cn(
          'flex size-11 items-center justify-center rounded-full ring-1 ring-inset ring-white/15 transition-transform duration-200 group-hover:scale-105',
          color
            ? 'text-white'
            : 'bg-primary text-primary-foreground shadow-[0_4px_12px_-4px_hsl(var(--primary)/0.5)]',
        )}
        style={
          color
            ? { backgroundColor: color, boxShadow: `0 6px 18px -4px ${color}` }
            : undefined
        }
      >
        {children}
      </span>
      <span className="whitespace-nowrap rounded-full border bg-card/90 px-3 py-1.5 text-sm font-medium text-card-foreground shadow-[0_4px_12px_-4px_rgba(0,0,0,0.3)] backdrop-blur-md">
        {label}
      </span>
    </Link>
  )
}
