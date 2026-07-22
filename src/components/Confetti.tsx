const COLORS = ['#a855f7', '#d946ef', '#22c55e', '#facc15', '#38bdf8']
const PIECES = Array.from({ length: 16 }, (_, i) => i)

/** Lightweight, dependency-free confetti burst for completed streaks. */
export function Confetti() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {PIECES.map((i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${(i / PIECES.length) * 100}%`,
            backgroundColor: COLORS[i % COLORS.length],
            animationDelay: `${(i % 5) * 0.12}s`,
          }}
        />
      ))}
    </div>
  )
}
