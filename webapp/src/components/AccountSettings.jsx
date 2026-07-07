import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { TriangleAlert } from 'lucide-react'
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

function MessageBanner({ message }) {
  if (!message) return null
  return (
    <p
      className={`rounded-lg px-3 py-2 text-sm ${
        message.type === 'error'
          ? 'bg-destructive/8 text-destructive-foreground dark:bg-destructive/16'
          : 'bg-info/8 text-info-foreground dark:bg-info/16'
      }`}
    >
      {message.text}
    </p>
  )
}

export default function AccountSettings({ session, onClose }) {
  const currentEmail = session.user.email

  const [editingEmail, setEditingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [emailMessage, setEmailMessage] = useState(null)
  const [emailBusy, setEmailBusy] = useState(false)

  const [editingPassword, setEditingPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState(null)
  const [passwordBusy, setPasswordBusy] = useState(false)

  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('')
  const [deleteMessage, setDeleteMessage] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  function cancelEmail() {
    setEditingEmail(false)
    setNewEmail('')
    setConfirmEmail('')
    setEmailMessage(null)
  }

  function cancelPassword() {
    setEditingPassword(false)
    setPassword('')
    setConfirmPassword('')
    setPasswordMessage(null)
  }

  function cancelDelete() {
    setDeletingAccount(false)
    setDeleteConfirmInput('')
    setDeleteMessage(null)
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setPasswordMessage(null)
    if (password !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: "Passwords don't match." })
      return
    }
    setPasswordBusy(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setPasswordMessage({ type: 'info', text: 'Password updated.' })
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.message })
    } finally {
      setPasswordBusy(false)
    }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault()
    setDeleteMessage(null)
    if (deleteConfirmInput.trim().toLowerCase() !== currentEmail.toLowerCase()) {
      setDeleteMessage({ type: 'error', text: "That doesn't match your email." })
      return
    }
    setDeleteBusy(true)
    try {
      const { error } = await supabase.functions.invoke('delete-account')
      if (error) throw error
      // The account and everything tied to it (snippets, categories,
      // backups) is already gone server-side — just end the local session.
      await supabase.auth.signOut()
    } catch (err) {
      setDeleteMessage({ type: 'error', text: err.message })
      setDeleteBusy(false)
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault()
    setEmailMessage(null)

    const next = newEmail.trim().toLowerCase()
    const confirm = confirmEmail.trim().toLowerCase()

    if (next !== confirm) {
      setEmailMessage({ type: 'error', text: "Email addresses don't match." })
      return
    }
    if (next === currentEmail.toLowerCase()) {
      setEmailMessage({ type: 'error', text: 'That is already your current email.' })
      return
    }

    setEmailBusy(true)
    try {
      // Supabase sends a confirmation link to the new address, and — if
      // "Secure email change" is on in the project's Auth settings, which
      // it should be — also notifies the current address, so an attacker
      // with a hijacked session can't silently lock the real owner out.
      // The change only takes effect once the link(s) are clicked.
      const { error } = await supabase.auth.updateUser({ email: next })
      if (error) throw error
      setEmailMessage({
        type: 'info',
        text: `Confirmation link sent to ${next}. Your email won't change until you click it.`,
      })
      setNewEmail('')
      setConfirmEmail('')
    } catch (err) {
      setEmailMessage({ type: 'error', text: err.message })
    } finally {
      setEmailBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
        </DialogHeader>

        <DialogPanel className="flex flex-col gap-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="mt-1 text-sm text-muted-foreground">{currentEmail}</p>
              </div>
              {!editingEmail && (
                <Button variant="outline" size="sm" onClick={() => setEditingEmail(true)}>
                  Change
                </Button>
              )}
            </div>

            {editingEmail && (
              <form onSubmit={handleEmailSubmit} className="mt-4 flex flex-col gap-4">
                <div>
                  <Label htmlFor="account-new-email">New email</Label>
                  <Input
                    id="account-new-email"
                    type="email"
                    required
                    autoFocus
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="account-confirm-email">Confirm new email</Label>
                  <Input
                    id="account-confirm-email"
                    type="email"
                    required
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1.5"
                  />
                </div>

                <MessageBanner message={emailMessage} />

                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={cancelEmail}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={emailBusy} className="flex-1">
                    Update email
                  </Button>
                </div>
              </form>
            )}
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Password</p>
              {!editingPassword && (
                <Button variant="outline" size="sm" onClick={() => setEditingPassword(true)}>
                  Change
                </Button>
              )}
            </div>

            {editingPassword && (
              <form onSubmit={handlePasswordSubmit} className="mt-4 flex flex-col gap-4">
                <div>
                  <Label htmlFor="account-new-password">New password</Label>
                  <Input
                    id="account-new-password"
                    type="password"
                    required
                    autoFocus
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
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1.5"
                  />
                </div>

                <MessageBanner message={passwordMessage} />

                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={cancelPassword}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={passwordBusy} className="flex-1">
                    Update password
                  </Button>
                </div>
              </form>
            )}
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-destructive-foreground">Danger zone</p>
              {!deletingAccount && (
                <Button variant="destructive-outline" size="sm" onClick={() => setDeletingAccount(true)}>
                  Delete account
                </Button>
              )}
            </div>

            {deletingAccount && (
              <form onSubmit={handleDeleteAccount} className="mt-4 flex flex-col gap-4">
                <p className="flex gap-2 rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive-foreground dark:bg-destructive/16">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  This permanently deletes your account and every snippet,
                  category, and backup in it. This cannot be undone.
                </p>
                <div>
                  <Label htmlFor="account-delete-confirm">
                    Type <span className="font-mono">{currentEmail}</span> to confirm
                  </Label>
                  <Input
                    id="account-delete-confirm"
                    required
                    autoFocus
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                    placeholder={currentEmail}
                    className="mt-1.5"
                  />
                </div>

                <MessageBanner message={deleteMessage} />

                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={cancelDelete}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    loading={deleteBusy}
                    disabled={deleteConfirmInput.trim().toLowerCase() !== currentEmail.toLowerCase()}
                    className="flex-1"
                  >
                    Delete my account
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogPanel>
      </DialogContent>
    </Dialog>
  )
}
