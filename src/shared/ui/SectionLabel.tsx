'use client'

interface SectionLabelProps {
  children: React.ReactNode
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">
      {children}
    </div>
  )
}
