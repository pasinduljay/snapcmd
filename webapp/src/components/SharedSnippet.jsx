import { useEffect, useState } from 'react'
import { Terminal, Copy, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

// Public, unauthenticated view for a shared snippet — rendered when the URL
// path is /s/:slug. Relies on the "Anyone can read shared snippets" RLS
// policy (supabase/share_links.sql), so no session is required here.
export default function SharedSnippet({ slug }) {
  const [snippet, setSnippet] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    supabase
      .from('snippets')
      .select('title, command, notes, category, tags')
      .eq('share_slug', slug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setSnippet(data)
        setLoading(false)
      })
  }, [slug])

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet.command)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = snippet.command
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-center gap-2 text-muted-foreground">
          <Terminal className="size-4 text-primary" />
          <span className="text-sm font-medium">Shared from Snapcmd</span>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <Spinner className="size-6" />
          </div>
        ) : notFound ? (
          <p className="text-center text-sm text-muted-foreground">
            This share link is invalid or has been revoked.
          </p>
        ) : (
          <Card>
            <CardContent>
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-lg font-semibold">{snippet.title}</h1>
                <Badge variant="secondary" className="rounded-full font-normal">
                  {snippet.category}
                </Badge>
              </div>

              <div className="relative mt-4">
                <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-3 pr-20 font-mono text-xs leading-relaxed">
                  {snippet.command}
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

              {snippet.notes && (
                <p className="mt-4 text-sm text-muted-foreground">{snippet.notes}</p>
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
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Want your own command vault?{' '}
          <a href="/" className="font-medium text-primary hover:underline">
            Try Snapcmd
          </a>
        </p>
      </div>
    </div>
  )
}
