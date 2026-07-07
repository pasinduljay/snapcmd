import { useEffect, useMemo, useState } from 'react'
import { Download, Trash2, RotateCcw, Archive } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'

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
      setStatus(`Backup created: ${backup.snippet_count} snippet${backup.snippet_count === 1 ? '' : 's'}.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function downloadBackup(backup) {
    const blob = new Blob([JSON.stringify(backup.data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `snapcmd-backup-${backup.created_at.slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function restoreBackup(backup) {
    const ok = await confirm({
      title: 'Restore this backup?',
      description:
        'Snippets from this backup that you no longer have will be added back. Nothing currently in your vault will be changed or removed.',
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
          (skipped > 0 ? ` (${skipped} already existed and were skipped).` : '.'),
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteBackup(backup) {
    const ok = await confirm({
      title: 'Delete this backup?',
      description: 'This only removes the saved snapshot, not your current snippets.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    await db.deleteBackup(backup.id)
    setBackups((prev) => prev.filter((b) => b.id !== backup.id))
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Backups</DialogTitle>
          <DialogDescription>
            Save a snapshot of your snippets, and restore it later if anything is lost.
          </DialogDescription>
        </DialogHeader>

        <DialogPanel className="flex flex-col gap-5">
          {error && (
            <p className="rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive-foreground dark:bg-destructive/16">
              {error}
            </p>
          )}
          {status && (
            <p className="rounded-lg bg-info/8 px-3 py-2 text-sm text-info-foreground dark:bg-info/16">
              {status}
            </p>
          )}

          <div>
            <p className="text-sm font-medium">Create a backup</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge
                variant="outline"
                render={<button type="button" onClick={() => setSelected(null)} />}
                className={`cursor-pointer rounded-full px-3 font-normal ${
                  selected === null
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                All categories
              </Badge>
              {categories.map((cat) => (
                <Badge
                  key={cat}
                  variant="outline"
                  render={<button type="button" onClick={() => toggleCategory(cat)} />}
                  className={`cursor-pointer rounded-full px-3 font-normal ${
                    selected?.has(cat)
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  {cat}
                </Badge>
              ))}
            </div>
            <Button
              size="sm"
              className="mt-3"
              disabled={busy || scopedSnippets.length === 0}
              onClick={handleCreateBackup}
            >
              <Archive /> Back up {scopedSnippets.length} snippet{scopedSnippets.length === 1 ? '' : 's'}
            </Button>
          </div>

          <div>
            <p className="text-sm font-medium">Your backups</p>
            {loading ? (
              <div className="mt-3 flex justify-center">
                <Spinner className="size-5" />
              </div>
            ) : backups.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No backups yet.</p>
            ) : (
              <div className="mt-2 flex flex-col gap-1">
                {backups.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{formatDate(b.created_at)}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {b.scope} &middot; {b.snippet_count} snippet{b.snippet_count === 1 ? '' : 's'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={busy}
                      onClick={() => downloadBackup(b)}
                      title="Download"
                      className="text-muted-foreground"
                    >
                      <Download />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={busy}
                      onClick={() => restoreBackup(b)}
                      title="Restore"
                      className="text-muted-foreground"
                    >
                      <RotateCcw />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={busy}
                      onClick={() => handleDeleteBackup(b)}
                      title="Delete"
                      className="text-muted-foreground hover:bg-destructive/8 hover:text-destructive-foreground"
                    >
                      <Trash2 />
                    </Button>
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
