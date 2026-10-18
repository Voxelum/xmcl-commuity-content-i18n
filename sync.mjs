import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const DOMAIN_MAP = {
    mods: 'mod',
    resourcepacks: 'resourcepack',
    shaderpacks: 'shader',
    modpacks: 'modpack',
}

async function fetchModrinthProjects(type, index, limit = 100) {
    const url = new URL('https://api.modrinth.com/v2/search')
    url.searchParams.set('facets', JSON.stringify([['project_type:' + type]]))
    url.searchParams.set('index', index)
    url.searchParams.set('limit', String(limit))
    try {
        const resp = await fetch(url, {
            headers: { 'User-Agent': 'Voxelum/xmcl-community-content-i18n' },
        })
        if (!resp.ok) return []
        const data = await resp.json()
        return data.hits || []
    } catch (e) {
        console.warn(`Modrinth search failed for ${type}/${index}: ${e.message}`)
        return []
    }
}

async function sync() {
    const groupByDomain = {
        mods: [],
        resourcepacks: [],
        shaderpacks: [],
        modpacks: [],
    }

    // 1. Fetch historical database mapping if available
    try {
        console.log('Fetching project_mapping.csv from minecraft-mods-database...')
        const response = await fetch(
            'https://api.github.com/repos/Voxelum/minecraft-mods-database/releases/latest'
        ).then((r) => r.json())
        const asset = response.assets?.find((a) => a.name === 'project_mapping.csv')
        if (asset?.browser_download_url) {
            const fileContent = await fetch(asset.browser_download_url).then((r) => r.text())
            const csv = fileContent.split('\n').map((line) => line.split(','))
            for (const [modrinth, curseforge, domain] of csv) {
                if (domain && groupByDomain[domain]) {
                    groupByDomain[domain].push([modrinth, curseforge])
                }
            }
        }
    } catch (e) {
        console.warn('Could not fetch minecraft-mods-database:', e.message)
    }

    // 2. Fetch live new, updated, and top items directly from Modrinth Search API
    console.log('Querying live Modrinth search API for new/updated projects...')
    for (const [domain, modrinthType] of Object.entries(DOMAIN_MAP)) {
        const existingIds = new Set(groupByDomain[domain].map(([m]) => m).filter(Boolean))
        const [updatedHits, newestHits, topHits] = await Promise.all([
            fetchModrinthProjects(modrinthType, 'updated', 100),
            fetchModrinthProjects(modrinthType, 'newest', 100),
            fetchModrinthProjects(modrinthType, 'downloads', 100),
        ])

        const combinedHits = [...updatedHits, ...newestHits, ...topHits]
        let addedCount = 0
        for (const hit of combinedHits) {
            if (hit.project_id && !existingIds.has(hit.project_id)) {
                groupByDomain[domain].push([hit.project_id, ''])
                existingIds.add(hit.project_id)
                addedCount++
            }
        }
        console.log(`  ${domain}: ${addedCount} new projects discovered from Modrinth (total pool: ${groupByDomain[domain].length})`)
    }

    // 3. Update all locale CSV tables (strictly excluding 'ru')
    for (const locale of readdirSync('src')) {
        if (locale === 'ru') {
            continue
        }
        const path = join('src', locale)
        for (const file of readdirSync(path)) {
            if (file.endsWith('.csv')) {
                const domain = file.split('.')[0]
                const byDomain = groupByDomain[domain]
                if (!byDomain) {
                    continue
                }

                const csvFile = join(path, file)
                const fileContent = readFileSync(csvFile, 'utf-8')
                const lines = fileContent.split('\n').filter((l) => l.trim().length > 0)
                const header = lines[0]
                const csvContent = lines.map((l) => l.split(','))

                // Build index of existing rows
                const index = csvContent.reduce((acc, [_, modrinthId, curseforgeId], i) => {
                    if (modrinthId) acc[modrinthId] = i
                    if (curseforgeId) acc[curseforgeId] = i
                    return acc
                }, {})

                let addedToCsv = 0
                for (const [modrinth, curseforge] of byDomain) {
                    const hasModrinth = modrinth && index[modrinth] !== undefined
                    const hasCurseforge = curseforge && index[curseforge] !== undefined
                    if (!hasModrinth && !hasCurseforge) {
                        csvContent.push(['', modrinth || '', curseforge || '', ''])
                        const newIndex = csvContent.length - 1
                        if (modrinth) index[modrinth] = newIndex
                        if (curseforge) index[curseforge] = newIndex
                        addedToCsv++
                    } else if (hasModrinth && !hasCurseforge && curseforge) {
                        csvContent[index[modrinth]][2] = curseforge
                    } else if (!hasModrinth && hasCurseforge && modrinth) {
                        csvContent[index[curseforge]][1] = modrinth
                    }
                }

                if (addedToCsv > 0) {
                    const newContent = csvContent.map((l) => l.join(',')).join('\n')
                    writeFileSync(csvFile, newContent)
                    console.log(`  [${locale}] ${file}: +${addedToCsv} new projects added`)
                }
            }
        }
    }
    console.log('Sync complete.')
}

sync().catch((e) => {
    console.error('Fatal sync error:', e)
    process.exit(1)
})