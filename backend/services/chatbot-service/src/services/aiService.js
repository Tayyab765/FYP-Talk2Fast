// Call external RAG API to get an AI answer
// Contract:
//  input: { userId, message, context? }
//  output: string answer from FastAPI (fallbacks to a simple echo on error)
export const generateAIResponse = async ({ userId, message, context = [] }) => {
    const baseUrl = process.env.RAG_API_URL; // e.g. https://your-ngrok-host

    // Summarize previous messages (stored with `text` in our DB)
    const contextSummary = (context || [])
        .map(m => `${m?.sender || 'unknown'}:${m?.text || m?.message || ''}`)
        .join(' | ');

    if (!baseUrl) {
        // No external endpoint configured; return a lightweight fallback
        return `🤖 (local fallback) ${message}`;
    }

    // POST { query } to <RAG_API_URL>/ask
    const url = `${baseUrl.replace(/\/$/, '')}/ask`;

    // Timeout via AbortController (Node 18+)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 15s

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: message,
                use_llm: process.env.RAG_USE_LLM !== 'false',
            }),
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`RAG API HTTP ${res.status}: ${text?.slice(0, 200)}`);
        }

        const data = await res.json();
        const answer = data?.answer ?? '';
        if (!answer) throw new Error('RAG API: missing answer');
        return String(answer);
    } catch (err) {
        console.error("AI response error:", err);
        // Graceful degradation: include a tiny context hint to aid UX while offline
        return `🤖 (fallback) Sorry I didn't find a response for your query.`;
       // return `🤖 (fallback) ${message}${contextSummary ? ` (ctx: ${contextSummary.slice(0, 120)})` : ''}`;
    } finally {
        clearTimeout(timeout);
    }
};

async function generateReply(message, user) {
    // Legacy helper (kept for compatibility)
    return `Echo: ${message}`;
}

export { generateReply };
