// "Snap" in the regular heading weight, "cmd" in monospace + brand green —
// splits the name into its two halves (speed / command) instead of one
// plain bold word.
export default function Wordmark({ className = '' }) {
  return (
    <span className={`font-heading font-bold tracking-tight ${className}`}>
      Snap<span className="font-mono text-primary">cmd</span>
    </span>
  )
}
