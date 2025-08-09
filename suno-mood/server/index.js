import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import qs from 'querystring';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const SUNO_API_BASE = 'https://api.sunoapi.org';
const SUNO_API_KEY = process.env.SUNO_API_KEY;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL ? process.env.PUBLIC_BASE_URL.replace(/\/$/, '') : '';

if (!SUNO_API_KEY) {
  console.warn('Warning: SUNO_API_KEY is not set. Set it in a .env file or environment variable.');
}

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Simple health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, publicBaseUrl: PUBLIC_BASE_URL || null });
});

// Map moods to prompts
const MOOD_TO_PROMPT = {
  happy: 'A cheerful, upbeat pop instrumental with bright synths, catchy melody, and 120 BPM in major key. Radio-friendly, positive vibes.',
  sad: 'A melancholic, slow piano and strings instrumental in minor key, 70 BPM, emotional and introspective, cinematic ambience.',
  energetic: 'High-energy EDM instrumental with driving bass, punchy drums, 128 BPM, festival vibe, uplifting leads.',
  calm: 'Soothing lo-fi chillhop instrumental with warm Rhodes, vinyl texture, soft drums, 80 BPM, relaxed and cozy.',
  dark: 'Dark, moody trap instrumental with 808s, eerie pads, sparse piano, 140 BPM, minor key, atmospheric.'
};

// In-memory webhook store
const webhookByTaskId = new Map();

// Webhook receiver (make sure PUBLIC_BASE_URL is publicly reachable)
app.post('/api/webhook', (req, res) => {
  try {
    const payload = req.body || {};
    const taskId = payload?.data?.taskId || payload?.taskId || payload?.id;
    if (taskId) {
      webhookByTaskId.set(taskId, payload);
      console.log('Webhook received for taskId', taskId);
    } else {
      console.log('Webhook received without taskId');
    }
  } catch (e) {
    console.error('Webhook handling error:', e.message);
  }
  res.status(200).json({ ok: true });
});

// Start a generation by mood or custom prompt
app.post('/api/generate', async (req, res) => {
  try {
    const { mood, prompt: customPrompt, model = 'V3_5', instrumental = true } = req.body || {};
    const basePrompt = mood && MOOD_TO_PROMPT[mood] ? MOOD_TO_PROMPT[mood] : null;
    const prompt = customPrompt || basePrompt;

    if (!prompt) {
      return res.status(400).json({ error: 'Provide either a valid mood or a custom prompt.' });
    }

    const callBackUrl = PUBLIC_BASE_URL ? `${PUBLIC_BASE_URL}/api/webhook` : undefined;
    if (!callBackUrl) {
      console.warn('PUBLIC_BASE_URL is not set; Suno API may reject request due to missing callBackUrl');
    }

    // Send form-encoded as Suno expects callBackUrl
    const formBody = qs.stringify({
      prompt,
      customMode: true,
      instrumental,
      model,
      callBackUrl: callBackUrl || '',
    });
    const formResp = await axios.post(
      `${SUNO_API_BASE}/api/v1/generate`,
      formBody,
      {
        headers: {
          'Authorization': `Bearer ${SUNO_API_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        timeout: 30000,
        validateStatus: () => true,
      }
    );

    let data = formResp.data;
    let taskId = data?.data?.taskId || data?.taskId || data?.id;

    if (!taskId) {
      console.error('Suno generate unexpected:', { status: formResp.status, data });
      return res.status(502).json({ error: 'Unexpected response from Suno API', status: formResp.status, details: data });
    }

    res.json({ taskId });
  } catch (err) {
    const status = err.response?.status || 500;
    console.error('Suno generate error:', err.response?.data || err.message);
    res.status(status).json({ error: 'Failed to start generation', details: err.response?.data || err.message });
  }
});

// Poll task status
app.get('/api/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    // Serve from webhook data if available
    if (webhookByTaskId.has(taskId)) {
      return res.json(webhookByTaskId.get(taskId));
    }

    const response = await axios.get(
      `${SUNO_API_BASE}/api/v1/tasks/${encodeURIComponent(taskId)}`,
      {
        headers: {
          'Authorization': `Bearer ${SUNO_API_KEY}`,
        }
      }
    );

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
  console.log('PUBLIC_BASE_URL =', PUBLIC_BASE_URL || '(not set)');
});