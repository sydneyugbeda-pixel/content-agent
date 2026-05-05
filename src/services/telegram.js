// Telegram Bot API helpers: download files and send messages

const BASE = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export async function downloadTelegramFile(fileId) {
  try {
    console.log(`[telegram] Getting file path for file_id: ${fileId}`);
    const metaRes = await fetch(`${BASE}/getFile?file_id=${fileId}`);
    const meta = await metaRes.json();

    if (!meta.ok) {
      throw new Error(`getFile failed: ${JSON.stringify(meta)}`);
    }

    const filePath = meta.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`;

    console.log(`[telegram] Downloading file from: ${fileUrl}`);
    const fileRes = await fetch(fileUrl);
    const buffer = await fileRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    console.log(`[telegram] File downloaded and converted to base64 (${base64.length} chars)`);
    return base64;
  } catch (err) {
    throw new Error(`[telegram] downloadTelegramFile failed: ${err.message}`);
  }
}

export async function sendTelegramMessage(chatId, text) {
  try {
    console.log(`[telegram] Sending message to chat ${chatId}`);
    const res = await fetch(`${BASE}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    const data = await res.json();
    if (!data.ok) {
      throw new Error(`sendMessage failed: ${JSON.stringify(data)}`);
    }
    console.log(`[telegram] Message sent successfully to chat ${chatId}`);
    return data;
  } catch (err) {
    throw new Error(`[telegram] sendTelegramMessage failed: ${err.message}`);
  }
}
