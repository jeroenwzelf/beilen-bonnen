import { cn } from '@/lib/utils'

interface PageShellProps {
  children: React.ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <main className={cn('max-w-2xl mx-auto px-4 py-6 space-y-6', className)}>
      {children}
    </main>
  )
}
