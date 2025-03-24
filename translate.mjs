import { readFileSync, writeFileSync, readdirSync } from "fs"

const dirs = readdirSync("src");
const allowedLocales = ["zh-cn"];

export const chat = (messages) => {
    const key = process.env.DEEPSEEK_API_KEY;
    return fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages,
        }),
    }).then((resp) => resp.json());
};

const example = JSON.stringify({
    xl3myxch: "Library Mod required by all of ApexStudios' mods",
    Lq6ojcWv: "Enderman Overhaul adds over 20 new enderman variants, each with their own sounds, models, and animations!",
    WXDvMkR5: 'Disable the "experimental world settings" warning screen',
})

const exampleOut = JSON.stringify({
    xl3myxch: "ApexStudios所有模组必需的库模组",
    Lq6ojcWv: "Enderman Overhaul 添加了20多种新末影人变种，各有独特音效、模型和动画！",
    WXDvMkR5: '禁用"实验性世界设置"警告界面',
})

async function translateByDS(locale, descriptions) {
    const resp = await chat([
        {
            role: "system",
            content:
                "You are an asistant of a Minecraft mod developer. You are asked to translate the mod description into different languages by locale code. Users will input a json, which key is the project id, and the value is description. You should translate each description into the target locale and output a json raw text directly.",
        },
        {
            role: "user",
            content:
                "Translate following into zh-CN:```json\n" + example + "\n```",
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
        return resp;
    }
    let content = resp.choices[0].message.content;
    if (content.startsWith('```json')) {
        content = content.substring('```json'.length);
    }
    if (content.endsWith('```')) {
        content = content.substring(0, content.length - 3);
    }
    if (content.startsWith(locale)) {
        content = content.substring(locale.length);
    }
    console.log('translate raw', content)
    return JSON.parse(content)
}

async function getModrinthDescription(ids) {
    // fetch projects by modrinth ids
    const url = new URL("https://api.modrinth.com/v2/projects");
    url.searchParams.append("ids", JSON.stringify(ids));
    const resp = await fetch(url.toString(), {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
    const projects = await resp.json();
    return Object.fromEntries(projects.map((p) => [p.id, p.description.replaceAll("\n", " ")]));
}

const batchSize = 64
let quota = process.env.CRON === 'true' ? 640 : batchSize

async function main() {
    for (const dir of dirs) {
        if (!allowedLocales.includes(dir)) {
            continue;
        }
        const locale = dir;

        const files = readdirSync(`src/${dir}`);
        for (const file of files) {
            if (file.endsWith(".csv")) {
                let buffer = []

                const flush = async () => {
                    const descriptions = buffer
                    buffer = []

                    if (descriptions.length === 0) {
                        return
                    }
                    if (quota <= 0) {
                        return
                    }

                    quota -= descriptions.length

                    const dict = await getModrinthDescription(descriptions.map((row) => row[1]));

                    console.log('dict', dict)

                    const resolvedDescriptions = descriptions.map((row) => ({ row, descrption: dict[row[1]] }))

                    console.log('resolvedDescriptions', resolvedDescriptions)

                    const translated = await translateByDS(locale, Object.fromEntries(resolvedDescriptions.map((resolved) => [resolved.row[1], resolved.descrption])));

                    for (let i = 0; i < resolvedDescriptions.length; i += 1) {
                        const { row, descrption } = resolvedDescriptions[i]
                        let d = translated[row[1]] || descrption
                        console.log(descrption, d)
                        if (d) {
                            if (d.indexOf(',') !== -1) {
                                d = `"${d}"`
                            }
                            row[3] = d
                        }
                    }
                }

                const csvFile = readFileSync(`src/${dir}/${file}`, "utf-8");
                const lines = csvFile.split("\n");
                const csvContentLines = lines.map((l) => l.split(","));
                for (let i = 1; i < csvContentLines.length; i += 1) {
                    if (quota <= 0) {
                        break
                    }
                    const line = csvContentLines[i];
                    if (!!line[3] || !line[1]) {
                        continue
                    }
                    if (buffer.length < batchSize) {
                        buffer.push(line)
                        continue
                    }
                    await flush()
                }
                await flush()
                writeFileSync(`src/${dir}/${file}`, csvContentLines.map((l) => l.join(",")).join("\n"));
            }
        }
    }
}

main()