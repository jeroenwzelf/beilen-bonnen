import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface TopBarProps {
  backHref?: string
  backLabel?: string
  title?: string
  action?: React.ReactNode
}

export function TopBar({ backHref, backLabel, title, action }: TopBarProps) {
  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm font-mono"
          >
            <ChevronLeft className="w-4 h-4" />
            {backLabel ?? 'Terug'}
          </Link>
        )}
        {title && (
          <span className="flex-1 text-sm font-bold uppercase tracking-widest text-muted-foreground truncate">
            {title}
          </span>
        )}
        {action && <div className="ml-auto">{action}</div>}
      </div>
    </header>
  )
}
