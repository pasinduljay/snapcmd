import Database from '@tauri-apps/plugin-sql'

const DEFAULT_CATEGORIES = ['General', 'Linux', 'Windows']
const LEGACY_UNWANTED = ['AWS', 'Docker', 'Git', 'Kubernetes']

let dbPromise = null
function getDb() {
  if (!dbPromise) dbPromise = Database.load('sqlite:snapcmd.db')
  return dbPromise
}

function rowToSnippet(row) {
  return { ...row, tags: JSON.parse(row.tags || '[]') }
}

export async function fetchAll() {
  const db = await getDb()
  const snippetRows = await db.select('select * from snippets order by created_at desc')
  const snippets = snippetRows.map(rowToSnippet)

  let categoryRows = await db.select('select name from categories order by name')
  let categories = categoryRows.map((r) => r.name)

  // One-time cleanup for users with old seeded categories that have 0 snippets
  const cleaned = typeof window !== 'undefined' && localStorage.getItem('snapcmd-clean-legacy-cats-v2')
  if (!cleaned) {
    for (const cat of LEGACY_UNWANTED) {
      const hasSnippets = snippets.some((s) => s.category === cat)
      if (!hasSnippets) {
        await db.execute('delete from categories where name = $1', [cat])
      }
    }
    categoryRows = await db.select('select name from categories order by name')
    categories = categoryRows.map((r) => r.name)
    if (typeof window !== 'undefined') {
      localStorage.setItem('snapcmd-clean-legacy-cats-v2', 'true')
    }
  }

  // Seed default categories (General, Linux, Windows) on fresh install
  const initialized = typeof window !== 'undefined' && localStorage.getItem('snapcmd-categories-initialized')
  if (!initialized) {
    if (categories.length === 0) {
      for (const name of DEFAULT_CATEGORIES) {
        await db.execute('insert or ignore into categories (id, name) values ($1, $2)', [
          crypto.randomUUID(),
          name,
        ])
      }
      categoryRows = await db.select('select name from categories order by name')
      categories = categoryRows.map((r) => r.name)
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('snapcmd-categories-initialized', 'true')
    }
  }

  return { snippets, categories }
}

export async function ensureCategory(name) {
  if (!name) return
  const db = await getDb()
  await db.execute('insert or ignore into categories (id, name) values ($1, $2)', [
    crypto.randomUUID(),
    name,
  ])
}

export async function saveSnippet(values, existingId) {
  const db = await getDb()
  await ensureCategory(values.category)
  const tags = JSON.stringify(values.tags ?? [])

  if (existingId) {
    await db.execute(
      `update snippets set title=$1, command=$2, notes=$3, category=$4, tags=$5, updated_at=datetime('now') where id=$6`,
      [values.title, values.command, values.notes, values.category, tags, existingId],
    )
    const [row] = await db.select('select * from snippets where id = $1', [existingId])
    return rowToSnippet(row)
  }

  const id = crypto.randomUUID()
  await db.execute(
    'insert into snippets (id, title, command, notes, category, tags) values ($1, $2, $3, $4, $5, $6)',
    [id, values.title, values.command, values.notes, values.category, tags],
  )
  const [row] = await db.select('select * from snippets where id = $1', [id])
  return rowToSnippet(row)
}

export async function deleteSnippet(id) {
  const db = await getDb()
  await db.execute('delete from snippets where id = $1', [id])
}

export async function renameCategory(oldName, newName) {
  const db = await getDb()
  await db.execute('update categories set name = $1 where name = $2', [newName, oldName])
  await db.execute('update snippets set category = $1 where category = $2', [newName, oldName])
}

export async function deleteCategory(name, fallback = '') {
  const db = await getDb()
  await db.execute('update snippets set category = $1 where category = $2', [fallback, name])
  await db.execute('delete from categories where name = $1', [name])
}

export async function fetchBackups() {
  const db = await getDb()
  const rows = await db.select('select * from backups order by created_at desc')
  return rows.map((r) => ({ ...r, data: JSON.parse(r.data) }))
}

export async function createBackup(scope, snippets) {
  const db = await getDb()
  const id = crypto.randomUUID()
  const payload = snippets.map(({ title, command, notes, category, tags }) => ({
    title,
    command,
    notes,
    category,
    tags,
  }))
  await db.execute(
    'insert into backups (id, scope, snippet_count, data) values ($1, $2, $3, $4)',
    [id, scope, payload.length, JSON.stringify(payload)],
  )
  const [row] = await db.select('select * from backups where id = $1', [id])
  return { ...row, data: JSON.parse(row.data) }
}

export async function deleteBackup(id) {
  const db = await getDb()
  await db.execute('delete from backups where id = $1', [id])
}
