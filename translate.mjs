import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "fs"
import { join } from "path"
import { jsonrepair } from "jsonrepair"
import { chat } from "./agnes.mjs"

export { chat }

const EXCLUDED_LOCALES = new Set(["en", "ru"])
const DEFAULT_FILES = ["mods.csv", "resourcepacks.csv", "shaderpacks.csv", "modpacks.csv"]

const batchSize = Number(process.env.BATCH_SIZE ?? 50)
const defaultQuota = process.env.CRON === "true" ? 200 : 50
const quotaArg = process.argv.find((a) => a.startsWith("--quota="))?.split("=")[1]
const QUOTA_PER_LOCALE = Number(quotaArg ?? process.env.QUOTA_PER_LOCALE ?? process.env.QUOTA ?? defaultQuota)
const REQUEST_DELAY_MS = Number(process.env.REQUEST_DELAY_MS ?? 1000)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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

async function translateDescriptionsWithGoogle(locale, descriptions) {
    const result = {}
    for (const [id, text] of Object.entries(descriptions)) {
        try {
            result[id] = await translateWithGoogleSingle(text, locale)
            await sleep(120)
        } catch (e) {
            console.warn(`  [${locale}] Google translate failed for ${id}: ${e.message}`)
            result[id] = text
        }
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
    const url = new URL("https://api.modrinth.com/v2/projects")
    url.searchParams.append("ids", JSON.stringify(ids))
    const resp = await fetch(url.toString(), {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "Voxelum/xmcl-community-content-i18n",
        },
    })
    if (!resp.ok) {
        console.warn(`Modrinth API warning: ${resp.status} ${resp.statusText}`)
        return {}
    }
    const projects = await resp.json()
    return Object.fromEntries(
        projects.map((p) => [p.id, String(p.description || "").replaceAll(/[\r\n]+/g, " ").trim()])
    )
}

async function processFile(locale, file, remainingQuota) {
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

    console.log(`[${locale}] ${file}: ${pendingIndices.length} pending translations. Quota: ${remainingQuota}`)

    let translatedCount = 0
    let dirty = false

    for (let i = 0; i < pendingIndices.length && remainingQuota > 0; i += batchSize) {
        const batchIndices = pendingIndices.slice(i, Math.min(i + batchSize, pendingIndices.length))
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
                        dirty = true
                        translatedCount++
                        remainingQuota--
                    }
                }
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

    if (dirty) {
        const newCsv = [header, ...rows.map((r) => r.join(","))].join("\n")
        writeFileSync(filePath, newCsv)
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
    console.log(`Target locales (${targetLocales.length}): ${targetLocales.join(", ")}`)
    console.log(`Quota per locale: ${QUOTA_PER_LOCALE}`)

    for (const locale of targetLocales) {
        console.log(`\n=== Processing locale: ${locale} ===`)
        let remainingQuota = QUOTA_PER_LOCALE

        for (const file of DEFAULT_FILES) {
            if (remainingQuota <= 0) break
            const result = await processFile(locale, file, remainingQuota)
            remainingQuota = result.remainingQuota
        }
    }

    console.log("\nDone translating.")
}

main().catch((e) => {
    console.error(`Fatal error: ${e.message}`)
    process.exit(1)
})