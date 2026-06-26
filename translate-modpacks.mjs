import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs"
import { join } from "path"
import { jsonrepair } from "jsonrepair"
import { chat } from "./agnes.mjs"

// Top popular modpacks to fetch from Modrinth (sorted by downloads).
const TOP_LIMIT = Number(process.env.TOP_LIMIT ?? 100)
// How many descriptions to send to the LLM per request. A single request asks
// for ALL target locales at once, so each call already carries a lot of
// content. Keep the batch large to minimise the number of calls.
const BATCH_SIZE = Number(process.env.BATCH_SIZE ?? 25)
// Delay between LLM calls to stay within the API rate limit.
const REQUEST_DELAY_MS = Number(process.env.REQUEST_DELAY_MS ?? 1500)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// English is the source language: its CSV keeps an empty description because
// the launcher falls back to the original Modrinth description for English.
const SOURCE_LOCALE = "en"

function getTargetLocales() {
    return readdirSync("src").filter(
        (locale) => locale !== SOURCE_LOCALE && existsSync(join("src", locale, "modpacks.csv"))
    )
}

async function fetchTopModpacks(limit) {
    const result = []
    const pageSize = 100
    for (let offset = 0; offset < limit; offset += pageSize) {
        const url = new URL("https://api.modrinth.com/v2/search")
        url.searchParams.set("facets", JSON.stringify([["project_type:modpack"]]))
        url.searchParams.set("index", "downloads")
        url.searchParams.set("limit", String(Math.min(pageSize, limit - offset)))
        url.searchParams.set("offset", String(offset))
        const resp = await fetch(url, {
            headers: { "User-Agent": "Voxelum/xmcl-commuity-content-i18n" },
        })
        if (!resp.ok) {
            throw new Error(`Modrinth search failed: ${resp.status} ${resp.statusText}`)
        }
        const json = await resp.json()
        for (const hit of json.hits) {
            result.push({
                id: hit.project_id,
                description: String(hit.description || "").replaceAll("\n", " ").trim(),
            })
        }
        if (json.hits.length < pageSize) break
    }
    return result.filter((m) => m.id && m.description)
}

// Sanitise a value so it survives the project's naive CSV (split/join on ",").
// Newlines and double quotes are removed; values with commas are quoted.
function toCsvField(value) {
    let v = value.replaceAll(/[\r\n]+/g, " ").replaceAll('"', "'").trim()
    if (v.includes(",")) {
        v = `"${v}"`
    }
    return v
}

function readCsv(path) {
    const content = readFileSync(path, "utf-8")
    const lines = content.split("\n")
    const header = lines[0]
    const rows = lines.slice(1).map((l) => l.split(","))
    return { header, rows }
}

function indexByIds(rows) {
    const index = {}
    rows.forEach((row, i) => {
        const modrinth = row[1]
        const curseforge = row[2]
        if (modrinth) index[modrinth] = i
        if (curseforge) index[curseforge] = i
    })
    return index
}

// Make sure every top modpack has a row in every locale CSV (empty description).
function ensureRows(modpacks) {
    for (const locale of readdirSync("src")) {
        const path = join("src", locale, "modpacks.csv")
        if (!existsSync(path)) continue
        const { header, rows } = readCsv(path)
        const index = indexByIds(rows)
        let changed = false
        for (const { id } of modpacks) {
            if (index[id] === undefined) {
                rows.push(["", id, "", ""])
                index[id] = rows.length - 1
                changed = true
            }
        }
        if (changed) {
            writeFileSync(path, [header, ...rows.map((r) => r.join(","))].join("\n"))
        }
    }
}

const exampleIn = JSON.stringify({
    xl3myxch: "Library Mod required by all of ApexStudios' mods",
    WXDvMkR5: "A modpack with over 200 mods!",
})

const exampleOut = JSON.stringify({
    xl3myxch: {
        "zh-cn": "ApexStudios 所有模组必需的库模组",
        de: "Bibliotheks-Mod, die von allen Mods von ApexStudios benötigt wird",
        fr: "Mod de bibliothèque requis par tous les mods d'ApexStudios",
    },
    WXDvMkR5: {
        "zh-cn": "一个拥有 200 多个模组的整合包！",
        de: "Ein Modpack mit über 200 Mods!",
        fr: "Un modpack avec plus de 200 mods !",
    },
})

