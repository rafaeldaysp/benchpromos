import {
  ArrowRight,
  BatteryCharging,
  Box,
  Building2,
  Check,
  Clapperboard,
  ClipboardCheck,
  Cpu,
  Download,
  FlaskConical,
  Flame,
  Gamepad2,
  HardDrive,
  History,
  MemoryStick,
  MonitorPlay,
  Palette,
  ScanLine,
  Sparkles,
  Timer,
  type LucideIcon,
} from 'lucide-react'
import { type Metadata } from 'next'
// Community FPS (unreleased): restore these imports with the section below.
// import { Gauge, Plug, Share2, Trophy, Users } from 'lucide-react'
// import Image, { type StaticImageData } from 'next/image'
import Link from 'next/link'

// import fpsComunidade from '@/assets/bench-labs/fps-comunidade.jpg'
import monitorRaioX from '@/assets/bench-labs/monitor-raio-x.jpg'
import { BENCH_LABS_DOWNLOAD_URL } from '@/constants/bench-labs'
import { cn } from '@/lib/utils'
import { MonitorShowcase } from './monitor-showcase'
import { DemoFrame } from './demo-frame'
import { ColorShowcase } from './color-showcase'

export const metadata: Metadata = {
  title: 'Bench Labs',
  description:
    'Bench Labs é o app do Bench Promos para testar o seu notebook: benchmarks de jogos, processador, SSD e IA, teste de bateria em uso real, laudo de saúde e ficha técnica completa.',
  openGraph: {
    title: 'Bench Labs — o laboratório do Bench Promos no seu notebook',
    description:
      'Benchmarks, teste de bateria em uso real, laudo de saúde e monitor ao vivo para o seu notebook.',
    images: [{ url: monitorRaioX.src }],
  },
}

const highlights = [
  { value: '10', label: 'testes com nota própria' },
  { value: '4', label: 'modos de teste de bateria' },
  { value: '5', label: 'perfis prontos de uso' },
  { value: 'Ao vivo', label: 'temperatura, consumo e uso' },
]

const profiles = [
  'Gamer',
  'Edição de vídeo',
  'IA no notebook',
  'Arquitetura e Engenharia',
  '3D e animação',
]

const tests: {
  icon: LucideIcon
  name: string
  duration: string
  description: string
}[] = [
  {
    icon: MonitorPlay,
    name: 'GPU',
    duration: '~1 min',
    description:
      'Uma cena urbana pesada em QHD (2560×1440) e tela cheia. A resolução é fixa, então o resultado não depende da tela do notebook.',
  },
  {
    icon: Cpu,
    name: 'CPU',
    duration: '~2 min',
    description:
      'Renderização com todos os núcleos e com um núcleo só, no estilo do Cinebench. Versão rápida ou completa.',
  },
  {
    icon: Gamepad2,
    name: 'CPU para jogos',
    duration: '~1 min',
    description:
      'Uma batalha com 30 mil unidades calculando IA, física e colisão, do jeito que os jogos usam o processador.',
  },
  {
    icon: MemoryStick,
    name: 'Memória',
    duration: '~1 min',
    description:
      'Velocidade e latência da RAM. Avisa quando o notebook está com apenas um pente de memória.',
  },
  {
    icon: HardDrive,
    name: 'SSD + carregamento',
    duration: '~2 min',
    description:
      'Leitura, gravação e o tempo real para carregar um mapa de jogo.',
  },
  {
    icon: Flame,
    name: 'Stress total',
    duration: '10 a 30 min',
    description:
      'Processador e placa de vídeo no limite ao mesmo tempo. No fim, o veredito: estável ou instável.',
  },
  {
    icon: Clapperboard,
    name: 'Edição de vídeo',
    duration: '~6 min',
    description:
      'Vídeos de câmera e de celular em uma timeline 4K com cor e efeitos: reprodução, exportação e motion graphics.',
  },
  {
    icon: Sparkles,
    name: 'IA no notebook',
    duration: '~1 min',
    description:
      'Velocidade de um assistente de IA rodando localmente, como no LM Studio e no Ollama, tempo para gerar uma imagem e quais modelos cabem na placa de vídeo.',
  },
  {
    icon: Building2,
    name: 'Arquitetura e Engenharia',
    duration: '~9 min',
    description:
      'Cinco testes que imitam o Revit, o SketchUp, o AutoCAD, o Enscape e o Lumion.',
  },
  {
    icon: Box,
    name: '3D e animação',
    duration: '~4 min',
    description:
      'Modelagem, renderização e animação 3D para quem trabalha com criação.',
  },
]

