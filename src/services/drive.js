// Google Drive integration: creates folders and uploads text files and images via service account JWT auth

import { google } from 'googleapis';
import { Readable } from 'stream';

function parsePrivateKey(raw = '') {
  // Handle both literal \n (from Railway/env files) and real newlines
  return raw.replace(/\\n/g, '\n');
}

const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = parsePrivateKey(process.env.GOOGLE_PRIVATE_KEY);

console.log(`[drive] Auth init — email set: ${Boolean(serviceAccountEmail)}, key length: ${privateKey.length}, key starts correctly: ${privateKey.startsWith('-----BEGIN')}`);

const auth = new google.auth.JWT({
  email: serviceAccountEmail,
  key: privateKey,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

export async function createContentFolder(name, parentFolderId) {
  try {
    console.log(`[drive] Creating folder: "${name}"`);
    const response = await drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      },
      fields: 'id',
    });
    const folderId = response.data.id;
    console.log(`[drive] Folder created with ID: ${folderId}`);
    return folderId;
  } catch (err) {
    throw new Error(`[drive] createContentFolder failed: ${err.message}`);
  }
}

export async function uploadTextFile(content, filename, folderId) {
  try {
    console.log(`[drive] Uploading text file: "${filename}"`);
    const stream = Readable.from([content]);
    const response = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [folderId],
      },
      media: {
        mimeType: 'text/plain',
        body: stream,
      },
      fields: 'id',
    });
    const fileId = response.data.id;
    console.log(`[drive] Uploaded "${filename}" with ID: ${fileId}`);
    return fileId;
  } catch (err) {
    throw new Error(`[drive] uploadTextFile "${filename}" failed: ${err.message}`);
  }
}

export async function uploadImageFromUrl(imageUrl, filename, folderId) {
  try {
    console.log(`[drive] Fetching image for upload: "${filename}" from ${imageUrl}`);
    const res = await fetch(imageUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch image: HTTP ${res.status}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = Readable.from(buffer);

    const response = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [folderId],
      },
      media: {
        mimeType: 'image/png',
        body: stream,
      },
      fields: 'id',
    });
    const fileId = response.data.id;
    console.log(`[drive] Uploaded "${filename}" with ID: ${fileId}`);
    return fileId;
  } catch (err) {
    throw new Error(`[drive] uploadImageFromUrl "${filename}" failed: ${err.message}`);
  }
}
