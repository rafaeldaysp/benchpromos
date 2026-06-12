import { type ComponentType } from 'react'

import { Icons } from '@/components/icons'
import type { SocialMediaPlatform, SocialMediaType } from '@/types'

type IconType = ComponentType<{ className?: string }>

interface PlatformMeta {
  label: string
  tagline: string
  cta: string
  color: string
  icon: IconType
}

interface TypeMeta {
  label: string
  description: string
}

export const socialMediaPlatformMeta: Record<
  SocialMediaPlatform,
  PlatformMeta
> = {
  WHATSAPP: {
    label: 'WhatsApp',
    tagline: 'Ofertas e novidades diretas no seu bolso.',
    cta: 'Entrar no grupo',
    color: '#25D366',
    icon: Icons.WhatsApp,
  },
  TELEGRAM: {
    label: 'Telegram',
    tagline: 'Um canal rápido, organizado e sem ruído.',
    cta: 'Entrar no canal',
    color: '#229ED9',
    icon: Icons.Telegram,
  },
  DISCORD: {
    label: 'Discord',
    tagline: 'Troque ideia com a comunidade em tempo real.',
    cta: 'Entrar no servidor',
    color: '#5865F2',
    icon: Icons.Discord,
  },
  YOUTUBE: {
    label: 'YouTube',
    tagline: 'Reviews, análises e novidades em vídeo.',
    cta: 'Inscrever-se',
    color: '#FF0000',
    icon: Icons.YoutubeIcon,
  },
}

export const socialMediaTypeMeta: Record<SocialMediaType, TypeMeta> = {
  GENERAL_OFFERS: {
    label: 'Ofertas',
    description: 'As melhores promoções do dia a dia, garimpadas pra você.',
  },
  TECH_OFFERS: {
    label: 'Ofertas de tecnologia',
    description:
      'Promoções de hardware, periféricos e gadgets em primeira mão.',
  },
  COMMUNICATION: {
    label: 'Comunidade',
    description: 'Converse, tire dúvidas e troque ideia com a galera.',
  },
  CONTENT: {
    label: 'Conteúdo',
    description: 'Reviews, análises e novidades do mundo tech.',
  },
}

// Fixed display order used by the dashboard selects and the public page.
export const socialMediaPlatformOrder: SocialMediaPlatform[] = [
  'WHATSAPP',
  'TELEGRAM',
  'DISCORD',
  'YOUTUBE',
]

export const socialMediaTypeOrder: SocialMediaType[] = [
  'GENERAL_OFFERS',
  'TECH_OFFERS',
  'COMMUNICATION',
  'CONTENT',
]
