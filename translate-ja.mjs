#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";

const API_KEY = process.env.DEEPSEEK_API_KEY;
if (!API_KEY) {
    console.error("ERROR: DEEPSEEK_API_KEY environment variable is not set");
    console.error("Set it with: export DEEPSEEK_API_KEY='your-api-key'");
    process.exit(1);
}

async function translateWithDeepSeek(locale, descriptions) {
    const prompt = `You are an assistant of a Minecraft mod developer. You are asked to translate the mod description into different languages by locale code. Users will input a json, which key is the project id, and the value is description. You should translate each description into the target locale and output a json raw text directly. Keep mod names, brand names, and proper nouns in English/Latin script untranslated.`;
    
    const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: prompt
                },
                {
                    role: "user",
                    content: `Translate following into ${locale}:\`\`\`json\n${JSON.stringify(descriptions)}\n\`\`\``
                }
            ]
        }),
    });

    const data = await response.json();
    
    if (!response.ok || data.error) {
        throw new Error(`DeepSeek API error: ${data.error?.message || response.statusText}`);
    }

    let content = data.choices[0].message.content;
    
    // Parse JSON from response
    if (content.startsWith('```json')) {
        content = content.substring('```json'.length);
    }
    if (content.endsWith('```')) {
        content = content.substring(0, content.length - 3);
    }
    content = content.trim();
    
    return JSON.parse(content);
}

async function translateShard(shardName, locale = "ja") {
    const inputPath = `build/cache/shard/${shardName}.json`;
    const outputPath = `build/cache/out/${shardName}.json`;
    
    console.log(`Processing ${shardName}...`);
    
    const data = JSON.parse(readFileSync(inputPath, 'utf-8'));
    const entries = Object.entries(data);
    const keyCount = entries.length;
    
    console.log(`  Total keys: ${keyCount}`);
    
    // Process in batches
    const batchSize = 50;
    const translated = {};
    
    for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        const batchObj = Object.fromEntries(batch);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(entries.length / batchSize);
        
        console.log(`  Translating batch ${batchNum}/${totalBatches}...`);
        
        try {
            const result = await translateWithDeepSeek(locale, batchObj);
            Object.assign(translated, result);
        } catch (e) {
            console.error(`  Error: ${e.message}`);
            throw e;
        }
    }
    
    writeFileSync(outputPath, JSON.stringify(translated, null, 2));
    console.log(`  ✓ Saved ${outputPath}`);
    console.log(`✓ ${shardName}: ${keyCount} keys\n`);
    
    return keyCount;
}

async function main() {
    const shards = process.argv.slice(2).length > 0 
        ? process.argv.slice(2) 
        : ['ja-011', 'ja-012', 'ja-013'];
    
    try {
        for (const shard of shards) {
            await translateShard(shard, 'ja');
        }
        console.log("Translation complete!");
    } catch (e) {
        console.error(`Fatal error: ${e.message}`);
        process.exit(1);
    }
}

main();
