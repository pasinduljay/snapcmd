import { useEffect, useState } from 'react'
import { supabase, isConfigured } from './lib/supabase'
import Auth from './components/Auth'
import SnippetList from './components/SnippetList'
import SetupNotice from './components/SetupNotice'

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
  if (loading) return <p className="p-5 text-center text-xs text-muted-foreground">Loading…</p>

  return session ? <SnippetList session={session} /> : <Auth />
}
