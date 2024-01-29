import express from 'express';
import OpenAI from 'openai';

const app = express();
const openai = new OpenAI({ apiKey: "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" });


app.get('/fetch-assistant', async (req, res) => {
  try {
    const assistant = await openai.beta.assistants.retrieve("asst_oeqE5i6LVUou8dos9DXuuJnA");
    res.json(assistant);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).contentType('application/json').json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
