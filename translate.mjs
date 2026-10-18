import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "fs"
import { join } from "path"
import { jsonrepair } from "jsonrepair"
import { chat } from "./agnes.mjs"

export { chat }

const EXCLUDED_LOCALES = new Set(["en", "ru"])
const DEFAULT_FILES = ["mods.csv", "resourcepacks.csv", "shaderpacks.csv", "modpacks.csv"]

const batchSize = Number(process.env.BATCH_SIZE ?? 50)
const quotaArg = process.argv.find((a) => a.startsWith("--quota="))?.split("=")[1]
// Quota of 0 means UNLIMITED (translate all pending entries)
const rawQuota = quotaArg ?? process.env.QUOTA_PER_LOCALE ?? process.env.QUOTA ?? "0"
const QUOTA_PER_LOCALE = Number(rawQuota)
const REQUEST_DELAY_MS = Number(process.env.REQUEST_DELAY_MS ?? 300)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// In-memory cache for Modrinth descriptions to prevent duplicate network calls across locales
const modrinthDescCache = new Map()

function getTargetLocales() {
    const localeArg = process.argv.find((a) => a.startsWith("--locale="))?.split("=")[1]
    const envLocales = process.env.TARGET_LOCALES
    const raw = localeArg || envLocales
    if (raw) {
        return raw
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter((s) => s && !EXCLUDED_LOCALES.has(s))
    }
    return readdirSync("src").filter((dir) => {
        const full = join("src", dir)
        return !EXCLUDED_LOCALES.has(dir) && statSync(full).isDirectory()
    })
}

function splitCsvLine(line) {
    const result = []
    let current = ""
    let inQuote = false
    for (const char of line) {
        if (char === ",") {
            if (inQuote) {
                current += char
            } else {
                result.push(current)
                current = ""
            }
        } else if (char === '"') {
            inQuote = !inQuote
        } else {
            current += char
        }
    }
    result.push(current)
    return result
}

function toCsvField(value) {
    let v = String(value ?? "").replaceAll(/[\r\n]+/g, " ").replaceAll('"', "'").trim()
    if (v.includes(",")) {
        v = `"${v}"`
    }
    return v
}

async function translateWithGoogleSingle(text, targetLocale) {
    const lang = targetLocale.toLowerCase() === "zh-cn" ? "zh-CN" : targetLocale
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`
    const resp = await fetch(url)
    if (!resp.ok) {
        throw new Error(`Google Translate API HTTP ${resp.status}`)
    }
    const data = await resp.json()
    if (!data || !data[0]) return text
    return data[0].map((item) => item[0]).join("")
}

// Fast batched translation using delimiter to reduce HTTP roundtrips by 25x
async function translateDescriptionsWithGoogle(locale, descriptions) {
    const entries = Object.entries(descriptions)
    const result = {}
    const DELIM = " ||| "
    const CHUNK_SIZE = 25

    for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
        const chunk = entries.slice(i, i + CHUNK_SIZE)
        const combined = chunk.map(([_, text]) => text).join(DELIM)

        try {
            const translatedCombined = await translateWithGoogleSingle(combined, locale)
            const split = translatedCombined.split("|||").map((s) => s.trim())
            for (let j = 0; j < chunk.length; j++) {
                const [id, original] = chunk[j]
                result[id] = split[j] || original
            }
        } catch (e) {
            console.warn(`  [${locale}] Batched Google translate failed (${e.message}), trying single items...`)
            for (const [id, text] of chunk) {
                try {
                    result[id] = await translateWithGoogleSingle(text, locale)
                    await sleep(100)
                } catch {
                    result[id] = text
                }
            }
        }
        await sleep(REQUEST_DELAY_MS)
    }
    return result
}

async function translateDescriptionsWithAgnes(locale, descriptions) {
    const resp = await chat([
        {
            role: "system",
            content:
                "You are an assistant of a Minecraft mod developer. You are asked to translate Minecraft mod, resource pack, and shader descriptions into the target language specified by locale code. " +
                "Users will input a JSON object where each key is the project id and the value is the English description. " +
                "Translate each description into the target locale and output ONLY a valid raw JSON object mapping project id to translated description. " +
                "Keep mod names, brand names, and proper nouns in English/Latin script untranslated. Do not wrap the JSON output in markdown fences.",
        },
        {
            role: "user",
            content: `Translate following into ${locale}:\n\`\`\`json\n${JSON.stringify(descriptions)}\n\`\`\``,
        },
    ])

    if (resp.error) {
        throw new Error(`Agnes API error: ${resp.error?.message || JSON.stringify(resp.error)}`)
    }

    let content = resp.choices[0]?.message?.content?.trim() ?? ""
    if (content.startsWith("```json")) {
        content = content.substring("```json".length)
    } else if (content.startsWith("```")) {
        content = content.substring(3)
    }
    if (content.endsWith("```")) {
        content = content.substring(0, content.length - 3)
    }
    content = content.trim()
    if (content.startsWith(`${locale}:`)) {
        content = content.substring(`${locale}:`.length).trim()
    }

    try {
        return JSON.parse(content)
    } catch {
        return JSON.parse(jsonrepair(content))
    }
}

async function translateDescriptions(locale, descriptions) {
    const provider = process.env.TRANSLATION_PROVIDER || (process.env.AGNES_KEY ? "agnes" : "google")
    if (provider === "google") {
        return translateDescriptionsWithGoogle(locale, descriptions)
    }
    return translateDescriptionsWithAgnes(locale, descriptions)
}

