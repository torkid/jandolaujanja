const axios = require('axios');

export default async function handler(req, res) {
    // Ruhusu request kutoka popote (CORS) ili kuepusha errors
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Kama ni OPTIONS request (browser inacheck connection), iruhusu ipite
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Hakikisha ni POST request tu
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Tumia POST.' });
    }

    try {
        const { phone_number, amount } = req.body;

        // Validation ndogo
        if (!phone_number || !amount) {
            return res.status(400).json({ error: 'Tafadhali tuma namba ya simu na kiasi.' });
        }

        // Data zinazokwenda ZenoPay
        // Tunatumia URLSearchParams kwa sababu ZenoPay inapokea form-urlencoded
        const params = new URLSearchParams();
        params.append('create_order', '1');
        params.append('payment_account', 'mobile'); // Au 'bank' kulingana na settings zako
        params.append('api_key', 'sv5YWe1oG-UtuxHtlTaC5ilIai9CWQufO3uwtoZtqpwwmZUWncric2JICY9diemFiue1XRNaiPnDgQtjxTqEFg');
        params.append('amount', amount);
        params.append('phone_number', phone_number);

        // Tuma request ZenoPay
        const response = await axios.post('https://api.zeno.africa/payment', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        // Rudisha majibu kwa Frontend (HTML)
        return res.status(200).json(response.data);

    } catch (error) {
        console.error('ZenoPay Error:', error.response ? error.response.data : error.message);
        return res.status(500).json({ 
            error: 'Tatizo la mawasiliano na ZenoPay.',
            details: error.message 
        });
    }
}
