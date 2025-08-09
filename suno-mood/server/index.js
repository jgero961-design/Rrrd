import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const SUNO_API_BASE = 'https://api.sunoapi.org';
const SUNO_API_KEY = process.env.SUNO_API_KEY;

if (!SUNO_API_KEY) {
  console.warn('Warning: SUNO_API_KEY is not set. Set it in a .env file or environment variable.');
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Simple health check
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Map moods to prompts
const MOOD_TO_PROMPT = {
  happy: 'A cheerful, upbeat pop instrumental with bright synths, catchy melody, and 120 BPM in major key. Radio-friendly, positive vibes.',
  sad: 'A melancholic, slow piano and strings instrumental in minor key, 70 BPM, emotional and introspective, cinematic ambience.',
  energetic: 'High-energy EDM instrumental with driving bass, punchy drums, 128 BPM, festival vibe, uplifting leads.',
  calm: 'Soothing lo-fi chillhop instrumental with warm Rhodes, vinyl texture, soft drums, 80 BPM, relaxed and cozy.',
  dark: 'Dark, moody trap instrumental with 808s, eerie pads, sparse piano, 140 BPM, minor key, atmospheric.'
};

// Start a generation by mood or custom prompt
app.post('/api/generate', async (req, res) => {
  try {
    const { mood, prompt: customPrompt, model = 'V3_5', instrumental = true } = req.body || {};
    const basePrompt = mood && MOOD_TO_PROMPT[mood] ? MOOD_TO_PROMPT[mood] : null;
    const prompt = customPrompt || basePrompt;

    if (!prompt) {
      return res.status(400).json({ error: 'Provide either a valid mood or a custom prompt.' });
    }

    const response = await axios.post(
      `${SUNO_API_BASE}/api/v1/generate`,
      {
        prompt,
        customMode: true,
        instrumental,
        model,
      },
      {
        headers: {
          'Authorization': `Bearer ${SUNO_API_KEY}`,
          'Content-Type': 'application/json',
        }
      }
    );

    // Expecting response contains taskId
    const data = response.data;
    const taskId = data?.data?.taskId || data?.taskId || data?.id;

    if (!taskId) {
      return res.status(502).json({ error: 'Unexpected response from Suno API', details: data });
    }

    res.json({ taskId });
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ error: 'Failed to start generation', details: err.response?.data || err.message });
  }
});

// Poll task status
app.get('/api/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    const response = await axios.get(
      `${SUNO_API_BASE}/api/v1/tasks/${encodeURIComponent(taskId)}`,
      {
        headers: {
          'Authorization': `Bearer ${SUNO_API_KEY}`,
        }
      }
    );

    // Expecting fields like status and audioUrl (or similar)
    const data = response.data;
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ error: 'Failed to fetch task status', details: err.response?.data || err.message });
  }
});

// Fallback to SPA index.html for non-API routes
app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});