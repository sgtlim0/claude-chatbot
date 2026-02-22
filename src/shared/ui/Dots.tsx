'use client'

export function Dots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-accent"
          style={{
            animation: `bounce-dots 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </span>
  )
}
