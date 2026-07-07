import { useMemo, useState } from 'react'

function getPlaceholders(command) {
  return [...new Set([...command.matchAll(/\{([a-zA-Z0-9_-]+)\}/g)].map((m) => m[1]))]
}

export default function SnippetItem({ snippet }) {
  const placeholders = useMemo(() => getPlaceholders(snippet.command), [snippet.command])
  const [values, setValues] = useState({})
  const [copied, setCopied] = useState(false)

  const resolved = useMemo(() => {
    let cmd = snippet.command
    for (const name of placeholders) {
      if (values[name]) cmd = cmd.replaceAll(`{${name}}`, values[name])
    }
    return cmd
  }, [snippet.command, placeholders, values])

  async function copy() {
    await navigator.clipboard.writeText(resolved)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold">{snippet.title}</p>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
          {snippet.category}
        </span>
      </div>

      <div className="relative mt-2">
        <pre className="overflow-x-auto rounded-md border bg-muted/50 p-2 pr-14 font-mono text-[11px] leading-relaxed">
          {resolved}
        </pre>
        <button
          onClick={copy}
          className={`absolute top-1 right-1 rounded px-2 py-1 text-[10px] font-medium ${
            copied ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground border'
          }`}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {placeholders.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {placeholders.map((name) => (
            <input
              key={name}
              value={values[name] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
              placeholder={name}
              className="w-20 rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] outline-none focus:border-primary"
            />
          ))}
        </div>
      )}
    </div>
  )
}
