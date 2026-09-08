import { createContext, useCallback, useContext, useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

const ConfirmContext = createContext(null)

// Renders a single shared AlertDialog and resolves a promise on confirm/cancel,
// so call sites can just `await confirm({...})` instead of window.confirm().
export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null) // { title, description, confirmLabel, cancelLabel, destructive, resolve }

  const confirm = useCallback((options) => {
    return new Promise((resolve) => setRequest({ ...options, resolve }))
  }, [])

  function settle(result) {
    request?.resolve(result)
    setRequest(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={Boolean(request)} onOpenChange={(open) => !open && settle(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{request?.title}</AlertDialogTitle>
            {request?.description && (
              <AlertDialogDescription>{request.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => settle(false)}>
              {request?.cancelLabel ?? 'Cancel'}
            </Button>
            <Button
              variant={request?.destructive ? 'destructive' : 'default'}
              onClick={() => settle(true)}
            >
              {request?.confirmLabel ?? 'Confirm'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  return useContext(ConfirmContext)
}
