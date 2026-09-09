import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Terminal } from 'lucide-react'

export default function SnippetModal({ snippet, categories, onSave, onClose }) {
  const [title, setTitle] = useState(snippet?.title ?? '')
  const [command, setCommand] = useState(snippet?.command ?? '')
  const [notes, setNotes] = useState(snippet?.notes ?? '')
  const [category, setCategory] = useState(snippet?.category ?? categories[0] ?? 'General')
  const [newCategory, setNewCategory] = useState('')
  const [tags, setTags] = useState(snippet?.tags?.join(', ') ?? '')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onSave(
        {
          title: title.trim(),
          command: command.trim(),
          notes: notes.trim(),
          category: category === '__new__' ? newCategory.trim() || 'General' : category,
          tags: tags
            .split(',')
            .map((t) => t.trim().replace(/^#/, ''))
            .filter(Boolean),
        },
        snippet?.id,
      )
      onClose()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg rounded-3xl border border-border/80 bg-background/95 backdrop-blur-2xl shadow-2xl p-6">
        <form onSubmit={handleSubmit} autoComplete="off" className="contents">
          <DialogHeader className="p-0 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Terminal className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold tracking-tight">
                  {snippet ? 'Edit snippet' : 'New snippet'}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-3.5 pt-1">
            <div>
              <Label htmlFor="snippet-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Title
              </Label>
              <Input
                id="snippet-title"
                required
                autoComplete="off"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 rounded-xl border-border/80"
              />
            </div>

            <div>
              <Label htmlFor="snippet-command" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Command
              </Label>
              <textarea
                id="snippet-command"
                required
                rows={3}
                autoComplete="off"
                spellCheck="false"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border/80 bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/60 transition-colors duration-150 focus:border-primary focus:outline-none dark:bg-black/45 dark:border-white/10 dark:text-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Category
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1.5 rounded-xl border-border/80">
                    <span className="flex-1 truncate text-left">
                      {category === '__new__' ? '+ New category…' : category}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/80">
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                    <SelectItem value="__new__">+ New category…</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {category === '__new__' ? (
                <div>
                  <Label htmlFor="snippet-new-category" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    New Category Name
                  </Label>
                  <Input
                    id="snippet-new-category"
                    required
                    autoComplete="off"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Enter category name…"
                    className="mt-1.5 rounded-xl border-border/80"
                    autoFocus
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="snippet-tags" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tags
                  </Label>
                  <Input
                    id="snippet-tags"
                    autoComplete="off"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="comma separated (optional)"
                    className="mt-1.5 rounded-xl border-border/80"
                  />
                </div>
              )}
            </div>

            {category === '__new__' && (
              <div>
                <Label htmlFor="snippet-tags-2" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tags
                </Label>
                <Input
                  id="snippet-tags-2"
                  autoComplete="off"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="comma separated (optional)"
                  className="mt-1.5 rounded-xl border-border/80"
                />
              </div>
            )}

            <div>
              <Label htmlFor="snippet-notes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Notes <span className="font-normal lowercase opacity-70">(optional)</span>
              </Label>
              <Textarea
                id="snippet-notes"
                rows={2}
                autoComplete="off"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1.5 rounded-xl border-border/80 text-xs"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive-foreground">
                {error}
              </p>
            )}

            <div className="mt-2 flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl border-border/80"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={busy}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-sm shadow-emerald-500/25 border-0 font-medium"
              >
                Save snippet
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
