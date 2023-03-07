const { existsSync } = require('fs');
const { dirname } = require('path')
const { writeFile, mkdir } = require('fs/promises');
const mongo = require('mongodb');
// connect to mongo db
const client = new mongo.MongoClient(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
const dbName = process.env.MONGO_DB_NAME;
const collectionName = process.env.MONGO_COLLECTION_NAME;
const collection = client.db(dbName).collection(collectionName);
// async iterate all document
/**
 * @param {'md' | 'html'} extension md or html
 */
async function iterateAllDocument(extension) {
    const cursor = collection.find({});
    while (await cursor.hasNext()) {
        const doc = await cursor.next();
        const domain = doc.domain // curseforge or modrinth
        const locale = doc.locale // locale code
        const slug = doc.slug // mod slug
        const hash = doc.hash
        const content = doc.content // translated content
        const filePath = `./${domain}/${locale}/${slug}/${hash}.${extension}`
        // write file if file does not existed
        if (existsSync(filePath)) continue
        await ensureFileDir(filePath)
        await writeFile(filePath, content)
    }
}

async function ensureFileDir(filePath) {
    const dir = dirname(filePath);
    if (existsSync(dir)) return
    await mkdir(dir, { recursive: true })
}

iterateAllDocument();