async function getModrinthDescription(ids) {
    if (!ids || ids.length === 0) return {}
    const missing = ids.filter((id) => !modrinthDescCache.has(id))

    for (let i = 0; i < missing.length; i += 100) {
        const slice = missing.slice(i, i + 100)
        const url = new URL("https://api.modrinth.com/v2/projects")
        url.searchParams.append("ids", JSON.stringify(slice))
        try {
            const resp = await fetch(url.toString(), {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "Voxelum/xmcl-community-content-i18n",
                },
            })
            if (resp.ok) {
                const projects = await resp.json()
                for (const p of projects) {
                    modrinthDescCache.set(p.id, String(p.description || "").replaceAll(/[\r\n]+/g, " ").trim())
                }
            }
        } catch (e) {
            console.warn(`Modrinth fetch warning: ${e.message}`)
        }
        await sleep(50)
    }

    return Object.fromEntries(
        ids.map((id) => [id, modrinthDescCache.get(id)]).filter(([_, d]) => d)
    )
}

async function processFile(locale, file, remainingQuota, isUnlimited) {
    const filePath = join("src", locale, file)
    if (!existsSync(filePath)) return { translatedCount: 0, remainingQuota }

    const fileContent = readFileSync(filePath, "utf-8")
    const lines = fileContent.split("\n").filter((l) => l.trim().length > 0)
    if (lines.length <= 1) return { translatedCount: 0, remainingQuota }

    const header = lines[0]
    const rows = lines.slice(1).map(splitCsvLine)

    // Collect rows needing translation (has modrinthId and empty description)
    const pendingIndices = []
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const modrinthId = row[1]
        const desc = row.slice(3).join(",")
        if (modrinthId && (!desc || !desc.trim())) {
            pendingIndices.push(i)
        }
    }

    if (pendingIndices.length === 0) {
        return { translatedCount: 0, remainingQuota }
    }

    const quotaStr = isUnlimited ? "unlimited" : String(remainingQuota)
    console.log(`[${locale}] ${file}: ${pendingIndices.length} pending translations. Quota: ${quotaStr}`)

    let translatedCount = 0

    for (let i = 0; i < pendingIndices.length; i += batchSize) {
        if (!isUnlimited && remainingQuota <= 0) break

        const currentBatchLimit = isUnlimited ? batchSize : Math.min(batchSize, remainingQuota)
        const batchIndices = pendingIndices.slice(i, Math.min(i + currentBatchLimit, pendingIndices.length))
        const batchRows = batchIndices.map((idx) => rows[idx])
        const ids = batchRows.map((r) => r[1]).filter(Boolean)

        try {
            const descDict = await getModrinthDescription(ids)
            const toTranslate = {}
            for (const row of batchRows) {
                const id = row[1]
                if (descDict[id]) {
                    toTranslate[id] = descDict[id]
                }
            }

            if (Object.keys(toTranslate).length > 0) {
                console.log(`  [${locale}] Translating batch of ${Object.keys(toTranslate).length} descriptions...`)
                const translatedDict = await translateDescriptions(locale, toTranslate)

                for (const idx of batchIndices) {
                    const row = rows[idx]
                    const id = row[1]
                    const translatedText = translatedDict[id] || descDict[id]
                    if (translatedText) {
                        row[3] = toCsvField(translatedText)
                        translatedCount++
                        if (!isUnlimited) remainingQuota--
                    }
                }

                // Immediately save progress so no translated work is lost
                const newCsv = [header, ...rows.map((r) => r.join(","))].join("\n")
                writeFileSync(filePath, newCsv)
            }
        } catch (e) {
            console.error(`  [${locale}] Error processing batch: ${e.message}`)
            if (e.message.includes("AGNES_KEY") || e.message.includes("401") || e.message.includes("403")) {
                throw e
            }
        }

        if (REQUEST_DELAY_MS > 0) {
            await sleep(REQUEST_DELAY_MS)
        }
    }

    if (translatedCount > 0) {
        console.log(`[${locale}] Saved ${file} (+${translatedCount} translated)`)
    }

    return { translatedCount, remainingQuota }
}

async function main() {
    const provider = process.env.TRANSLATION_PROVIDER || (process.env.AGNES_KEY ? "agnes" : "google")
    console.log(`Using translation engine: ${provider.toUpperCase()}`)

    if (provider === "agnes" && !process.env.AGNES_KEY) {
        console.error("Error: AGNES_KEY environment variable is not set.")
        process.exit(1)
    }

    const targetLocales = getTargetLocales()
    const isUnlimited = QUOTA_PER_LOCALE === 0
    console.log(`Target locales (${targetLocales.length}): ${targetLocales.join(", ")}`)
    console.log(`Quota per locale: ${isUnlimited ? "UNLIMITED (translate all)" : QUOTA_PER_LOCALE}`)

    for (const locale of targetLocales) {
        console.log(`\n=== Processing locale: ${locale} ===`)
        let remainingQuota = QUOTA_PER_LOCALE

        for (const file of DEFAULT_FILES) {
            if (!isUnlimited && remainingQuota <= 0) break
            const result = await processFile(locale, file, remainingQuota, isUnlimited)
            remainingQuota = result.remainingQuota
        }
    }

    console.log("\nDone translating.")
}

main().catch((e) => {
    console.error(`Fatal error: ${e.message}`)
    process.exit(1)
})