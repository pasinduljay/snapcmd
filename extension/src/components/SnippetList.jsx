import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import SnippetItem from './SnippetItem'

export default function SnippetList({ session }) {
  const [snippets, setSnippets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    supabase
      .from('snippets')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setSnippets(data ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return snippets
    return snippets.filter((s) => {
      const haystack = [s.title, s.command, s.notes, s.category, ...(s.tags ?? [])]
        .join(' ')
        .toLowerCase()
      return q.split(/\s+/).every((term) => haystack.includes(term))
    })
  }, [snippets, query])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b p-3">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search snippets…"
          className="flex-1 rounded-lg border bg-background px-3 py-1.5 font-mono text-xs outline-none focus:border-primary"
        />
        <button
          onClick={() => supabase.auth.signOut()}
          title="Sign out"
          className="shrink-0 rounded-lg border px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted"
        >
          Sign out
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {error && <p className="text-xs text-destructive">{error}</p>}

        {loading ? (
          <p className="text-center text-xs text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground">
            {snippets.length === 0
              ? 'No snippets yet — add some from the web app.'
              : 'Nothing matches your search.'}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((s) => (
              <SnippetItem key={s.id} snippet={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
