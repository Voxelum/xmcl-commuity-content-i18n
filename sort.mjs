import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { join } from 'path'

const dirs = readdirSync('src')

for (const locale of dirs) {
    const path = join('src', locale)
    if (statSync(path).isDirectory()) {
        const files = readdirSync(path)
        if (files.includes('mods.csv')) {
            sort(locale, 'mods')
        }
        if (files.includes('modpacks.csv')) {
            sort(locale, 'modpacks')
        }
        if (files.includes('resourcepacks.csv')) {
            sort(locale, 'resourcepacks')
        }
    }
}

function sort(locale, type) {
    const csvFile = join('src', locale, type + '.csv')

    const fileContent = readFileSync(csvFile, 'utf-8')

    const lines = fileContent.split('\n')

    const header = lines.shift() // remove the header

    // sort the lines by name

    lines.sort((a, b) => {
        const [nameA] = a.split(',')
        const [nameB] = b.split(',')
        return nameA.localeCompare(nameB)
    })

    lines.unshift(header)

    const content = lines.join('\n')

    // write the content back to the file
    writeFileSync(csvFile, content)
}
