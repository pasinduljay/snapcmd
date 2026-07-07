import { Card, CardContent } from '@/components/ui/card'

export default function SetupNotice() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardContent>
          <h1 className="font-heading text-xl font-semibold">Supabase is not configured yet</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Create a file named <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">.env</code>{' '}
            in the <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">webapp</code> folder
            (copy <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">.env.example</code>) and fill in:
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg border bg-muted/50 p-4 font-mono text-xs text-foreground">
{`VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key`}
          </pre>
          <p className="mt-4 text-sm text-muted-foreground">
            Both values are in your Supabase dashboard under{' '}
            <span className="font-medium text-foreground">Project Settings → API</span>.
            Restart the dev server after saving.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
