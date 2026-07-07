import { useState } from 'react'
import { Pencil, Trash2, Check, X, Lock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPanel,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useConfirm } from '../hooks/useConfirm'

export default function CategoryManager({ categories, counts, onRename, onDelete, onClose }) {
  const confirm = useConfirm()
  const [editing, setEditing] = useState(null) // category name being renamed
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
    const ok = await confirm({
      title: `Delete "${name}"?`,
      description:
        count > 0
          ? `Its ${count} snippet${count === 1 ? '' : 's'} will move to General.`
          : undefined,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    setBusy(true)
    setError(null)
    try {
      await onDelete(name)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage categories</DialogTitle>
          <DialogDescription>
            Rename or delete categories. Snippets in a deleted category move to General.
          </DialogDescription>
        </DialogHeader>

        <DialogPanel className="flex flex-col gap-1 pb-6">
          {error && (
            <p className="mb-2 rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive-foreground dark:bg-destructive/16">
              {error}
            </p>
          )}

          {categories.map((name) => (
            <div
              key={name}
              className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2"
            >
              {editing === name ? (
                <>
                  <Input
                    size="sm"
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
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={busy}
                    onClick={() => commitRename(name)}
                    title="Save"
                    className="text-primary"
                  >
                    <Check />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditing(null)}
                    title="Cancel"
                  >
                    <X />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate text-sm">{name}</span>
                  <Badge variant="secondary" size="sm" className="font-mono font-normal">
                    {counts[name] ?? 0}
                  </Badge>
                  {name === 'General' ? (
                    <span title="General is the fallback category and cannot be changed">
                      <Lock className="size-3.5 text-muted-foreground/60" />
                    </span>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={busy}
                        onClick={() => startEdit(name)}
                        title="Rename"
                        className="text-muted-foreground"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={busy}
                        onClick={() => handleDelete(name)}
                        title="Delete"
                        className="text-muted-foreground hover:bg-destructive/8 hover:text-destructive-foreground"
                      >
                        <Trash2 />
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          ))}
        </DialogPanel>
      </DialogContent>
    </Dialog>
  )
}