// Translate a batch of descriptions into ALL target locales in a single call.
async function translateBatch(targetLocales, batch) {
    const resp = await chat([
        {
            role: "system",
            content:
                "You are an assistant of a Minecraft mod developer translating modpack descriptions. " +
                "The user sends a JSON mapping project id -> English description. " +
                "Translate every description into ALL of these locales: " +
                targetLocales.join(", ") +
                ". Keep mod names, brand names, version numbers and proper nouns in their original Latin script untranslated. " +
                "Output ONLY raw JSON mapping each project id to an object whose keys are the locale codes and values are the translations. " +
                "Do not include the English original and do not wrap the output in code fences.",
        },
        {
            role: "user",
            content: "Translate following:```json\n" + exampleIn + "\n```",
        },
        {
            role: "assistant",
            content: exampleOut,
        },
        {
            role: "user",
            content: "Translate following:```json\n" + JSON.stringify(batch) + "\n```",
        },
    ])

    if (resp.error) {
        throw new Error(`Agnes API error: ${resp.error?.message || JSON.stringify(resp.error)}`)
    }

    let content = resp.choices[0].message.content.trim()
    if (content.startsWith("```json")) content = content.substring("```json".length)
    else if (content.startsWith("```")) content = content.substring(3)
    if (content.endsWith("```")) content = content.substring(0, content.length - 3)
    content = content.trim()
    try {
        return JSON.parse(content)
    } catch {
        // The model occasionally emits invalid JSON (e.g. unescaped quotes).
        // jsonrepair fixes the common cases so we don't lose the whole batch.
        return JSON.parse(jsonrepair(content))
    }
}

// Translate an array of [id, description] entries, automatically splitting the
// batch in half and retrying if the model returns oversized/invalid JSON (e.g.
// the response got truncated). This keeps batches large for efficiency while
// still recovering from the occasional bad response.
async function translateEntries(targetLocales, entries, into) {
    if (entries.length === 0) return
    const batch = Object.fromEntries(entries)
    try {
        const result = await translateBatch(targetLocales, batch)
        Object.assign(into, result)
    } catch (e) {
        if (entries.length === 1) {
            console.error(`  Skipping ${entries[0][0]}: ${e.message}`)
            return
        }
        console.error(`  Batch of ${entries.length} failed (${e.message}); splitting and retrying...`)
        const mid = Math.ceil(entries.length / 2)
        await translateEntries(targetLocales, entries.slice(0, mid), into)
        await sleep(REQUEST_DELAY_MS)
        await translateEntries(targetLocales, entries.slice(mid), into)
    }
}

async function main() {
    const targetLocales = getTargetLocales()
    console.log("Target locales:", targetLocales.join(", "))

    console.log(`Fetching top ${TOP_LIMIT} modpacks from Modrinth...`)
    const modpacks = await fetchTopModpacks(TOP_LIMIT)
    console.log(`Fetched ${modpacks.length} modpacks.`)

    // Make sure the rows exist (including the empty English row) before translating.
    ensureRows(modpacks)

    // translations[id][locale] = translated string
    const translations = {}
    for (let i = 0; i < modpacks.length; i += BATCH_SIZE) {
        const slice = modpacks.slice(i, i + BATCH_SIZE)
        const entries = slice.map((m) => [m.id, m.description])
        const batchNum = Math.floor(i / BATCH_SIZE) + 1
        const totalBatches = Math.ceil(modpacks.length / BATCH_SIZE)
        console.log(`Translating batch ${batchNum}/${totalBatches} (${slice.length} modpacks, ${targetLocales.length} locales)...`)
        await translateEntries(targetLocales, entries, translations)
        if (i + BATCH_SIZE < modpacks.length) {
            await sleep(REQUEST_DELAY_MS)
        }
    }

    // Write translations into each locale CSV (skip English, only fill empties).
    for (const locale of targetLocales) {
        const path = join("src", locale, "modpacks.csv")
        const { header, rows } = readCsv(path)
        const index = indexByIds(rows)
        let filled = 0
        for (const { id } of modpacks) {
            const i = index[id]
            if (i === undefined) continue
            const row = rows[i]
            // Only fill rows that are still missing a description.
            const current = row.slice(3).join(",")
            if (current && current.trim()) continue
            const translated = translations[id]?.[locale]
            if (translated) {
                rows[i] = [row[0] ?? "", row[1] ?? "", row[2] ?? "", toCsvField(translated)]
                filled += 1
            }
        }
        writeFileSync(path, [header, ...rows.map((r) => r.join(","))].join("\n"))
        console.log(`${locale}: filled ${filled} descriptions.`)
    }

    console.log("Done.")
}

main().catch((e) => {
    console.error(`Fatal error: ${e.message}`)
    process.exit(1)
})
