import { useState } from 'react'
import { Pencil, Trash2, Check, X, FolderKanban } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPanel,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useConfirm } from '../hooks/useConfirm'

export default function CategoryManager({ categories, counts, onRename, onDelete, onClose }) {
  const confirm = useConfirm()
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  function startEdit(name) {
    setEditing(name)
    setDraft(name)
    setError(null)
  }

  async function commitRename(name) {
    const next = draft.trim()
    if (!next || next === name) {
      setEditing(null)
      return
    }
    if (categories.some((c) => c.toLowerCase() === next.toLowerCase())) {
      setError(`A category named "${next}" already exists.`)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onRename(name, next)
      setEditing(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(name) {
    const count = counts[name] ?? 0
    const remaining = categories.filter((c) => c !== name)
    const fallback = remaining[0] ?? ''
    const ok = await confirm({
      title: `Delete "${name}"?`,
      description:
        count > 0
          ? remaining.length > 0
            ? `Its ${count} snippet${count === 1 ? '' : 's'} will move to "${fallback}".`
            : `Its ${count} snippet${count === 1 ? '' : 's'} will have no category.`
          : undefined,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    setBusy(true)
    setError(null)
    try {
      await onDelete(name, fallback)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-3xl border border-border/80 bg-background/95 backdrop-blur-2xl shadow-2xl p-6">
        <DialogHeader className="p-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <FolderKanban className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold tracking-tight">Manage Categories</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Rename or delete snippet categories.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogPanel className="flex flex-col gap-2 p-0 pt-2 max-h-80 overflow-y-auto pr-1">
          {error && (
            <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive-foreground">
              {error}
            </p>
          )}

          {categories.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">
              No categories created yet.
            </p>
          ) : (
            categories.map((name) => (
              <div
                key={name}
                className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 px-3.5 py-2.5 transition-colors"
              >
                {editing === name ? (
                  <>
                    <input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          commitRename(name)
                        }
                        if (e.key === 'Escape') setEditing(null)
                      }}
                      className="flex-1 rounded-lg border border-primary/60 bg-background px-2.5 py-1 text-xs text-foreground outline-none"
                    />
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        disabled={busy}
                        onClick={() => commitRename(name)}
                        title="Save"
                        className="rounded-lg text-primary hover:bg-primary/10"
                      >
                        <Check className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setEditing(null)}
                        title="Cancel"
                        className="rounded-lg text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate text-xs font-semibold text-foreground">{name}</span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {counts[name] ?? 0}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        disabled={busy}
                        onClick={() => startEdit(name)}
                        title="Rename"
                        className="rounded-lg text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        disabled={busy}
                        onClick={() => handleDelete(name)}
                        title="Delete"
                        className="rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </DialogPanel>
      </DialogContent>
    </Dialog>
  )
}
