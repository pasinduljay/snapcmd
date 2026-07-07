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

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState(null)
  const [passwordBusy, setPasswordBusy] = useState(false)

  const [newEmail, setNewEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [emailMessage, setEmailMessage] = useState(null)
  const [emailBusy, setEmailBusy] = useState(false)

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
            <p className="text-sm font-medium">Current email</p>
            <p className="mt-1 text-sm text-muted-foreground">{currentEmail}</p>
          </div>

          <Separator />

          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            <p className="text-sm font-medium">Change email</p>
            <div>
              <Label htmlFor="account-new-email">New email</Label>
              <Input
                id="account-new-email"
                type="email"
                required
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

            <Button type="submit" loading={emailBusy}>
              Update email
            </Button>
          </form>

          <Separator />

          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5"
              />
            </div>

            <MessageBanner message={passwordMessage} />

            <Button type="submit" loading={passwordBusy}>
              Update password
            </Button>
          </form>
        </DialogPanel>
      </DialogContent>
    </Dialog>
  )
}
