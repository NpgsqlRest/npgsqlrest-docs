
const PORT = 3001;
const METHOD = 'POST';

const server = Bun.serve({
    port: PORT,
    async fetch(req) {
        const url = new URL(req.url);
        const path = url.pathname;

        if (path === '/average-book-price' && req.method === METHOD) {
            // The scraped HTML arrives in the request BODY (forwarded via @body_parameter_name
            // responseBody on a @proxy POST). The small HTTP-type fields arrive on the query string.
            const html = await req.text();
            const responseStatusCode = url.searchParams.get('responseStatusCode');
            const responseSuccess = url.searchParams.get('responseSuccess');
            const responseErrorMessage = url.searchParams.get('responseErrorMessage');

            // Each book price is `<p class="price_color">£51.77</p>`. Pull them all and average.
            const prices = [...html.matchAll(/class="price_color">\s*£([\d.]+)/g)]
                .map(m => Number(m[1]))
                .filter(n => !Number.isNaN(n));
            const avgPrice = prices.length
                ? prices.reduce((a, b) => a + b, 0) / prices.length
                : null;

            // Log compactly — never dump the whole HTML body to the console.
            console.log(`${METHOD} /average-book-price`, {
                bodyLength: html.length,
                pricesFound: prices.length,
                avgPrice,
                responseStatusCode,
                responseSuccess,
                responseErrorMessage,
            });

            return Response.json({ avgPrice });
        }

        return Response.json({ error: 'Not found' }, { status: 404 });
    }
});

console.log(`  ${METHOD} /average-book-price - Average book price (scraping demo) on :${PORT}`);
