import Database from '@tauri-apps/plugin-sql'

const DEFAULT_CATEGORIES = ['Docker', 'Kubernetes', 'Linux', 'Windows', 'AWS', 'Git', 'General']
const FALLBACK_CATEGORY = 'General'

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

  // Seed defaults on first run, and adopt any category that only exists on
  // a snippet (e.g. after an import) so it stays manageable.
  const missing = new Set()
  if (categories.length === 0) DEFAULT_CATEGORIES.forEach((n) => missing.add(n))
  if (!categories.includes(FALLBACK_CATEGORY)) missing.add(FALLBACK_CATEGORY)
  snippets.forEach((s) => {
    if (s.category && !categories.includes(s.category)) missing.add(s.category)
  })

  if (missing.size > 0) {
    for (const name of missing) {
      await db.execute('insert or ignore into categories (id, name) values ($1, $2)', [
        crypto.randomUUID(),
        name,
      ])
    }
    categoryRows = await db.select('select name from categories order by name')
    categories = categoryRows.map((r) => r.name)
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

export async function deleteCategory(name) {
  if (name === FALLBACK_CATEGORY) return
  const db = await getDb()
  await db.execute('update snippets set category = $1 where category = $2', [
    FALLBACK_CATEGORY,
    name,
  ])
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
