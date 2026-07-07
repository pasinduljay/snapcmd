export default function SetupNotice() {
  return (
    <div className="p-5 text-sm">
      <h1 className="font-semibold">Snapcmd is not configured yet</h1>
      <p className="mt-2 text-muted-foreground">
        Create <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">extension/.env</code>{' '}
        (copy <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">.env.example</code>) with
        the same <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">VITE_SUPABASE_URL</code> and{' '}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">VITE_SUPABASE_ANON_KEY</code>{' '}
        values as the web app, then rebuild.
      </p>
    </div>
  )
}
