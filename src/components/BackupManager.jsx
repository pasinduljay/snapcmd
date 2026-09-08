import { useEffect, useMemo, useState } from 'react'
import { Download, Trash2, RotateCcw, Archive, Check } from 'lucide-react'
import { save } from '@tauri-apps/plugin-dialog'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import * as db from '../lib/db'
import { useConfirm } from '../hooks/useConfirm'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPanel,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

function formatDate(iso) {
  return new Date(iso.replace(' ', 'T') + 'Z').toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function BackupManager({ snippets, categories, ensureCategory, onRestored, onClose }) {
  const confirm = useConfirm()
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null) // null = "All categories"
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    db.fetchBackups()
      .then(setBackups)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function toggleCategory(name) {
    setSelected((prev) => {
      if (prev === null) return new Set([name])
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next.size === 0 ? null : next
    })
  }

  const scopedSnippets = useMemo(() => {
    if (selected === null) return snippets
    return snippets.filter((s) => selected.has(s.category))
  }, [snippets, selected])

  const scopeLabel = selected === null ? 'All categories' : [...selected].sort().join(', ')

  async function handleCreateBackup() {
    setBusy(true)
    setError(null)
    setStatus(null)
    try {
      const backup = await db.createBackup(scopeLabel, scopedSnippets)
      setBackups((prev) => [backup, ...prev])
      setStatus(`Export snapshot created: ${backup.snippet_count} snippet${backup.snippet_count === 1 ? '' : 's'}.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function downloadBackup(backup) {
    try {
      const defaultName = `snapcmd-export-${backup.created_at.slice(0, 10)}.json`
      const filePath = await save({
        defaultPath: defaultName,
        filters: [{ name: 'JSON', extensions: ['json'] }],
      })
      if (!filePath) return // user cancelled
      await writeTextFile(filePath, JSON.stringify(backup.data, null, 2))
      setStatus(`Saved export to ${filePath}`)
    } catch (err) {
      setError(`Download failed: ${err.message ?? err}`)
    }
  }

  async function restoreBackup(backup) {
    const ok = await confirm({
      title: 'Restore this backup snapshot?',
      description:
        'Snippets from this snapshot that you no longer have will be safely restored. Current snippets will not be overwritten.',
      confirmLabel: 'Restore',
    })
    if (!ok) return

    setBusy(true)
    setError(null)
    setStatus(null)
    try {
      const existingKey = (s) => `${s.title} ${s.command} ${s.category}`
      const existing = new Set(snippets.map(existingKey))
      const toRestore = backup.data.filter((s) => !existing.has(existingKey(s)))

      for (const category of new Set(toRestore.map((s) => s.category))) {
        await ensureCategory(category)
      }

      const restored = []
      for (const s of toRestore) {
        restored.push(await db.saveSnippet(s, null))
      }
      if (restored.length > 0) onRestored(restored)

      const skipped = backup.data.length - toRestore.length
      setStatus(
        `Restored ${toRestore.length} snippet${toRestore.length === 1 ? '' : 's'}` +
          (skipped > 0 ? ` (${skipped} already existed and were kept).` : '.'),
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteBackup(backup) {
    const ok = await confirm({
      title: 'Delete this snapshot?',
      description: 'This removes the saved backup file only, not your live snippets.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    await db.deleteBackup(backup.id)
    setBackups((prev) => prev.filter((b) => b.id !== backup.id))
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg rounded-3xl border border-border/80 bg-background/95 backdrop-blur-2xl shadow-2xl p-6">
        <DialogHeader className="p-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Archive className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold tracking-tight">Export & Backups</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Create portable JSON backups or restore past snippet snapshots.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogPanel className="flex flex-col gap-5 p-0 pt-2">
          {error && (
            <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive-foreground">
              {error}
            </p>
          )}
          {status && (
            <p className="rounded-xl border border-primary/20 bg-primary/10 px-3.5 py-2.5 text-xs text-primary">
              {status}
            </p>
          )}

          {/* ── Create Export Section ── */}
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Choose Scope
            </label>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150',
                  selected === null
                    ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                    : 'border-border/70 bg-background/80 text-muted-foreground hover:text-foreground',
                )}
              >
                All categories
              </button>
              {categories.map((cat) => {
                const isSelected = selected?.has(cat)
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                        : 'border-border/70 bg-background/80 text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>

            <Button
              size="sm"
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-sm shadow-emerald-500/25 border-0 font-medium"
              disabled={busy || scopedSnippets.length === 0}
              onClick={handleCreateBackup}
            >
              <Download className="size-4" /> Export {scopedSnippets.length} snippet{scopedSnippets.length === 1 ? '' : 's'}
            </Button>
          </div>

          {/* ── Snapshots History Section ── */}
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Saved Snapshots ({backups.length})
              </h4>
            </div>

            {loading ? (
              <div className="mt-4 flex justify-center py-4">
                <Spinner className="size-5 text-primary" />
              </div>
            ) : backups.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-border/80 p-4 text-center text-xs text-muted-foreground">
                No exports saved yet. Click the export button above to snapshot your vault.
              </p>
            ) : (
              <div className="mt-2.5 flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                {backups.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 p-3 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground">{formatDate(b.created_at)}</p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        <span className="font-mono text-primary">{b.snippet_count} snippets</span> &middot; {b.scope}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        disabled={busy}
                        onClick={() => downloadBackup(b)}
                        title="Save to file"
                        className="rounded-lg text-muted-foreground hover:text-foreground"
                      >
                        <Download className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        disabled={busy}
                        onClick={() => restoreBackup(b)}
                        title="Restore this snapshot"
                        className="rounded-lg text-muted-foreground hover:text-foreground"
                      >
                        <RotateCcw className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        disabled={busy}
                        onClick={() => handleDeleteBackup(b)}
                        title="Delete snapshot"
                        className="rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogPanel>
      </DialogContent>
    </Dialog>
  )
}
