// Run once locally to get your Google OAuth2 refresh token.
// Usage: node scripts/get-google-token.js

import 'dotenv/config';
import { google } from 'googleapis';
import * as readline from 'node:readline/promises';

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env first.');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob'
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/drive'],
});

console.log('\nOpen this URL in your browser and authorise the app:\n');
console.log(authUrl);
console.log();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const code = await rl.question('Paste the authorisation code here: ');
rl.close();

const { tokens } = await oauth2Client.getToken(code.trim());
console.log('\n✅ Add this to your Railway Variables and .env:\n');
console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
