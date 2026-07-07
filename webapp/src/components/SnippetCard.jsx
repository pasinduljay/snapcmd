import { useMemo, useState } from 'react'
import { Pencil, Trash2, Copy, Check, Share2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Extract unique {placeholder} names from a command string
function getPlaceholders(command) {
  return [...new Set([...command.matchAll(/\{([a-zA-Z0-9_-]+)\}/g)].map((m) => m[1]))]
}

export default function SnippetCard({ snippet, onEdit, onDelete, onShare }) {
  const placeholders = useMemo(() => getPlaceholders(snippet.command), [snippet.command])
  const [values, setValues] = useState({})
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [shareError, setShareError] = useState(null)

  const resolved = useMemo(() => {
    let cmd = snippet.command
    for (const name of placeholders) {
      if (values[name]) cmd = cmd.replaceAll(`{${name}}`, values[name])
    }
    return cmd
  }, [snippet.command, placeholders, values])

  async function copy() {
    try {
      await navigator.clipboard.writeText(resolved)
    } catch {
      // Clipboard API can fail on non-HTTPS origins — fall back to execCommand
      const ta = document.createElement('textarea')
      ta.value = resolved
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function share() {
    setShareError(null)
    try {
      const link = await onShare()
      await navigator.clipboard.writeText(link)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 1500)
    } catch (err) {
      setShareError(err.message)
      setTimeout(() => setShareError(null), 4000)
    }
  }

  return (
    <Card className="group">
      <CardContent className="flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">{snippet.title}</h3>
            <Badge variant="secondary" className="mt-1.5 rounded-full font-normal">
              {snippet.category}
            </Badge>
          </div>
          <div className="flex shrink-0 gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={share}
              title="Copy public share link"
              className={linkCopied ? 'text-primary' : 'text-muted-foreground'}
            >
              {linkCopied ? <Check /> : <Share2 />}
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onEdit} title="Edit">
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onDelete}
              title="Delete"
              className="text-muted-foreground hover:bg-destructive/8 hover:text-destructive-foreground"
            >
              <Trash2 />
            </Button>
          </div>
        </div>

        {shareError && (
          <p className="mt-2 rounded-lg bg-destructive/8 px-3 py-2 text-xs text-destructive-foreground dark:bg-destructive/16">
            {shareError}
          </p>
        )}

        <div className="relative mt-3">
          <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-3 pr-20 font-mono text-xs leading-relaxed text-foreground">
            {resolved}
          </pre>
          <Button
            size="sm"
            variant="outline"
            onClick={copy}
            className={`absolute top-1.5 right-1.5 h-auto px-2.5 py-1 text-[11px] ${
              copied ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {copied ? (
              <>
                <Check /> Copied
              </>
            ) : (
              <>
                <Copy /> Copy
              </>
            )}
          </Button>
        </div>

        {placeholders.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {placeholders.map((name) => (
              <label key={name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-mono">{name}:</span>
                <Input
                  size="sm"
                  value={values[name] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
                  placeholder={`{${name}}`}
                  className="w-28 font-mono text-xs"
                />
              </label>
            ))}
          </div>
        )}

        {snippet.notes && (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{snippet.notes}</p>
        )}

        {snippet.tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {snippet.tags.map((tag) => (
              <Badge key={tag} variant="outline" size="sm" className="font-mono font-normal">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
