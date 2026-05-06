import 'dotenv/config';
import express from 'express';
import { handleUpdate } from './src/agent.js';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/debug-drive', async (_req, res) => {
  const { google } = await import('googleapis');
  const info = {
    client_id_set: Boolean(process.env.GOOGLE_CLIENT_ID),
    client_secret_set: Boolean(process.env.GOOGLE_CLIENT_SECRET),
    refresh_token_set: Boolean(process.env.GOOGLE_REFRESH_TOKEN),
    folder_id_set: Boolean(process.env.GOOGLE_DRIVE_FOLDER_ID),
    token_obtained: false,
    error: null,
  };

  try {
    const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const token = await auth.getAccessToken();
    info.token_obtained = Boolean(token?.token);
  } catch (err) {
    info.error = err.message;
  }

  res.json(info);
});

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
