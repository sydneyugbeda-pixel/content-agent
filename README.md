# Content Agent

A Node.js webhook agent that turns a Telegram message or photo into a full content batch. Send it a topic or image; it generates LinkedIn, Instagram, Twitter, and YouTube copy via Claude, produces five carousel slide images via Nano Banana, renders an avatar video via HeyGen, bundles everything into a named Google Drive folder, and sends you the link back on Telegram.

## Prerequisites

- **Node.js 20+**
- Accounts and API keys for:
  - [Telegram](https://core.telegram.org/bots) — create a bot via @BotFather
  - [Anthropic](https://console.anthropic.com) — Claude API key
  - [Nano Banana](https://nanobanana.expert) — image generation API key
  - [HeyGen](https://app.heygen.com) — API key, Avatar ID, and Voice ID
  - [Google Cloud](https://console.cloud.google.com) — service account with Drive API enabled, shared access to a parent Drive folder

## Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd content-agent
npm install

# 2. Configure environment
cp .env.example .env
# Fill in all values in .env

# 3. Deploy the server (Railway, Fly.io, etc.) and set SERVER_URL in .env

# 4. Register the Telegram webhook (run once after deploying)
node --input-type=module --eval "import('./server.js').then(m => m.registerWebhook())"

# 5. Start
npm start          # production
npm run dev        # local development with file watching
```

## How to use

Send any message or photo to your Telegram bot. The agent will:

1. Generate structured content for LinkedIn, Instagram, Twitter/X, and YouTube
2. Create five carousel slide images
3. Render a 60-second avatar video
4. Upload everything to a timestamped Google Drive folder
5. Reply with a link to the folder

## File structure

```
content-agent/
├── server.js                   # Express server, webhook endpoint, registerWebhook()
├── .env.example                # All required environment variables
├── src/
│   ├── agent.js                # Pipeline orchestrator
│   ├── utils/
│   │   └── parseContent.js     # Formats Claude JSON into a readable text document
│   └── services/
│       ├── telegram.js         # Download files, send messages
│       ├── claude.js           # Generate structured content JSON
│       ├── nanoBanana.js       # Generate carousel slide images
│       ├── heyGen.js           # Submit and poll avatar video jobs
│       └── drive.js            # Create folders, upload files
└── tests/
    └── services/
        ├── claude.test.js
        ├── nanoBanana.test.js
        └── heyGen.test.js
```

## Environment variables

| Variable | Description |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather |
| `SERVER_URL` | Public HTTPS URL of your deployed server |
| `PORT` | Server port (default: 3000) |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `NANO_BANANA_API_KEY` | Nano Banana API key |
| `HEYGEN_API_KEY` | HeyGen API key |
| `HEYGEN_AVATAR_ID` | HeyGen avatar ID to use for videos |
| `HEYGEN_VOICE_ID` | HeyGen voice ID to use for videos |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email |
| `GOOGLE_PRIVATE_KEY` | Service account private key (newlines as `\n`) |
| `GOOGLE_DRIVE_FOLDER_ID` | ID of the parent Drive folder |

## Commands

```bash
npm start       # Start production server
npm run dev     # Start with file watching
npm test        # Run all tests
```
