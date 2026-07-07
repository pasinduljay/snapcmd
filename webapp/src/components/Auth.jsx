import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import Logo from './Logo'
import Wordmark from './Wordmark'

const MIN_PASSWORD_LENGTH = 8

export default function Auth() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null) // { type: 'error' | 'info', text }
  const [busy, setBusy] = useState(false)

  function switchMode(next) {
    setMode(next)
    setMessage(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      if (mode === 'forgot') {
        // Supabase always returns success here regardless of whether the
        // email is registered — don't say anything more specific, so this
        // can't be used to check which emails have an account.
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        })
        setMessage({
          type: 'info',
          text: "If an account exists for that email, we've sent a password reset link.",
        })
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw error
        setMessage({
          type: 'info',
          text: 'Account created. Check your email for a confirmation link, then sign in.',
        })
        setMode('signin')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
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
          <p className="mt-1 text-sm text-muted-foreground">
            Your commands, one search away
          </p>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5"
                />
              </div>

              {mode !== 'forgot' && (
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1.5"
                  />
                  {mode === 'signup' && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      At least {MIN_PASSWORD_LENGTH} characters.
                    </p>
                  )}
                </div>
              )}

              {message && (
                <p
                  className={`mt-4 rounded-lg px-3 py-2 text-sm ${
                    message.type === 'error'
                      ? 'bg-destructive/8 text-destructive-foreground dark:bg-destructive/16'
                      : 'bg-info/8 text-info-foreground dark:bg-info/16'
                  }`}
                >
                  {message.text}
                </p>
              )}

              <Button type="submit" loading={busy} className="mt-5 w-full">
                {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === 'forgot' ? (
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="font-semibold text-primary hover:underline"
            >
              Back to sign in
            </button>
          ) : (
            <>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                className="font-semibold text-primary hover:underline"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
