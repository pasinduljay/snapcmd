// Custom Snapcmd mark: a fast/echo chevron (speed — "Snap") over a cursor
// bar (terminal prompt — "cmd"). Renders in the current text color, so it
// follows whatever theme it's placed in.
export default function Logo({ className = 'size-5' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M6 10 L14 16 L6 22 L8.4 16 Z" fill="currentColor" opacity="0.35" />
      <path d="M10 6 L22 16 L10 26 L14 16 Z" fill="currentColor" />
      <rect x="8" y="27" width="16" height="2.5" rx="1.25" fill="currentColor" />
    </svg>
  )
}
