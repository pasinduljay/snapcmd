import { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react'
import { Search, Sun, Moon, Download, Upload, Plus, Settings2, Archive } from 'lucide-react'
import * as db from './lib/db'
import { useTheme } from './hooks/useTheme'
import { useConfirm } from './hooks/useConfirm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import SnippetCard from './components/SnippetCard'
import UpdateBanner from './components/UpdateBanner'
import Logo from './components/Logo'
import Wordmark from './components/Wordmark'

const SnippetModal = lazy(() => import('./components/SnippetModal'))
const CategoryManager = lazy(() => import('./components/CategoryManager'))
const BackupManager = lazy(() => import('./components/BackupManager'))

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const confirm = useConfirm()
  const [snippets, setSnippets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [modal, setModal] = useState(null)
  const [managing, setManaging] = useState(false)
  const [backingUp, setBackingUp] = useState(false)
  const searchRef = useRef(null)
  const importRef = useRef(null)

  useEffect(() => {
    load()
  }, [])

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

  async function load() {
    setLoading(true)
    try {
      const { snippets, categories } = await db.fetchAll()
      setSnippets(snippets)
      setCategories(categories)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function saveSnippet(values, existingId) {
    const saved = await db.saveSnippet(values, existingId)
    if (!categories.includes(saved.category)) {
      setCategories((prev) => [...prev, saved.category].sort((a, b) => a.localeCompare(b)))
    }
    setSnippets((prev) =>
      existingId ? prev.map((s) => (s.id === existingId ? saved : s)) : [saved, ...prev],
    )
  }

  async function deleteSnippet(id) {
    const ok = await confirm({
      title: 'Delete this snippet?',
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    await db.deleteSnippet(id)
    setSnippets((prev) => prev.filter((s) => s.id !== id))
  }

  async function renameCategory(oldName, newName) {
    await db.renameCategory(oldName, newName)
    setCategories((prev) =>
      [...prev.filter((c) => c !== oldName), newName].sort((a, b) => a.localeCompare(b)),
    )
    setSnippets((prev) =>
      prev.map((s) => (s.category === oldName ? { ...s, category: newName } : s)),
    )
    if (activeCategory === oldName) setActiveCategory(newName)
  }

  async function deleteCategory(name) {
    await db.deleteCategory(name)
    setSnippets((prev) =>
      prev.map((s) => (s.category === name ? { ...s, category: 'General' } : s)),
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
      const valid = items.filter((it) => it.title && it.command)
      if (valid.length === 0) throw new Error('No valid snippets found in the file')
      for (const it of valid) {
        await db.saveSnippet(
          {
            title: String(it.title),
            command: String(it.command),
            notes: String(it.notes ?? ''),
            category: String(it.category ?? 'General'),
            tags: Array.isArray(it.tags) ? it.tags.map(String) : [],
          },
          null,
        )
      }
      await load()
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
      <div className="-mx-4 sm:-mx-6">
        <UpdateBanner />
      </div>
      <header className="sticky top-0 z-10 -mx-4 border-b bg-background px-4 py-4 sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-card text-primary shadow-xs">
            <Logo className="size-4.5" />
          </div>
          <h1 className="hidden sm:block">
            <Wordmark className="text-lg" />
          </h1>

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
        </div>

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
            snippets={snippets}
            categories={categories}
            ensureCategory={db.ensureCategory}
            onRestored={(restored) => setSnippets((prev) => [...restored, ...prev])}
            onClose={() => setBackingUp(false)}
          />
        )}
      </Suspense>
    </div>
  )
}
