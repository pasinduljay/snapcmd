import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogPanel,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

export default function SnippetModal({ snippet, categories, onSave, onClose }) {
  const [title, setTitle] = useState(snippet?.title ?? '')
  const [command, setCommand] = useState(snippet?.command ?? '')
  const [notes, setNotes] = useState(snippet?.notes ?? '')
  const [category, setCategory] = useState(snippet?.category ?? 'General')
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
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit} className="contents">
          <DialogHeader>
            <DialogTitle>{snippet ? 'Edit snippet' : 'New snippet'}</DialogTitle>
          </DialogHeader>

          <DialogPanel className="flex flex-col gap-4">
            <div>
              <Label htmlFor="snippet-title">Title</Label>
              <Input
                id="snippet-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Kill Windows process by command line"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="snippet-command">Command</Label>
              <Textarea
                id="snippet-command"
                required
                rows={3}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder={'taskkill /PID {pid} /F\n\nTip: wrap variables in {curly-braces} to get fillable fields'}
                className="mt-1.5 font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                  <Label htmlFor="snippet-new-category">New category name</Label>
                  <Input
                    id="snippet-new-category"
                    required
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Terraform"
                    className="mt-1.5"
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="snippet-tags">
                    Tags <span className="font-normal text-muted-foreground">(comma separated)</span>
                  </Label>
                  <Input
                    id="snippet-tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="process, kill, pid"
                    className="mt-1.5"
                  />
                </div>
              )}
            </div>

            {category === '__new__' && (
              <div>
                <Label htmlFor="snippet-tags-2">
                  Tags <span className="font-normal text-muted-foreground">(comma separated)</span>
                </Label>
                <Input
                  id="snippet-tags-2"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="process, kill, pid"
                  className="mt-1.5"
                />
              </div>
            )}

            <div>
              <Label htmlFor="snippet-notes">
                Notes <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="snippet-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="When to use this, gotchas, related commands…"
                className="mt-1.5"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive-foreground dark:bg-destructive/16">
                {error}
              </p>
            )}
          </DialogPanel>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              Save snippet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
