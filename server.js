const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3001;

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);

    // Handle status check (GET request)
    if (req.method === 'GET' && parsedUrl.pathname === '/api/pay') {
        const orderId = parsedUrl.query.order_id;
        const apiKey = parsedUrl.query.api_key;

        if (!orderId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing order_id' }));
            return;
        }

        const options = {
            hostname: 'zenoapi.com',
            port: 443,
            path: `/api/payments/order-status?order_id=${orderId}`,
            method: 'GET',
            headers: {
                'x-api-key': apiKey
            }
        };

        const proxyReq = https.request(options, (proxyRes) => {
            let data = '';
            proxyRes.on('data', chunk => data += chunk);
            proxyRes.on('end', () => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(data);
            });
        });

        proxyReq.on('error', (e) => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        });

        proxyReq.end();
        return;
    }

    // Handle payment creation (POST request)
    if (req.method === 'POST' && parsedUrl.pathname === '/api/pay') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const jsonBody = JSON.parse(body);

                const postData = JSON.stringify({
                    order_id: jsonBody.order_id,
                    buyer_name: jsonBody.buyer_name,
                    buyer_phone: jsonBody.buyer_phone,
                    buyer_email: jsonBody.buyer_email,
                    amount: jsonBody.amount,
                    webhook_url: jsonBody.webhook_url || ''
                });

                const options = {
                    hostname: 'zenoapi.com',
                    port: 443,
                    path: '/api/payments/mobile_money_tanzania',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postData),
                        'x-api-key': jsonBody.api_key
                    }
                };

                const proxyReq = https.request(options, (proxyRes) => {
                    let data = '';
                    proxyRes.on('data', chunk => data += chunk);
                    proxyRes.on('end', () => {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(data);
                    });
                });

                proxyReq.on('error', (e) => {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                });

                proxyReq.write(postData);
                proxyReq.end();
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON body' }));
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`ZenoPay Proxy server running at http://localhost:${PORT}`);
    console.log('Endpoints:');
    console.log('  POST /api/pay - Create payment');
    console.log('  GET  /api/pay?order_id=xxx&api_key=xxx - Check status');
});
