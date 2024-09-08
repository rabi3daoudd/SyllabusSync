// pages/api/test-api.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        // Handle GET request
        res.status(200).json({ message: 'GET request successful', data: 'Hello from the server!' });
    } else if (req.method === 'POST') {
        // Handle POST request
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Name is required in POST request' });
        }

        res.status(200).json({ message: `POST request successful, hello ${name}!` });
    } else {
        // Handle unsupported methods
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
