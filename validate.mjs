import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { join } from 'path'

const dirs = readdirSync('src')
let hasError = false
let remove = false

// if argument has --fix, remove the duplicate line
if (process.argv.includes('--fix')) {
    remove = true
}

for (const locale of dirs) {
    const path = join('src', locale)
    if (statSync(path).isDirectory()) {
        const files = readdirSync(path)
        if (files.includes('mods.csv')) {
            validate(locale, 'mods')
        }
        if (files.includes('modpacks.csv')) {
            validate(locale, 'modpacks')
        }
        if (files.includes('resourcepacks.csv')) {
            validate(locale, 'resourcepacks')
        }
    }
}

function validate(locale, type) {
    const csvFile = join('src', locale, type + '.csv')

    const fileContent = readFileSync(csvFile, 'utf-8')

    const lines = fileContent.split('\n')

    const toRemove = []


    // ensure there is no duplicate
    // if there is a duplicate, print out the line number and the content
    const seen = new Map()
    const header = lines.shift() // remove the header
    for (const [index, line] of lines.entries()) {
        let [name, modrinthId, curseforgeId, description] = line.split(',')
        curseforgeId = curseforgeId == '-1' ? undefined : curseforgeId
        modrinthId = modrinthId == '-1' ? undefined : modrinthId
        if (!modrinthId && !curseforgeId) {
            console.error(`Empty modrinthId and curseforgeId found in ${csvFile}:${index + 2}: ${line}`)
            toRemove.push(index)
            hasError = true
        } else {
            const key = `${curseforgeId}-${modrinthId}`
            if (seen.has(key)) {
                console.log(curseforgeId, modrinthId)
                const lastLine = seen.get(key)
                const lastLineContent = lines[lastLine]
                if (lastLineContent === line) {
                    // remove this line
                    toRemove.push(index)
                }

                console.error(`Duplicate found in ${csvFile}:${index + 2}: ${line}`)
                hasError = true
            }
            seen.set(key, index)
        }
    }

    if (remove) {
        toRemove.reverse().forEach(i => lines.splice(i, 1))
        // write back
        const content = [header,...lines].join('\n')
        writeFileSync(csvFile, content)
    }

    // ensure there is no empty line
    // if there is an empty line, print out the line number
    for (const [index, line] of lines.entries()) {
        if (line.trim() === '') {
            console.error(`Empty line found in ${csvFile}:${index + 1}`)

            hasError = true
        }
    }

}

if (hasError) {
    process.exit(1)
}