import { useMemo, useState } from 'react'
import { Pencil, Trash2, Copy, Check, Terminal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

function getPlaceholders(command) {
  return [...new Set([...command.matchAll(/\{([a-zA-Z0-9_-]+)\}/g)].map((m) => m[1]))]
}

/* ── Pro-grade category logos matching Termius style ── */
function GitIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <line x1="6" y1="8.5" x2="6" y2="15.5" />
      <circle cx="18" cy="9" r="2.5" />
      <path d="M6 18a9 9 0 0 1 9-9h0.5" />
    </svg>
  )
}

function DockerIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M13.98 10.05h1.96v1.94h-1.96v-1.94zm-2.6 0h1.96v1.94h-1.96v-1.94zm-2.6 0h1.96v1.94H8.78v-1.94zm-2.6 0h1.96v1.94H6.18v-1.94zm7.8-2.6h1.96v1.94h-1.96V7.45zm-2.6 0h1.96v1.94h-1.96V7.45zm-2.6 0h1.96v1.94H8.78V7.45zm2.6-2.6h1.96v1.94h-1.96V4.85zM22.5 11.5c-.32-.23-1.04-.3-1.63-.07-.15-.75-.68-1.37-1.42-1.68l-.45-.19-.3.38c-.46.58-.75 1.34-.84 2.14-.52-.08-1.07-.07-1.62.06H2.6c-.34 0-.67.14-.91.38-.25.25-.38.58-.38.93 0 3.32 1.63 6.09 4.34 7.37 1.44.68 3.03 1.04 4.67 1.04 5.37 0 9.87-3.64 10.74-8.85.83.05 1.8-.18 2.38-.85l.37-.43-.31-.44z" />
    </svg>
  )
}

function KubernetesIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.5 20.2 7.2v9.6L12 21.5l-8.2-4.7V7.2L12 2.5zm0 2.3L5.8 8.4v7.2L12 19.1l6.2-3.5V8.4L12 4.8zm0 3.2a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 1.8a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4z" />
    </svg>
  )
}

function AwsIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  )
}

function WindowsIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M3.5 5.7 10.4 4.7v6.3H3.5V5.7zm0 6.3h6.9v6.3l-6.9-1V12zm7.9-7.5L20.5 3v8H11.4V4.5zm9.1 7.5v8l-9.1-1.3V12h9.1z" />
    </svg>
  )
}

function LinuxIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="5 7 11 12 5 17" />
      <line x1="13" y1="17" x2="19" y2="17" />
    </svg>
  )
}

function TermiusBrackets({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 4H7a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1" />
      <path d="M16 4h1a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-1" />
    </svg>
  )
}

const CATEGORY_MAP = {
  Docker: {
    container: 'bg-[#0f283d] text-[#38bdf8] border-[#1d4b6e]/50',
    Icon: DockerIcon,
  },
  Kubernetes: {
    container: 'bg-[#12233f] text-[#60a5fa] border-[#1e3a6c]/50',
    Icon: KubernetesIcon,
  },
  AWS: {
    container: 'bg-[#291e12] text-[#fbbf24] border-[#4d381c]/50',
    Icon: AwsIcon,
  },
  Git: {
    container: 'bg-[#27181c] text-[#fb7185] border-[#4a2630]/50',
    Icon: GitIcon,
  },
  Linux: {
    container: 'bg-[#221831] text-[#c084fc] border-[#412a60]/50',
    Icon: LinuxIcon,
  },
  Windows: {
    container: 'bg-[#0f243d] text-[#60a5fa] border-[#1d4470]/50',
    Icon: WindowsIcon,
  },
  General: {
    container: 'bg-[#0c2e50] text-white border-[#19497a]/50',
    Icon: TermiusBrackets,
  },
}

function getCategoryMeta(category) {
  return CATEGORY_MAP[category] ?? CATEGORY_MAP.General
}

export default function SnippetCard({ snippet, onEdit, onDelete }) {
  const placeholders = useMemo(() => getPlaceholders(snippet.command), [snippet.command])
  const [values, setValues] = useState({})
  const [copied, setCopied] = useState(false)
  const meta = getCategoryMeta(snippet.category)
  const IconComponent = meta.Icon

  const resolved = useMemo(() => {
    let cmd = snippet.command
    for (const name of placeholders) {
      if (values[name]) cmd = cmd.replaceAll(`{${name}}`, values[name])
    }
    return cmd
  }, [snippet.command, placeholders, values])

  async function copy(e) {
    e?.stopPropagation()
    await navigator.clipboard.writeText(resolved)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 text-card-foreground shadow-xs dark:border-white/[0.08] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-colors duration-150 hover:border-border dark:hover:border-white/[0.16] dark:hover:bg-[oklch(0.205_0.028_260)]">
      <div>
        {/* ── Header: Pro Icon + Title + Clean Category + Actions ── */}
        <div className="flex items-start gap-3">
          {/* Termius-Grade Pro Squircle Logo (Clean, crisp, zero fuzzy neon glow) */}
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-xs select-none',
              meta.container,
            )}
          >
            <IconComponent className="size-5" />
          </div>

          {/* Title & Clean Category Label */}
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="truncate font-semibold text-[15px] leading-tight text-foreground tracking-tight">
              {snippet.title}
            </h3>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {snippet.category}
              </span>
            </div>
          </div>

          {/* Edit / Delete actions */}
          <div className="flex shrink-0 items-center gap-1 opacity-90 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onEdit}
              title="Edit snippet"
              className="text-muted-foreground hover:text-foreground rounded-lg"
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onDelete}
              title="Delete snippet"
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* ── Terminal-style Command Block ── */}
        <div
          onClick={copy}
          className="group/code relative mt-3 cursor-pointer overflow-hidden rounded-xl border border-border/70 bg-muted/40 text-foreground dark:border-white/[0.08] dark:bg-black/45 transition-colors hover:border-border"
          title="Click to copy command"
        >
          <div className="flex items-start gap-2 p-3 pr-20 font-mono text-xs leading-relaxed">
            <span className="select-none text-emerald-600 dark:text-emerald-400 font-bold opacity-80">❯</span>
            <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs text-foreground/90 dark:text-slate-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {resolved}
            </pre>
          </div>

          {/* Sleek copy button */}
          <button
            type="button"
            onClick={copy}
            className={cn(
              'absolute top-2 right-2 flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-sans font-medium transition-colors duration-150',
              copied
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-background/80 hover:bg-background text-foreground/80 hover:text-foreground border border-border/70 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/20 dark:hover:text-white dark:border-white/10',
            )}
          >
            {copied ? (
              <>
                <Check className="size-3 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3 opacity-80" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* ── Interactive Placeholders (Fillable variables) ── */}
        {placeholders.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {placeholders.map((name) => (
              <label
                key={name}
                className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-2 py-1 text-xs text-muted-foreground"
              >
                <span className="font-mono text-[11px] text-primary font-medium">{name}:</span>
                <input
                  type="text"
                  value={values[name] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
                  placeholder={`{${name}}`}
                  className="w-24 rounded bg-background px-1.5 py-0.5 font-mono text-xs text-foreground outline-none border border-border/60 focus:border-primary"
                />
              </label>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer: Notes & Tags ── */}
      {(snippet.notes || snippet.tags?.length > 0) && (
        <div className="mt-3 flex flex-col gap-2 border-t border-border/50 pt-2.5">
          {snippet.notes && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {snippet.notes}
            </p>
          )}

          {snippet.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {snippet.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-secondary/80 px-2 py-0.5 font-mono text-[10px] text-muted-foreground border border-border/40"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
