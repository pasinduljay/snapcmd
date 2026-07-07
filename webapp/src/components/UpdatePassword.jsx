import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import Logo from './Logo'
import Wordmark from './Wordmark'

const MIN_PASSWORD_LENGTH = 8

// Shown when Supabase fires a PASSWORD_RECOVERY auth event — the user just
// clicked a password reset link and has a valid (temporary) session, but
// needs to actually set a new password before doing anything else.
export default function UpdatePassword({ onDone }) {
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
      onDone()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg border bg-card text-primary shadow-xs">
            <Logo className="size-6" />
          </div>
          <h1><Wordmark className="text-2xl" /></h1>
          <p className="mt-1 text-sm text-muted-foreground">Set a new password</p>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
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
              <div className="mt-4">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
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
                <p className="mt-4 rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive-foreground dark:bg-destructive/16">
                  {message.text}
                </p>
              )}

              <Button type="submit" loading={busy} className="mt-5 w-full">
                Update password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
