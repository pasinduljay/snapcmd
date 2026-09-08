import { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react'
import { Search, Sun, Moon, Upload, Plus, Settings2, Archive } from 'lucide-react'
import * as db from './lib/db'
import { useTheme } from './hooks/useTheme'
import { useConfirm } from './hooks/useConfirm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import SnippetCard from './components/SnippetCard'
import UpdateBanner from './components/UpdateBanner'


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

  async function deleteCategory(name, fallback) {
    const remaining = categories.filter((c) => c !== name)
    const targetFallback = fallback !== undefined ? fallback : (remaining[0] ?? '')
    await db.deleteCategory(name, targetFallback)
    setSnippets((prev) =>
      prev.map((s) => (s.category === name ? { ...s, category: targetFallback } : s)),
    )
    setCategories(remaining)
    if (activeCategory === name) setActiveCategory('All')
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
      <header className="sticky top-0 z-20 -mx-4 border-b border-border/60 bg-background/80 backdrop-blur-xl px-4 py-3 sm:-mx-6 sm:px-6 transition-colors">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-muted-foreground" />
            <input
              ref={searchRef}
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
              placeholder="Search commands, tags, notes…"
              className="h-9 w-full rounded-xl border border-border/80 bg-muted/40 pl-9 pr-8 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:bg-background focus:outline-none"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border/80 bg-background/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground shadow-xs">
              /
            </kbd>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="shrink-0 rounded-xl border-border/70 hover:border-primary/40"
          >
            {theme === 'dark' ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-slate-700" />}
          </Button>
        </div>

        {/* ── Segmented Category Pill Track ── */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {['All', ...categories].map((cat) => {
            const active = activeCategory === cat
            const count = cat === 'All' ? snippets.length : (counts[cat] ?? 0)
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`group flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-medium transition-colors duration-150 ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                    : 'border-transparent bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono leading-none ${
                    active
                      ? 'bg-primary-foreground/20 text-primary-foreground font-bold'
                      : 'bg-muted-foreground/15 text-muted-foreground group-hover:text-foreground'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setManaging(true)}
            className="flex items-center gap-1 rounded-full border border-dashed border-border/80 px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
            title="Manage categories"
          >
            <Settings2 className="size-3.5" />
            <span>Manage</span>
          </button>
        </div>
      </header>

      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-xs font-medium text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? 'snippet' : 'snippets'}
            {activeCategory !== 'All' && <span className="text-foreground"> in {activeCategory}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBackingUp(true)}
            title="Export snippets"
            className="rounded-xl border-border/80 hover:border-primary/40"
          >
            <Archive className="size-3.5" /> <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => importRef.current?.click()}
            title="Import snippets"
            className="rounded-xl border-border/80 hover:border-primary/40"
          >
            <Upload className="size-3.5" /> <span className="hidden sm:inline">Import</span>
          </Button>
          <input ref={importRef} type="file" accept=".json" onChange={importJson} className="hidden" />
          <Button
            size="sm"
            onClick={() => setModal({ snippet: null })}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-sm shadow-emerald-500/25 border-0 font-medium"
          >
            <Plus className="size-4" /> New snippet
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold hover:opacity-80">
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-24 flex justify-center">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-24 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-lg shadow-primary/10">
            <Search className="size-7" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">
              {snippets.length === 0 ? 'No snippets yet' : 'No matching snippets found'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              {snippets.length === 0
                ? 'Click "+ New snippet" to create your first command snippet.'
                : 'Try refining your search keyword or selecting "All" categories.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
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
