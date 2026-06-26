import { readFileSync, writeFileSync } from "fs";
import { chat } from "./agnes.mjs";

const example = JSON.stringify({
    xl3myxch: "Library Mod required by all of ApexStudios' mods",
    Lq6ojcWv: "Enderman Overhaul adds over 20 new enderman variants, each with their own sounds, models, and animations!",
    WXDvMkR5: 'Disable the "experimental world settings" warning screen',
});

const exampleOut = JSON.stringify({
    xl3myxch: "Бібліотечний мод, необхідний для всіх модів ApexStudios",
    Lq6ojcWv: "Enderman Overhaul додає понад 20 нових варіантів ендермена, кожен з власними звуками, моделями та анімаціями!",
    WXDvMkR5: 'Відключити екран попередження "експериментальних параметрів світу"',
});

async function translateDescriptions(locale, descriptions) {
    const resp = await chat([
        {
            role: "system",
            content:
                "You are an assistant of a Minecraft mod developer. You are asked to translate the mod description into different languages by locale code. Users will input a json, which key is the project id, and the value is description. You should translate each description into the target locale and output a json raw text directly. Keep mod names, brand names, and proper nouns in English/Latin script untranslated.",
        },
        {
            role: "user",
            content:
                "Translate following into uk:```json\n" + example + "\n```",
        },
        {
            role: "assistant",
            content: exampleOut,
        },
        {
            role: "user",
            content:
                "Translate following into " + locale + ":```json\n" + JSON.stringify(descriptions) + "\n```",
        },
    ]);
    if ("error" in resp) {
        throw new Error(`API error: ${resp.error.message}`);
    }
    let content = resp.choices[0].message.content;
    if (content.startsWith('```json')) {
        content = content.substring('```json'.length);
    }
    if (content.endsWith('```')) {
        content = content.substring(0, content.length - 3);
    }
    content = content.trim();
    if (content.startsWith('uk:')) {
        content = content.substring('uk:'.length).trim();
    }
    return JSON.parse(content);
}

async function translateShard(shardName, locale = null) {
    console.log(`Processing shard: ${shardName}`);
    
    // Extract locale from shard name if not provided (e.g., "ja-011" -> "ja")
    if (!locale) {
        const match = shardName.match(/^([a-z]{2})-/);
        locale = match ? match[1] : 'uk';
    }
    
    const inputPath = `build/cache/shard/${shardName}.json`;
    const outputPath = `build/cache/out/${shardName}.json`;
    
    const data = JSON.parse(readFileSync(inputPath, 'utf-8'));
    const entries = Object.entries(data);
    const keyCount = entries.length;
    
    console.log(`  Keys: ${keyCount}`);
    console.log(`  Locale: ${locale}`);
    
    // Process in batches of 50
    const batchSize = 50;
    const translated = {};
    
    for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        const batchObj = Object.fromEntries(batch);
        
        console.log(`  Translating batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(entries.length / batchSize)}`);
        
        try {
            const result = await translateDescriptions(locale, batchObj);
            Object.assign(translated, result);
        } catch (e) {
            console.error(`  Error translating batch: ${e.message}`);
            throw e;
        }
    }
    
    writeFileSync(outputPath, JSON.stringify(translated, null, 2));
    console.log(`  Written to ${outputPath}`);
    return keyCount;
}

async function main() {
    try {
        const shards = process.argv.slice(2);
        if (shards.length === 0) {
            throw new Error("No shard names provided");
        }
        
        for (const shard of shards) {
            const count = await translateShard(shard);
            console.log(`✓ ${shard}: ${count} keys\n`);
        }
    } catch (e) {
        console.error(`Fatal error: ${e.message}`);
        process.exit(1);
    }
}

main();