/* Community FPS — unreleased.
const communityPoints: {
  icon: LucideIcon
  title: string
  description: string
}[] = [
  {
    icon: Gauge,
    title: 'FPS médio e 1% low',
    description:
      'A mediana dos resultados mostra o FPS típico, e o 1% low revela as engasgadas que a média esconde.',
  },
  {
    icon: Plug,
    title: 'Na tomada ou na bateria',
    description:
      'Compare o mesmo jogo no modo Desempenho, no Equilibrado e longe da tomada.',
  },
  {
    icon: Trophy,
    title: 'Cesta Bench',
    description:
      'Fortnite, Forza Horizon 5, Red Dead Redemption 2, Cyberpunk 2077 e Hogwarts Legacy resumidos em uma média só. Valorant e CS2 aparecem à parte, nos competitivos.',
  },
  {
    icon: Users,
    title: 'Números transparentes',
    description:
      'Cada jogo mostra quantos testes tem. Com menos de 5, ele ganha o aviso de “poucos testes”.',
  },
]

*/

const batteryModes = [
  {
    name: 'Teste rápido',
    duration: '5 min',
    description:
      'Confere se tudo funciona neste notebook. Pode ser feito na tomada.',
  },
  {
    name: 'Teste completo',
    duration: 'até acabar',
    description:
      'Mede a autonomia real em uso produtivo e gera um relatório com gráficos e consumo.',
    featured: true,
  },
  {
    name: 'Jogo na bateria',
    duration: 'até acabar',
    description:
      'Uma cidade neon em 1080p a 60 FPS, medindo FPS, consumo e placa de vídeo.',
  },
  {
    name: 'Teste personalizado',
    duration: 'você escolhe',
    description:
      'O mesmo uso do teste completo, pelo tempo que você definir, com a projeção da autonomia total.',
  },
]

const specGroups = [
  'Processador, núcleos e threads',
  'Placa de vídeo, VRAM, potência máxima e driver',
  'Memória: módulos, canais, slots livres e se dá para fazer upgrade',
  'SSDs, modelo exato e espaço livre em cada unidade',
  'Tela: painel, tipo, brilho declarado, taxa de atualização e gama de cores',
  'Bateria: capacidade de fábrica, capacidade hoje e ciclos',
  'Wi-Fi, Bluetooth, portas USB, HDMI e leitor de cartão',
  'Câmera com reconhecimento facial e leitor de digital',
]

const steps = [
  {
    title: 'Instale e abra',
    description:
      'O Bench Labs reconhece o seu notebook na hora e já mostra tudo o que está acontecendo por dentro.',
  },
  {
    title: 'Escolha o que testar',
    description:
      'Use um perfil pronto ou monte a sua lista. Antes de começar, o app confere se o notebook está na tomada e no modo de energia certo.',
  },
  {
    title: 'Veja as notas',
    description:
      'Cada teste tem a sua nota, e todos os resultados ficam salvos no histórico para você comparar depois.',
  },
]

