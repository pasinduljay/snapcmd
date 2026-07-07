import { useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogPanel,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

const MIN_PASSWORD_LENGTH = 8

export default function AccountSettings({ session, onClose }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(null)
    if (password !== confirm) {
      setMessage({ type: 'error', text: "Passwords don't match." })
      return
    }
    setBusy(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setMessage({ type: 'info', text: 'Password updated.' })
      setPassword('')
      setConfirm('')
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
        </DialogHeader>

        <DialogPanel className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium">Email</p>
            <p className="mt-1 text-sm text-muted-foreground">{session.user.email}</p>
          </div>

          <Separator />

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm font-medium">Change password</p>
            <div>
              <Label htmlFor="account-new-password">New password</Label>
              <Input
                id="account-new-password"
                type="password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                At least {MIN_PASSWORD_LENGTH} characters.
              </p>
            </div>
            <div>
              <Label htmlFor="account-confirm-password">Confirm new password</Label>
              <Input
                id="account-confirm-password"
                type="password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5"
              />
            </div>

            {message && (
              <p
                className={`rounded-lg px-3 py-2 text-sm ${
                  message.type === 'error'
                    ? 'bg-destructive/8 text-destructive-foreground dark:bg-destructive/16'
                    : 'bg-info/8 text-info-foreground dark:bg-info/16'
                }`}
              >
                {message.text}
              </p>
            )}

            <Button type="submit" loading={busy}>
              Update password
            </Button>
          </form>
        </DialogPanel>
      </DialogContent>
    </Dialog>
  )
}
