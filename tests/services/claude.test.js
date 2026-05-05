import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { generateContent, _setClientForTesting } from '../../src/services/claude.js';

const MOCK_CONTENT = {
  topic_summary: 'Ten word summary of the mocked content topic here',
  linkedin: 'LinkedIn post content goes here for testing purposes with enough words.',
  instagram_caption: 'Instagram caption here.',
  instagram_hashtags: ['one', 'two', 'three', 'four', 'five'],
  twitter_thread: ['Tweet 1', 'Tweet 2', 'Tweet 3'],
  youtube_short_script: 'YouTube short script text here.',
  carousel_slides: [
    { slide: 1, type: 'hook', image_prompt: 'prompt 1' },
    { slide: 2, type: 'problem', image_prompt: 'prompt 2' },
    { slide: 3, type: 'insight', image_prompt: 'prompt 3' },
    { slide: 4, type: 'solution', image_prompt: 'prompt 4' },
    { slide: 5, type: 'cta', image_prompt: 'prompt 5' },
  ],
};

function makeClient(responseText = JSON.stringify(MOCK_CONTENT)) {
  return {
    messages: {
      create: async () => ({ content: [{ text: responseText }] }),
    },
  };
}

beforeEach(() => {
  _setClientForTesting(makeClient());
});

test('generateContent returns an object with all required keys', async () => {
  const result = await generateContent('Test topic about productivity');

  const requiredKeys = [
    'topic_summary',
    'linkedin',
    'instagram_caption',
    'instagram_hashtags',
    'twitter_thread',
    'youtube_short_script',
    'carousel_slides',
  ];

  for (const key of requiredKeys) {
    assert.ok(key in result, `Missing key: ${key}`);
  }
});

test('generateContent returns arrays for list fields', async () => {
  const result = await generateContent('Test topic');

  assert.ok(Array.isArray(result.instagram_hashtags), 'instagram_hashtags should be an array');
  assert.ok(Array.isArray(result.twitter_thread), 'twitter_thread should be an array');
  assert.ok(Array.isArray(result.carousel_slides), 'carousel_slides should be an array');
});

test('generateContent returns 5 carousel slides', async () => {
  const result = await generateContent('Test topic');
  assert.strictEqual(result.carousel_slides.length, 5);
});

test('generateContent accepts imageBase64 without throwing', async () => {
  const fakeBase64 = Buffer.from('fake-image-data').toString('base64');
  const result = await generateContent('Test topic', fakeBase64);
  assert.ok(result.topic_summary);
});

test('generateContent throws a descriptive error when response is not valid JSON', async () => {
  _setClientForTesting(makeClient('not valid json }{'));

  await assert.rejects(
    () => generateContent('Test topic'),
    (err) => {
      assert.ok(
        err.message.includes('JSON parsing failed'),
        `Expected "JSON parsing failed" in: ${err.message}`
      );
      return true;
    }
  );
});
