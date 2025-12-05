import { Trophy } from 'lucide-react'

interface VotingHeaderProps {
  year: number
}

export function VotingHeader({ year }: VotingHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:container">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
            <Trophy className="size-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Bench Awards</h1>
            <p className="font-mono text-xs text-muted-foreground">{year}</p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Vote para os melhores notebooks do ano
        </div>
      </div>
    </header>
  )
}
