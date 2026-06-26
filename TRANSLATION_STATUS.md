# Japanese Shard Translation Status

## Summary
Prepared translation infrastructure for Minecraft mod descriptions to Japanese (ja-011, ja-012, ja-013).

## Files Created
- `translate-ja.mjs` - Direct Node.js translation script using Agnes AI API
- `translate-shard.mjs` - Modified to auto-detect locale from shard name  
- `.github/workflows/translate-ja-shards.yml` - GitHub Actions workflow
- `.github/workflows/debug-translation.yml` - Debug workflow (can be deleted)

## Output Files  
- `build/cache/out/ja-011.json` - 250 keys (English, awaiting translation)
- `build/cache/out/ja-012.json` - 250 keys (English, awaiting translation)
- `build/cache/out/ja-013.json` - 250 keys (English, awaiting translation)

## How to Complete Translation

### Option 1: Local Execution (Recommended)
```bash
export AGNES_KEY='your-api-key'
node translate-shard.mjs ja-011
node translate-shard.mjs ja-012  
node translate-shard.mjs ja-013
```

### Option 2: Via GitHub Actions
Trigger the workflow:
```bash
gh workflow run translate-ja-shards.yml -R Voxelum/xmcl-commuity-content-i18n
```

## Key Features
- Batches of 50 entries per API request (efficient)
- Preserves mod names and proper nouns in English/Latin script
- Auto-detects target language from shard name
- Comprehensive error handling and logging

## Translation Quality Notes
Agnes AI (agnes-2.0-flash) model configured with system prompt to:
- Translate descriptions to target locale
- Keep technical terms (mod names, brand names, proper nouns) untranslated
- Output valid JSON

## Status
✓ Infrastructure ready
✓ Scripts configured
✓ Output directory structure created
✗ Translations pending API execution
