import { useEffect, useState } from 'react'

// Light is the default. The user's explicit choice is stored in localStorage
// and the OS/system preference is never consulted.
export function useTheme() {
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('sv-theme') === 'dark' ? 'dark' : 'light',
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('sv-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggleTheme }
}
