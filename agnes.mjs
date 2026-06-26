export const AGNES_API_URL = "https://apihub.agnes-ai.com/v1/chat/completions";
export const AGNES_MODEL = "agnes-2.0-flash";

/**
 * Call the Agnes AI chat completion API.
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<any>} the parsed JSON response
 */
export const chat = (messages) => {
    const key = process.env.AGNES_KEY;
    if (!key) throw new Error("AGNES_KEY not set");
    return fetch(AGNES_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
            model: AGNES_MODEL,
            messages,
        }),
    }).then((resp) => resp.json());
};
