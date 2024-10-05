const { readFileSync, readdirSync, unlinkSync, statSync, writeFileSync } = require('fs')
const { Database } = require('node-sqlite3-wasm')
const { join } = require('path')
const { gzipSync } = require('zlib')
const { createHash } = require('crypto')

function splitCsvLine(line) {
  // respect the quotes
  const result = []
  let current = ''
  let inQuote = false
  for (const char of line) {
    if (char == ',') {
      if (inQuote) {
        current += char
      } else {
        result.push(current)
        current = ''
      }
    } else if (char == '"') {
      inQuote = !inQuote
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

/**
 * @param {Database} db
 * @param {string} locale locale code like zh-cn
 * @param {string} type mods, modpacks, or resourcepacks
 */
function processLocaleType(db, locale, type) {
  const csvFile = join('src', locale, type + '.csv')

  const fileContent = readFileSync(csvFile, 'utf-8')

  const lines = fileContent.split('\n')

  lines.shift() // remove the header

  for (const line of lines) {
    const [name, modrinthId, curseforgeId, description] = splitCsvLine(line)
    try {
      db.run(`INSERT INTO project (curseforgeId, modrinthId, name, description) VALUES (?, ?, ?, ?)`, [curseforgeId, modrinthId, name ?? '', description ?? ''])
    } catch (e) {
      console.error(e)
    }
  }
}

const dirs = readdirSync('src')

for (const locale of dirs) {
  const sqlitePath = join('build', `${locale}.sqlite`)
  const db = new Database(join('build', `${locale}.sqlite`))
  db.exec(`
    CREATE TABLE IF NOT EXISTS project (
    curseforgeId INTEGER,
    modrinthId TEXT,
    name TEXT NOT NULL,
    description TEXT,
    CONSTRAINT unique_ids UNIQUE (curseforgeId, modrinthId)
);`)

  const files = readdirSync(join('src', locale))
  if (files.includes('mods.csv')) {
    processLocaleType(db, locale, 'mods')
  }
  if (files.includes('modpacks.csv')) {
    processLocaleType(db, locale, 'modpacks')
  }
  if (files.includes('resourcepacks.csv')) {
    processLocaleType(db, locale, 'resourcepacks')
  }

  db.close()

  // gzip the file
  const buffer = readFileSync(sqlitePath)
  const compressed = gzipSync(buffer)
  const compressedPath = join(sqlitePath + '.gz')
  writeFileSync(compressedPath, compressed)

  // sha256
  const hash = createHash('sha256')
  hash.update(buffer)
  const sha256 = hash.digest('hex')
  const sha256Path = join(sqlitePath + '.sha256')
  writeFileSync(sha256Path, sha256)

  // remove the original file
  unlinkSync(sqlitePath)
}
