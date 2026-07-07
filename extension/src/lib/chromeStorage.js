// Supabase's default storage is window.localStorage, but a popup's DOM is
// torn down every time it closes — anything in localStorage there is lost.
// chrome.storage.local persists across popup opens/closes and browser
// restarts, which is what a session actually needs.
export const chromeStorageAdapter = {
  async getItem(key) {
    const result = await chrome.storage.local.get(key)
    return result[key] ?? null
  },
  async setItem(key, value) {
    await chrome.storage.local.set({ [key]: value })
  },
  async removeItem(key) {
    await chrome.storage.local.remove(key)
  },
}