function DownloadButton({
  variant = 'primary',
  className,
}: {
  variant?: 'primary' | 'dark'
  className?: string
}) {
  const base =
    'inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold uppercase tracking-wide transition-[background-color,transform,box-shadow]'
  const colors =
    variant === 'primary'
      ? 'bg-[#ffe01b] text-[#120d1a] shadow-[0_12px_32px_-12px_rgba(255,224,27,0.7)] hover:bg-[#fff05c]'
      : 'bg-[#120d1a] text-white hover:bg-[#241c31]'

  if (!BENCH_LABS_DOWNLOAD_URL) {
    return (
      <span
        aria-disabled="true"
        className={cn(base, colors, 'cursor-default opacity-90', className)}
      >
        <Download className="size-4" aria-hidden="true" />
        Download em breve
      </span>
    )
  }

  return (
    <a
      href={BENCH_LABS_DOWNLOAD_URL}
      download="Bench-Labs.exe"
      className={cn(base, colors, 'active:scale-[0.97]', className)}
    >
      <Download className="size-4" aria-hidden="true" />
      Baixar para Windows
    </a>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-[#ffe01b]">
      {children}
    </p>
  )
}

/* Community FPS screenshot — restore with the section.
function Screenshot({
  src,
  alt,
  sizes,
  className,
}: {
  src: StaticImageData
  alt: string
  sizes: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-white/10 bg-[#16111f] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]',
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        sizes={sizes}
        placeholder="blur"
        className="w-full"
      />
    </div>
  )
}

*/

export default function BenchLabsPage() {
  return (
    <main className="relative overflow-hidden bg-[#0f0b16] text-white">
      {/* Hero */}
      <section className="relative py-16 sm:pt-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 size-[720px] max-w-full -translate-x-1/2 -translate-y-1/3 rounded-full bg-[#ffe01b]/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]"
        />

        <div className="container relative text-center max-sm:px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ffe01b]/30 bg-[#ffe01b]/10 px-3 py-1 text-xs font-semibold text-[#ffe01b]">
            <FlaskConical className="size-3.5" aria-hidden="true" />
            Novo app do Bench Promos
          </div>

          <h1 className="mt-6 text-6xl font-bold tracking-tight text-[#ffe01b] sm:text-8xl">
            Bench Labs
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-balance text-3xl font-bold tracking-tight sm:text-5xl">
            Descubra do que o seu notebook é capaz{' '}
            <span className="text-[#ffe01b]">de verdade.</span>
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-white/70 sm:text-lg">
            O <strong className="font-semibold text-white">Bench Labs</strong> é
            o laboratório do Bench Promos instalado no seu notebook. Teste
            jogos, processador, SSD e IA, meça a bateria em uso real e acompanhe
            tudo o que acontece por dentro, ao vivo.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <DownloadButton />
            <Link
              href="#testes"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 px-6 text-sm font-semibold text-white/90 transition-colors hover:bg-white/[0.06]"
            >
              Ver o que ele testa
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <p className="mt-4 font-mono text-xs text-white/40">
            Para notebooks com Windows
          </p>

          <div className="relative mt-14">
            <div
              aria-hidden="true"
              className="absolute inset-x-10 -bottom-6 top-10 rounded-[2rem] bg-[#ffe01b]/20 blur-3xl"
            />
            <DemoFrame
              view="inicio"
              title="Bench Labs: notebook de exemplo com sensores simulados"
              className="relative"
              height={900}
            />
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="border-y border-white/[0.08] bg-white/[0.02]">
        <dl className="container grid grid-cols-2 max-sm:px-4 lg:grid-cols-4">
          {highlights.map((item) => (
            <div
              key={item.label}
              className="flex flex-col gap-1 px-2 py-8 text-center"
            >
              <dt className="order-2 text-sm text-white/60">{item.label}</dt>
              <dd className="order-1 text-3xl font-bold tabular-nums text-[#ffe01b]">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Monitor */}
      <section id="monitor" className="scroll-mt-20 py-20 sm:py-28">
        <div className="container max-sm:px-4">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Ao vivo · visto por dentro</Eyebrow>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Veja o seu notebook trabalhando
            </h2>
            <p className="mt-4 text-pretty text-white/70">
              Consumo em watts, temperatura e uso do processador e da placa de
              vídeo, memória, armazenamento, bateria e modo de energia. Tudo
              atualizado a cada 2 segundos, em três visuais diferentes.
            </p>
          </div>

          <div className="mt-10">
            <MonitorShowcase />
          </div>
        </div>
      </section>

      {/* Testes */}
      <section
        id="testes"
        className="scroll-mt-20 border-t border-white/[0.08] py-20 sm:py-28"
      >
        <div className="container max-sm:px-4">
          <div className="grid items-end gap-6 lg:grid-cols-2">
            <div>
              <Eyebrow>Bench Marks</Eyebrow>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Um teste para cada jeito de usar o notebook
              </h2>
            </div>
            <p className="text-pretty text-white/70">
              Cada teste tem a sua própria nota. Rode um só, vários ou a
              sequência completa. Ou escolha um perfil pronto e deixe o Bench
              Labs montar a lista para você.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm text-white/50">Perfis prontos:</span>
            {profiles.map((profile, index) => (
              <span
                key={profile}
                className={cn(
                  'rounded-full border px-3 py-1 text-sm font-medium',
                  index === 0
                    ? 'border-[#ffe01b] bg-[#ffe01b] text-[#120d1a]'
                    : 'border-white/15 text-white/80',
                )}
              >
                {profile}
              </span>
            ))}
          </div>

          <ul className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {tests.map((test) => (
              <li
                key={test.name}
                className="flex flex-col rounded-2xl border border-white/[0.08] bg-[#1a1424] p-5 transition-colors hover:border-[#ffe01b]/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#ffe01b]/25 bg-[#ffe01b]/10 text-[#ffe01b]">
                    <test.icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold leading-tight">{test.name}</h3>
                    <p className="mt-0.5 font-mono text-xs text-white/50">
                      {test.duration}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-pretty text-sm leading-relaxed text-white/65">
                  {test.description}
                </p>
              </li>
            ))}
          </ul>

          <DemoFrame
            view="testes"
            title="Explore os testes e perfis do Bench Labs"
            className="mt-12"
            height={900}
          />
        </div>
      </section>

      {/* FPS da comunidade — oculto até o lançamento.
      <section
        id="comunidade"
        className="scroll-mt-20 border-t border-white/[0.08] py-20 sm:py-28"
      >
        <div className="container max-sm:px-4">
          <div className="grid items-end gap-6 lg:grid-cols-2">
            <div>
              <Eyebrow>Jogos · FPS da comunidade</Eyebrow>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Quanto FPS os jogos rodam de verdade
              </h2>
            </div>
            <div>
              <p className="text-pretty text-white/70">
                Rode os seus próprios testes nos jogos mais jogados e compare
                com os resultados da comunidade: FPS médio, 1% low e quantos
                testes existem por trás de cada número.
              </p>
              <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#ffe01b]/30 bg-[#ffe01b]/10 px-3 py-1 text-xs font-semibold text-[#ffe01b]">
                <Share2 className="size-3.5" aria-hidden="true" />
                Em breve: compartilhe os seus resultados com a comunidade
              </p>
            </div>
          </div>

          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {communityPoints.map((point) => (
              <li
                key={point.title}
                className="rounded-2xl border border-white/[0.08] bg-[#1a1424] p-5"
              >
                <span className="flex size-10 items-center justify-center rounded-lg border border-[#ffe01b]/25 bg-[#ffe01b]/10 text-[#ffe01b]">
                  <point.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-semibold">{point.title}</h3>
                <p className="mt-1.5 text-pretty text-sm leading-relaxed text-white/65">
                  {point.description}
                </p>
              </li>
            ))}
          </ul>

          <Screenshot
            src={fpsComunidade}
            alt="Tabela de FPS da comunidade no Bench Labs com Fortnite, Forza Horizon 5, Red Dead Redemption 2, Cyberpunk 2077, Hogwarts Legacy, Valorant e Counter-Strike 2"
            sizes="(max-width: 1500px) 100vw, 1500px"
            className="mt-12"
          />
        </div>
      </section>
      */}

      <section
        id="bench-monitor"
        className="scroll-mt-20 border-t border-white/[0.08] py-20 sm:py-28"
      >
        <div className="container max-sm:px-4">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Bench Monitor</Eyebrow>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Seus jogos, com os números à vista
            </h2>
            <p className="mt-4 text-pretty text-white/70">
              Veja o painel de FPS, os atalhos e a lista de benchmarks gravados.
              Os registros abaixo são exemplos locais do notebook da
              demonstração.
            </p>
          </div>
          <DemoFrame
            view="monitor"
            title="Bench Monitor com exemplos de benchmarks gravados"
            className="mt-10"
            height={900}
          />
        </div>
      </section>

      {/* Bateria */}
      <section
        id="bateria"
        className="scroll-mt-20 border-t border-white/[0.08] py-20 sm:py-28"
      >
        <div className="container grid items-center gap-12 max-sm:px-4 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <Eyebrow>Teste de autonomia</Eyebrow>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Bateria medida em uso real, não em tela parada
            </h2>
            <p className="mt-4 text-pretty text-white/70">
              O notebook navega na internet, escreve no Word, monta planilhas no
              Excel e reproduz vídeos sozinho, com os programas abertos como no
              dia a dia, até a bateria acabar. Brilho, volume e rede ficam
              padronizados para o resultado ser comparável.
            </p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {batteryModes.map((mode) => (
                <li
                  key={mode.name}
                  className={cn(
                    'rounded-2xl border p-4',
                    mode.featured
                      ? 'border-[#ffe01b]/60 bg-[#ffe01b]/[0.06]'
                      : 'border-white/[0.08] bg-[#1a1424]',
                  )}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-semibold">{mode.name}</h3>
                    <span className="shrink-0 font-mono text-xs text-white/50">
                      {mode.duration}
                    </span>
                  </div>
                  <p className="mt-1.5 text-pretty text-sm text-white/65">
                    {mode.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <DemoFrame
            view="bateria"
            title="Escolha os modos do teste de bateria"
            height={920}
          />
        </div>
      </section>

      {/* Laudo */}
      <section
        id="laudo"
        className="scroll-mt-20 border-t border-white/[0.08] py-20 sm:py-28"
      >
        <div className="container max-sm:px-4">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Laudo de saúde</Eyebrow>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Saiba se está tudo bem antes que vire problema
            </h2>
            <p className="mt-4 text-pretty text-white/70">
              O Bench Labs analisa bateria, armazenamento, refrigeração, driver
              de vídeo e memória e avisa o que merece atenção. Ótimo para
              conferir um notebook novo ou um usado antes de comprar.
            </p>
          </div>

          <DemoFrame
            view="inicio"
            detail="laudo"
            title="Laudo de saúde do notebook de exemplo"
            className="mt-10"
            height={260}
          />
        </div>
      </section>

      {/* Ficha técnica */}
      <section
        id="ficha"
        className="scroll-mt-20 border-t border-white/[0.08] py-20 sm:py-28"
      >
        <div className="container grid items-center gap-12 max-sm:px-4 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <Eyebrow>Ficha técnica · lida do hardware</Eyebrow>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Tudo sobre o seu notebook, em uma página
            </h2>
            <p className="mt-4 text-pretty text-white/70">
              Sem caçar informação em vários programas. O Bench Labs lê direto
              do hardware e organiza a ficha completa, pronta para copiar ou
              salvar e compartilhar.
            </p>

            <ul className="mt-8 space-y-3">
              {specGroups.map((spec) => (
                <li key={spec} className="flex gap-3 text-sm text-white/80">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-[#ffe01b]"
                    aria-hidden="true"
                  />
                  {spec}
                </li>
              ))}
            </ul>
          </div>

          <DemoFrame
            view="ficha"
            detail="tela"
            title="Detalhes da tela e cobertura de cores"
            width={420}
            height={740}
            className="mx-auto w-full max-w-sm lg:mx-0 lg:justify-self-end"
          />
        </div>

        <div className="container mt-12 max-sm:px-4">
          <DemoFrame
            view="ficha"
            title="Ficha técnica completa do notebook de exemplo"
            height={1050}
          />
        </div>
      </section>

      {/* Do seu jeito */}
      <section className="border-t border-white/[0.08] py-20 sm:py-28">
        <div className="container grid items-center gap-12 max-sm:px-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="min-w-0 max-lg:order-2">
            <ColorShowcase />
          </div>

          <div>
            <Eyebrow>E mais</Eyebrow>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Feito para acompanhar o seu notebook
            </h2>

            <ul className="mt-8 space-y-6">
              {[
                {
                  icon: History,
                  title: 'Histórico de resultados',
                  description:
                    'Todas as notas ficam salvas para comparar antes e depois de uma atualização, de um upgrade ou de uma limpeza.',
                },
                {
                  icon: ClipboardCheck,
                  title: 'Checklist antes de testar',
                  description:
                    'Na tomada, modo de energia, temperaturas disponíveis e carga da bateria: o app avisa o que falta para o teste refletir todo o desempenho.',
                },
                {
                  icon: Palette,
                  title: 'Com a sua cor',
                  description:
                    'Troque a cor de destaque do app para combinar com o seu setup.',
                },
              ].map((item) => (
                <li key={item.title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#ffe01b]/25 bg-[#ffe01b]/10 text-[#ffe01b]">
                    <item.icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 text-pretty text-sm text-white/65">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Atualizações */}
      <section
        id="atualizacoes"
        className="scroll-mt-20 border-t border-white/[0.08] py-20 sm:py-28"
      >
        <div className="container max-sm:px-4">
          <div className="grid items-end gap-6 lg:grid-cols-2">
            <div>
              <Eyebrow>Windows, drivers e programas</Eyebrow>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Este notebook está em dia?
              </h2>
            </div>
            <p className="text-pretty text-white/70">
              Confira atualizações do Windows, o driver de vídeo, programas
              desatualizados e o histórico em um só lugar. Explore também o guia
              de primeiros passos, com a taxa de atualização da tela e os
              cuidados com a bateria.
            </p>
          </div>
          <DemoFrame
            view="preparo"
            title="Atualizações e guia de primeiros passos do Bench Labs"
            className="mt-10"
            height={900}
          />
        </div>
      </section>

      {/* Como funciona */}
      <section className="border-t border-white/[0.08] py-20 sm:py-28">
        <div className="container max-sm:px-4">
          <div className="text-center">
            <Eyebrow>Como funciona</Eyebrow>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Do download à nota em poucos minutos
            </h2>
          </div>

          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-2xl border border-white/[0.08] bg-[#1a1424] p-6"
              >
                <span className="font-mono text-sm font-semibold tabular-nums text-[#ffe01b]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-pretty text-sm text-white/65">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA final */}
      <section className="container pb-24 max-sm:px-4">
        <div className="relative overflow-hidden rounded-3xl bg-[#ffe01b] px-6 py-14 text-center text-[#120d1a] sm:px-12">
          <ScanLine
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-10 size-64 text-[#120d1a]/[0.06]"
          />
          <BatteryCharging
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-12 -left-8 size-56 text-[#120d1a]/[0.06]"
          />
          <Timer
            aria-hidden="true"
            className="pointer-events-none absolute right-1/4 top-1/2 size-24 text-[#120d1a]/[0.04] max-md:hidden"
          />

          <h2 className="relative mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Coloque o seu notebook à prova
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-pretty text-[#120d1a]/75">
            Baixe o Bench Labs e descubra como ele se sai em jogos, trabalho, IA
            e bateria.
          </p>
          <div className="relative mt-8 flex justify-center">
            <DownloadButton variant="dark" />
          </div>
        </div>
      </section>
    </main>
  )
}
