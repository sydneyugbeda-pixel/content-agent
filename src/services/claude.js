// Claude API integration: generates structured multimodal content JSON from text and/or images

import Anthropic from '@anthropic-ai/sdk';

let client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Replaces the Anthropic client — only for use in tests.
export function _setClientForTesting(mockClient) {
  client = mockClient;
}

const SYSTEM_PROMPT =
  'You are a multimodal content strategist. Always respond with valid JSON only. ' +
  'No markdown, no preamble, no code fences. Only the raw JSON object.';

const USER_PROMPT_TEMPLATE = (input) => `Generate a complete content batch from this input. Return ONLY valid JSON with these exact keys:

{
  "topic_summary": "10-word summary of the content topic",
  "linkedin": "Full LinkedIn post, 150-200 words, professional tone, no hashtags",
  "instagram_caption": "Instagram caption under 80 words",
  "instagram_hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "twitter_thread": ["tweet 1 (max 280 chars)", "tweet 2", "tweet 3"],
  "youtube_short_script": "Spoken script for a 60-second video. No stage directions.",
  "carousel_slides": [
    { "slide": 1, "type": "hook", "image_prompt": "detailed visual prompt for slide 1" },
    { "slide": 2, "type": "problem", "image_prompt": "detailed visual prompt for slide 2" },
    { "slide": 3, "type": "insight", "image_prompt": "detailed visual prompt for slide 3" },
    { "slide": 4, "type": "solution", "image_prompt": "detailed visual prompt for slide 4" },
    { "slide": 5, "type": "cta", "image_prompt": "detailed visual prompt for slide 5" }
  ]
}

Input: ${input}`;

export async function generateContent(userText, imageBase64 = null) {
  try {
    console.log('[claude] Building content request...');

    const contentBlocks = [];

    if (imageBase64) {
      contentBlocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: imageBase64,
        },
      });
    }

    contentBlocks.push({
      type: 'text',
      text: USER_PROMPT_TEMPLATE(userText),
    });

    console.log('[claude] Sending request to Claude API...');
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: contentBlocks }],
    });

    const rawText = response.content[0].text.trim();
    console.log('[claude] Response received, parsing JSON...');

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (parseErr) {
      throw new Error(
        `[claude] JSON parsing failed. Raw response was: ${rawText.slice(0, 200)}`
      );
    }

    console.log(`[claude] Content generated for topic: "${parsed.topic_summary}"`);
    return parsed;
  } catch (err) {
    throw new Error(`[claude] generateContent failed: ${err.message}`);
  }
}
