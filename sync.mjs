import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

async function sync() {
    // get release from other gh repo https://github.com/Voxelum/minecraft-mods-database
    const response = await fetch('https://api.github.com/repos/Voxelum/minecraft-mods-database/releases/latest')
        .then(response => response.json())

    // get the assets named project_mapping.csv
    const asset = response.assets.find(asset => asset.name === 'project_mapping.csv')
    // get the download url
    const downloadUrl = asset.browser_download_url

    const fileContent = await fetch(downloadUrl)
        .then(response => response.text())
    // csv is modrinth,curseforge,domain
    const csv = fileContent.split('\n').map(line => line.split(','))

    const groupByDomain = csv.reduce((acc, [modrinth, curseforge, domain]) => {
        if (!acc[domain]) {
            acc[domain] = []
        }
        acc[domain].push([modrinth, curseforge])
        return acc
    }, {})

    for (const locale of readdirSync('src')) {
        const path = join('src', locale)
        for (const file of readdirSync(path)) {
            if (file.endsWith('.csv')) {
                const csvFile = join(path, file)
                const fileContent = readFileSync(csvFile, 'utf-8')
                const lines = fileContent.split('\n')

                const byDomain = groupByDomain[file.split('.')[0]]

                // csvContent is name,modrinthId,curseforgeId,description
                const csvContent = lines.map(l => l.split(','))
               
                // build index of csvContent row, the key can be either modrinth or curseforge
                const index = csvContent.reduce((acc, [_, modrinthId, curseforgeId], i) => {
                    if (modrinthId) {
                        acc[modrinthId] = i
                    }
                    if (curseforgeId) {
                        acc[curseforgeId] = i
                    }
                    return acc
                }, {})
                
                // insert byDomain row if csvContent does not have it
                for (const [modrinth, curseforge] of byDomain) {
                    if (!index[modrinth] && !index[curseforge]) {
                        csvContent.push(['', modrinth, curseforge, ''])
                    } else if (index[modrinth] && !index[curseforge]) {
                        csvContent[index[modrinth]][2] = curseforge
                    } else if (!index[modrinth] && index[curseforge]) {
                        csvContent[index[curseforge]][1] = modrinth
                    }
                }

                // write back the csvContent
                const newContent = csvContent.map(l => l.join(',')).join('\n')
                writeFileSync(csvFile, newContent)
            }
        }
    }
}

sync()