export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Parse form data from request body
        let body = req.body;

        // If body is a string (URL encoded), parse it
        if (typeof body === 'string') {
            body = Object.fromEntries(new URLSearchParams(body));
        }

        // Forward the request to ZenoPay
        const params = new URLSearchParams();

        // Copy all parameters from the request
        for (const [key, value] of Object.entries(body)) {
            params.append(key, value);
        }

        const response = await fetch('https://api.zeno.africa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error('ZenoPay Error:', error);
        return res.status(500).json({
            error: 'Tatizo la mawasiliano na ZenoPay.',
            details: error.message
        });
    }
}
