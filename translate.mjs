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

async function translateByDS(locale, descriptions) {
    const resp = await chat([
        {
            role: "system",
            content:
                "You are an asistant of a Minecraft mod developer. You are asked to translate the mod description into different languages by locale code. Please do not add locale prefix to output. Users will input multiple description split by line feed. You should translate each description into the target locale and output them in the same order with \t spliting original text and translated text.",
        },
        {
            role: "user",
            content:
                "Translate following into zh-CN:\nThis is an example\nThis is the second description!\nHello world~",
        },
        {
            role: "assistant",
            content: "This is an example\t这是一个例子\nThis is the second description!\t这是第二个简介！\nHello world~\t你好世界~",
        },
        {
            role: "user",
            content: `Translate following text into ${locale}:\n${descriptions.join("\n")}`,
        },
    ]);
    if ("error" in resp) {
        return resp;
    }
    let content = resp.choices[0].message.content;
    if (content.startsWith('```' + locale)) {
        content = content.substring(('```' + locale).length);
        content = content.substring(0, content.length - 3);
    }
    if (content.startsWith(locale)) {
        content = content.substring(locale.length);
    }
    return Object.fromEntries(content.split("\n").filter((l) => l.trim().length > 0).map(r => r.split("\t")));
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
    return Object.fromEntries(projects.map((p) => [p.id, p.description]));
}

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
                const size = 32
                const csvFile = readFileSync(`src/${dir}/${file}`, "utf-8");
                const lines = csvFile.split("\n");
                const csvContentLines = lines.map((l) => l.split(","));
                for (let i = 1; i < csvContentLines.length; i += 1) {
                    const line = csvContentLines[i];
                    if (!!line[3] || !line[1]) {
                        continue
                    }
                    if (buffer.length < size) {
                        buffer.push(line)
                        continue
                    }

                    const descriptions = buffer
                    buffer = []

                    const dict = await getModrinthDescription(descriptions.map((row) => row[1]));

                    console.log('dict', dict)

                    const resolvedDescriptions = descriptions.map((row) => ({ row, descrption: dict[row[1]] }))

                    console.log('resolvedDescriptions', resolvedDescriptions)

                    const translated = await translateByDS(locale, resolvedDescriptions.map((resolved) => resolved.descrption));

                    console.log('translated', translated)

                    for (const { row, descrption } of resolvedDescriptions) {
                        let d = translated[descrption] || descrption
                        if (d.indexOf(',') !== -1) {
                            d = `"${d}"`
                        }
                        row[3] = d
                    }
                    break
                }

                writeFileSync(`src/${dir}/${file}`, csvContentLines.map((l) => l.join(",")).join("\n"));
            }
        }
    }
}

main()