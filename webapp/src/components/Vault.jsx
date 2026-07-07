import { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react'
import {
  Search,
  Sun,
  Moon,
  LogOut,
  Download,
  Upload,
  Plus,
  Settings2,
  Archive,
  UserRound,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../hooks/useTheme'
import { useConfirm } from '../hooks/useConfirm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import SnippetCard from './SnippetCard'
import Logo from './Logo'
import Wordmark from './Wordmark'

// Dialogs only mount once opened — splitting them out keeps the initial
// bundle lighter, which matters most on mobile.
const SnippetModal = lazy(() => import('./SnippetModal'))
const CategoryManager = lazy(() => import('./CategoryManager'))
const BackupManager = lazy(() => import('./BackupManager'))
const AccountSettings = lazy(() => import('./AccountSettings'))

const DEFAULT_CATEGORIES = ['Docker', 'Kubernetes', 'Linux', 'Windows', 'AWS', 'Git', 'General']
const FALLBACK_CATEGORY = 'General'

export default function Vault({ session }) {
  const { theme, toggleTheme } = useTheme()
  const confirm = useConfirm()
  const [snippets, setSnippets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [modal, setModal] = useState(null) // null | { snippet: object|null }
  const [managing, setManaging] = useState(false)
  const [backingUp, setBackingUp] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const searchRef = useRef(null)
  const importRef = useRef(null)

  useEffect(() => {
    fetchAll()
  }, [])

  // "/" focuses search from anywhere, Esc clears it
  useEffect(() => {
    function onKey(e) {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function friendlyError(err) {
    if (
      /relation .*categories.* does not exist/i.test(err.message) ||
      /could not find the table .*categories/i.test(err.message)
    ) {
      return 'Category management needs a database update: run supabase/categories.sql in the Supabase SQL Editor, then reload.'
    }
    return err.message
  }

  async function fetchAll() {
    setLoading(true)
    try {
      const [catsRes, snipsRes] = await Promise.all([
        supabase.from('categories').select('name').order('name'),
        supabase.from('snippets').select('*').order('created_at', { ascending: false }),
      ])
      if (snipsRes.error) throw snipsRes.error
      const snips = snipsRes.data ?? []
      setSnippets(snips)

      if (catsRes.error) throw catsRes.error
      const existing = new Set((catsRes.data ?? []).map((c) => c.name))

      // Seed defaults on first run; also adopt any category that exists only
      // on snippets (e.g. after a JSON import) so it becomes manageable.
      const missing = new Set()
      if (existing.size === 0) DEFAULT_CATEGORIES.forEach((n) => missing.add(n))
      if (!existing.has(FALLBACK_CATEGORY)) missing.add(FALLBACK_CATEGORY)
      snips.forEach((s) => {
        if (s.category && !existing.has(s.category)) missing.add(s.category)
      })

      if (missing.size > 0) {
        const rows = [...missing].map((name) => ({ user_id: session.user.id, name }))
        const { error: upErr } = await supabase
          .from('categories')
          .upsert(rows, { onConflict: 'user_id,name' })
        if (upErr) throw upErr
        missing.forEach((n) => existing.add(n))
      }

      setCategories([...existing].sort((a, b) => a.localeCompare(b)))
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  async function ensureCategory(name) {
    if (!name || categories.includes(name)) return
    const { error } = await supabase
      .from('categories')
      .upsert({ user_id: session.user.id, name }, { onConflict: 'user_id,name' })
    if (error) throw new Error(friendlyError(error))
    setCategories((prev) => [...new Set([...prev, name])].sort((a, b) => a.localeCompare(b)))
  }

  async function saveSnippet(values, existingId) {
    await ensureCategory(values.category)
    if (existingId) {
      const { data, error } = await supabase
        .from('snippets')
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq('id', existingId)
        .select()
        .single()
      if (error) throw error
      setSnippets((prev) => prev.map((s) => (s.id === existingId ? data : s)))
    } else {
      const { data, error } = await supabase
        .from('snippets')
        .insert({ ...values, user_id: session.user.id })
        .select()
        .single()
      if (error) throw error
      setSnippets((prev) => [data, ...prev])
    }
  }

  async function deleteSnippet(id) {
    const ok = await confirm({
      title: 'Delete this snippet?',
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    const { error } = await supabase.from('snippets').delete().eq('id', id)
    if (error) {
      setError(error.message)
      return
    }
    setSnippets((prev) => prev.filter((s) => s.id !== id))
  }

  async function shareSnippet(snippet) {
    let slug = snippet.share_slug
    if (!slug) {
      slug = crypto.randomUUID().replace(/-/g, '').slice(0, 10)
      const { data, error } = await supabase
        .from('snippets')
        .update({ share_slug: slug })
        .eq('id', snippet.id)
        .select()
        .single()
      if (error) {
        if (/share_slug.*does not exist/i.test(error.message)) {
          throw new Error(
            'Sharing needs a database update: run supabase/share_links.sql in the Supabase SQL Editor, then reload.',
          )
        }
        throw error
      }
      setSnippets((prev) => prev.map((s) => (s.id === snippet.id ? data : s)))
    }
    return `${window.location.origin}/s/${slug}`
  }

  async function renameCategory(oldName, newName) {
    const { error: catErr } = await supabase
      .from('categories')
      .update({ name: newName })
      .eq('name', oldName)
    if (catErr) throw new Error(friendlyError(catErr))
    const { error: snipErr } = await supabase
      .from('snippets')
      .update({ category: newName })
      .eq('category', oldName)
    if (snipErr) throw new Error(snipErr.message)
    setCategories((prev) =>
      [...prev.filter((c) => c !== oldName), newName].sort((a, b) => a.localeCompare(b)),
    )
    setSnippets((prev) =>
      prev.map((s) => (s.category === oldName ? { ...s, category: newName } : s)),
    )
    if (activeCategory === oldName) setActiveCategory(newName)
  }

  async function deleteCategory(name) {
    if (name === FALLBACK_CATEGORY) return
    // Reassign snippets first so nothing is orphaned if the second call fails
    const { error: snipErr } = await supabase
      .from('snippets')
      .update({ category: FALLBACK_CATEGORY })
      .eq('category', name)
    if (snipErr) throw new Error(snipErr.message)
    const { error: catErr } = await supabase.from('categories').delete().eq('name', name)
    if (catErr) throw new Error(friendlyError(catErr))
    setSnippets((prev) =>
      prev.map((s) => (s.category === name ? { ...s, category: FALLBACK_CATEGORY } : s)),
    )
    setCategories((prev) => prev.filter((c) => c !== name))
    if (activeCategory === name) setActiveCategory('All')
  }

  function exportJson() {
    const payload = snippets.map(({ title, command, notes, category, tags }) => ({
      title,
      command,
      notes,
      category,
      tags,
    }))
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `snapcmd-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function importJson(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const items = JSON.parse(await file.text())
      if (!Array.isArray(items)) throw new Error('Expected a JSON array')
      const rows = items
        .filter((it) => it.title && it.command)
        .map((it) => ({
          user_id: session.user.id,
          title: String(it.title),
          command: String(it.command),
          notes: String(it.notes ?? ''),
          category: String(it.category ?? FALLBACK_CATEGORY),
          tags: Array.isArray(it.tags) ? it.tags.map(String) : [],
        }))
      if (rows.length === 0) throw new Error('No valid snippets found in the file')
      const { error } = await supabase.from('snippets').insert(rows)
      if (error) throw error
      await fetchAll()
    } catch (err) {
      setError(`Import failed: ${err.message}`)
    }
  }

  const counts = useMemo(() => {
    const map = {}
    snippets.forEach((s) => {
      map[s.category] = (map[s.category] ?? 0) + 1
    })
    return map
  }, [snippets])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return snippets.filter((s) => {
      if (activeCategory !== 'All' && s.category !== activeCategory) return false
      if (!q) return true
      const haystack = [s.title, s.command, s.notes, s.category, ...(s.tags ?? [])]
        .join(' ')
        .toLowerCase()
      return q.split(/\s+/).every((term) => haystack.includes(term))
    })
  }, [snippets, query, activeCategory])

  return (
    <div className="mx-auto min-h-dvh max-w-6xl px-4 pb-16 sm:px-6">
      {/* Header */}
      <header className="sticky top-0 z-10 -mx-4 border-b bg-background px-4 py-4 sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-card text-primary shadow-xs">
            <Logo className="size-4.5" />
          </div>
          <h1 className="hidden sm:block"><Wordmark className="text-lg" /></h1>

          <div className="relative ml-auto w-full max-w-md">
            <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
              placeholder="Search commands, tags, notes…  ( / )"
              className="pl-9 font-mono"
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
          <Button variant="outline" size="icon" onClick={() => setAccountOpen(true)} title="Account">
            <UserRound />
          </Button>
          <Button variant="outline" onClick={() => supabase.auth.signOut()} title="Sign out">
            <LogOut /> <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>

        {/* Category chips — single scrollable row, like a bookmarks bar */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {['All', ...categories].map((cat) => {
            const active = activeCategory === cat
            const count = cat === 'All' ? snippets.length : (counts[cat] ?? 0)
            return (
              <Badge
                key={cat}
                variant="outline"
                size="lg"
                render={<button type="button" onClick={() => setActiveCategory(cat)} />}
                className={`cursor-pointer rounded-full px-3 font-normal ${
                  active
                    ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 dark:bg-primary/15'
                    : 'text-muted-foreground'
                }`}
              >
                {cat} <span className="opacity-60">{count}</span>
              </Badge>
            )
          })}
          <Badge
            variant="outline"
            size="lg"
            render={<button type="button" onClick={() => setManaging(true)} />}
            className="cursor-pointer rounded-full px-3 font-normal text-muted-foreground"
            title="Manage categories"
          >
            <Settings2 /> Manage
          </Badge>
        </div>
      </header>

      {/* Toolbar */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {filtered.length} snippet{filtered.length === 1 ? '' : 's'}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setBackingUp(true)} title="Backups">
            <Archive /> <span className="hidden sm:inline">Backups</span>
          </Button>
          <Button variant="outline" size="sm" onClick={exportJson} title="Export">
            <Download /> <span className="hidden sm:inline">Export</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => importRef.current?.click()} title="Import">
            <Upload /> <span className="hidden sm:inline">Import</span>
          </Button>
          <input ref={importRef} type="file" accept=".json" onChange={importJson} className="hidden" />
          <Button size="sm" onClick={() => setModal({ snippet: null })}>
            <Plus /> New snippet
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-destructive/8 px-4 py-3 text-sm text-destructive-foreground dark:bg-destructive/16">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="mt-20 flex justify-center">
          <Spinner className="size-8" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-20 flex flex-col items-center text-center text-muted-foreground">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border bg-card shadow-xs">
            <Search className="size-5 opacity-60" />
          </div>
          <p className="mt-4 text-sm">
            {snippets.length === 0
              ? 'No snippets yet — click "New snippet" to save your first command.'
              : 'No snippets match your search.'}
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {filtered.map((snippet) => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              onEdit={() => setModal({ snippet })}
              onDelete={() => deleteSnippet(snippet.id)}
              onShare={() => shareSnippet(snippet)}
            />
          ))}
        </div>
      )}

      <Suspense fallback={null}>
        {modal && (
          <SnippetModal
            snippet={modal.snippet}
            categories={categories}
            onSave={saveSnippet}
            onClose={() => setModal(null)}
          />
        )}

        {managing && (
          <CategoryManager
            categories={categories}
            counts={counts}
            onRename={renameCategory}
            onDelete={deleteCategory}
            onClose={() => setManaging(false)}
          />
        )}

        {backingUp && (
          <BackupManager
            session={session}
            snippets={snippets}
            categories={categories}
            ensureCategory={ensureCategory}
            onRestored={(restored) => setSnippets((prev) => [...restored, ...prev])}
            onClose={() => setBackingUp(false)}
          />
        )}

        {accountOpen && (
          <AccountSettings session={session} onClose={() => setAccountOpen(false)} />
        )}
      </Suspense>
    </div>
  )
}
