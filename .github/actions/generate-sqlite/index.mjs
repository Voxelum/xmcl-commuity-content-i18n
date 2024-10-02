import { readFileSync, readdirSync, unlinkSync, statSync, writeFileSync } from 'fs'
import { Database } from 'node-sqlite3-wasm'
import { join } from 'path'
import { gzipSync } from 'zlib'
import { createHash } from 'crypto'

/**
 * @param {string} locale locale code like zh-cn
 * @param {string} type mods, modpacks, or resourcepacks
 */
function processLocaleType(locale, type) {
  const db = new Database(join('build', `${type}-${locale}.sqlite`))

  db.exec(`
    CREATE TABLE IF NOT EXISTS i18n (
    curseforgeId INTEGER,
    modrinthId TEXT,
    name TEXT NOT NULL,
    description TEXT,
    CONSTRAINT unique_ids UNIQUE (curseforgeId, modrinthId)
);`)

  const csvFile = join('src', locale, type + '.csv')

  const fileContent = readFileSync(csvFile, 'utf-8')

  const lines = fileContent.split('\n')

  lines.shift() // remove the header

  for (const line of lines) {
    const [name, modrinthId, curseforgeId, description] = line.split(',')
    db.run(`INSERT INTO i18n (curseforgeId, modrinthId, name, description) VALUES (?, ?, ?)`, [curseforgeId, modrinthId, name, description])
  }

  db.close()

  // gzip the file
  const buffer = readFileSync(join('build', `${type}-${locale}.sqlite`))
  const compressed = gzipSync(buffer)
  const compressedPath = join('build', `${type}-${locale}.sqlite.gz`)
  writeFileSync(compressedPath, compressed)

  // sha256
  const hash = createHash('sha256')
  hash.update(compressed)
  const sha256 = hash.digest('hex')
  const sha256Path = join('build', `${type}-${locale}.sqlite.gz.sha256`)
  writeFileSync(sha256Path, sha256)

  // remove the original file
  unlinkSync(join('build', `${type}-${locale}.sqlite`))
}

const dirs = readdirSync('src')

for (const locale of dirs) {
  if (statSync(locale).isDirectory()) {
    const files = readdirSync(locale)
    if (files.includes('mods.csv')) {
      processLocaleType(locale, 'mods')
    }
    if (files.includes('modpacks.csv')) {
      processLocaleType(locale, 'modpacks')
    }
    if (files.includes('resourcepacks.csv')) {
      processLocaleType(locale, 'resourcepacks')
    }
  }
}
