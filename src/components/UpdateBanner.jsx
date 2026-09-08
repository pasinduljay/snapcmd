import { useEffect, useState } from 'react'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Checks once on launch. Downloading and installing only happens if the
// user clicks — never silently in the background.
export default function UpdateBanner() {
  const [update, setUpdate] = useState(null)
  const [status, setStatus] = useState('idle') // idle | downloading | ready | error

  useEffect(() => {
    check()
      .then((result) => {
        if (result?.available) setUpdate(result)
      })
      .catch(() => {
        // No update server reachable, or no update — not worth surfacing
        // as an error to the user, this runs silently on every launch.
      })
  }, [])

  async function installUpdate() {
    setStatus('downloading')
    try {
      await update.downloadAndInstall()
      setStatus('ready')
      await relaunch()
    } catch {
      setStatus('error')
    }
  }

  if (!update) return null

  return (
    <div className="flex items-center justify-between gap-3 border-b bg-primary/10 px-4 py-2 text-sm sm:px-6">
      <span>
        Snapcmd {update.version} is available (you have {update.currentVersion}).
      </span>
      <Button size="sm" onClick={installUpdate} disabled={status === 'downloading'}>
        <Download />
        {status === 'downloading' ? 'Installing…' : status === 'error' ? 'Retry update' : 'Update now'}
      </Button>
    </div>
  )
}
