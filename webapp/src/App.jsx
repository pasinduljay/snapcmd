import { useEffect, useState } from 'react'
import { supabase, isConfigured } from './lib/supabase'
import Auth from './components/Auth'
import Vault from './components/Vault'
import SetupNotice from './components/SetupNotice'
import SharedSnippet from './components/SharedSnippet'
import { Spinner } from '@/components/ui/spinner'

const sharedMatch = window.location.pathname.match(/^\/s\/([a-zA-Z0-9_-]+)$/)

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (!isConfigured) return <SetupNotice />

  // Public route: /s/:slug never requires a session.
  if (sharedMatch) return <SharedSnippet slug={sharedMatch[1]} />

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  return session ? <Vault session={session} /> : <Auth />
}
