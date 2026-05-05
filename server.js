import 'dotenv/config';
import express from 'express';
import { handleUpdate } from './src/agent.js';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/webhook', (req, res) => {
  res.sendStatus(200);
  handleUpdate(req.body).catch((err) =>
    console.error('Unhandled error in handleUpdate:', err)
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Content Agent listening on port ${PORT}`);
});

export async function registerWebhook() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const serverUrl = process.env.SERVER_URL;
  const url = `https://api.telegram.org/bot${token}/setWebhook?url=${serverUrl}/webhook`;
  const res = await fetch(url);
  const data = await res.json();
  console.log('Webhook registration result:', data);
  return data;
}
