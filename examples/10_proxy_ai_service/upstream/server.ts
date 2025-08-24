/**
 * AI Text Service - Upstream Server
 *
 * A simple Bun server that provides AI-like text processing capabilities.
 * This simulates what a real AI/ML service would do:
 * - Text summarization
 * - Sentiment analysis
 * - Keyword extraction
 *
 * In a real-world scenario, this could be:
 * - A local LLM inference server (Ollama, vLLM)
 * - A Python ML service (FastAPI with transformers)
 * - Any third-party AI API
 */

const PORT = 3001;

interface SummarizeRequest {
    text: string;
    max_length?: number;
}

interface SentimentRequest {
    text: string;
}

interface KeywordsRequest {
    text: string;
    max_keywords?: number;
}

// Simple word frequency for keyword extraction
function extractKeywords(text: string, maxKeywords: number = 5): string[] {
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
        'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'must', 'shall', 'can', 'this', 'that', 'these',
        'those', 'it', 'its', 'they', 'them', 'their', 'we', 'us', 'our', 'you',
        'your', 'i', 'me', 'my', 'he', 'him', 'his', 'she', 'her', 'who', 'what',
        'when', 'where', 'why', 'how', 'which', 'not', 'no', 'yes', 'all', 'any',
        'some', 'most', 'more', 'less', 'than', 'very', 'just', 'also', 'only'
    ]);

    const words = text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word));

    const frequency: Record<string, number> = {};
    for (const word of words) {
        frequency[word] = (frequency[word] || 0) + 1;
    }

    return Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxKeywords)
        .map(([word]) => word);
}

// Simple summarization (extract key sentences)
function summarize(text: string, maxLength: number = 100): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    if (sentences.length <= 2) {
        return text.slice(0, maxLength);
    }

    // Score sentences by keyword presence
    const keywords = extractKeywords(text, 10);
    const scored = sentences.map(sentence => {
        const words = sentence.toLowerCase().split(/\s+/);
        const score = keywords.filter(kw => words.includes(kw)).length;
        return { sentence: sentence.trim(), score };
    });

    // Take top sentences
    const topSentences = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .map(s => s.sentence);

    const summary = topSentences.join('. ');
    return summary.length > maxLength ? summary.slice(0, maxLength) + '...' : summary + '.';
}

// Simple sentiment analysis
function analyzeSentiment(text: string): { sentiment: string; score: number; confidence: number } {
    const positiveWords = new Set([
        'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love',
        'happy', 'best', 'awesome', 'perfect', 'beautiful', 'brilliant', 'outstanding',
        'positive', 'success', 'successful', 'win', 'winner', 'enjoy', 'enjoyable',
        'pleasant', 'delightful', 'impressive', 'remarkable', 'superb', 'exceptional'
    ]);

    const negativeWords = new Set([
        'bad', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'poor', 'sad',
        'disappointing', 'disappointed', 'failure', 'failed', 'fail', 'wrong',
        'negative', 'problem', 'issue', 'error', 'mistake', 'ugly', 'boring',
        'annoying', 'frustrating', 'useless', 'waste', 'broken', 'difficult'
    ]);

    const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of words) {
        if (positiveWords.has(word)) positiveCount++;
        if (negativeWords.has(word)) negativeCount++;
    }

    const total = positiveCount + negativeCount;
    if (total === 0) {
        return { sentiment: 'neutral', score: 0, confidence: 0.5 };
    }

    const score = (positiveCount - negativeCount) / total;
    const confidence = Math.min(0.5 + (total / words.length) * 2, 0.95);

    let sentiment: string;
    if (score > 0.2) sentiment = 'positive';
    else if (score < -0.2) sentiment = 'negative';
    else sentiment = 'neutral';

    return { sentiment, score: Math.round(score * 100) / 100, confidence: Math.round(confidence * 100) / 100 };
}

const server = Bun.serve({
    port: PORT,
    async fetch(req) {
        const url = new URL(req.url);
        const path = url.pathname;

        console.log(`[AI Service] ${req.method} ${path}`);

        // Health check (matches /ai/health from NpgsqlRest proxy)
        if (path === '/ai/health' && req.method === 'GET') {
            return Response.json({ status: 'healthy', service: 'ai-text-service', version: '1.0.0' });
        }

        // Summarize endpoint (matches /ai/summarize from NpgsqlRest proxy)
        if (path === '/ai/summarize' && req.method === 'POST') {
            try {
                const body: SummarizeRequest = await req.json();
                if (!body.text) {
                    return Response.json({ error: 'Missing required field: text' }, { status: 400 });
                }
                const summary = summarize(body.text, body.max_length || 150);
                return Response.json({
                    original_length: body.text.length,
                    summary_length: summary.length,
                    summary,
                    model: 'simple-extractive-v1'
                });
            } catch (e) {
                return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
            }
        }

        // Sentiment analysis endpoint (matches /ai/sentiment from NpgsqlRest proxy)
        if (path === '/ai/sentiment' && req.method === 'POST') {
            try {
                const body: SentimentRequest = await req.json();
                if (!body.text) {
                    return Response.json({ error: 'Missing required field: text' }, { status: 400 });
                }
                const result = analyzeSentiment(body.text);
                return Response.json({
                    ...result,
                    text_length: body.text.length,
                    model: 'simple-lexicon-v1'
                });
            } catch (e) {
                return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
            }
        }

        // Keyword extraction endpoint (matches /ai/keywords from NpgsqlRest proxy)
        if (path === '/ai/keywords' && req.method === 'POST') {
            try {
                const body: KeywordsRequest = await req.json();
                if (!body.text) {
                    return Response.json({ error: 'Missing required field: text' }, { status: 400 });
                }
                const keywords = extractKeywords(body.text, body.max_keywords || 5);
                return Response.json({
                    keywords,
                    count: keywords.length,
                    text_length: body.text.length,
                    model: 'simple-frequency-v1'
                });
            } catch (e) {
                return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
            }
        }

        // Full analysis endpoint (matches /ai/analyze from NpgsqlRest proxy)
        if (path === '/ai/analyze' && req.method === 'POST') {
            try {
                const body: SummarizeRequest & KeywordsRequest = await req.json();
                if (!body.text) {
                    return Response.json({ error: 'Missing required field: text' }, { status: 400 });
                }

                const summary = summarize(body.text, body.max_length || 150);
                const sentiment = analyzeSentiment(body.text);
                const keywords = extractKeywords(body.text, body.max_keywords || 5);

                return Response.json({
                    summary: {
                        text: summary,
                        original_length: body.text.length,
                        summary_length: summary.length
                    },
                    sentiment,
                    keywords: {
                        words: keywords,
                        count: keywords.length
                    },
                    model: 'combined-analysis-v1',
                    processed_at: new Date().toISOString()
                });
            } catch (e) {
                return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
            }
        }

        return Response.json({ error: 'Not found' }, { status: 404 });
    }
});

console.log(`AI Text Service running on http://localhost:${PORT}`);
console.log('Available endpoints (matching NpgsqlRest proxy paths):');
console.log('  GET  /ai/health    - Health check');
console.log('  POST /ai/summarize - Summarize text');
console.log('  POST /ai/sentiment - Analyze sentiment');
console.log('  POST /ai/keywords  - Extract keywords');
console.log('  POST /ai/analyze   - Full analysis (all of the above)');
