import express from 'express';
import OpenAI from 'openai';
import * as dotenv from "dotenv";

dotenv.config({path:'../../.env'});

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY});


app.get('/fetch-assistant', async (req, res) => {
  try {
    const assistant = await openai.beta.assistants.retrieve(process.env.ASSISTANT_ID);
    res.json(assistant);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).contentType('application/json').json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
