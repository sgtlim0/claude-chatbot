'use client'

interface StatProps {
  label: string
  value: string | number
  unit?: string
}

export function Stat({ label, value, unit }: StatProps) {
  return (
    <div className="bg-bg-tertiary rounded-lg p-3">
      <div className="text-[11px] text-text-muted font-mono uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-lg font-semibold text-text-primary font-mono">
        {value}
        {unit && <span className="text-xs text-text-muted ml-1">{unit}</span>}
      </div>
    </div>
  )
}
