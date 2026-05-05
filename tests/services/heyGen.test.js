import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { generateAvatarVideo } from '../../src/services/heyGen.js';

const AVATAR_ID = 'avatar_123';
const VOICE_ID = 'voice_456';
const SCRIPT = 'This is a test script for the avatar video.';
const VIDEO_ID = 'vid_abc123';
const VIDEO_URL = 'https://cdn.heygen.example/video_abc123.mp4';
const FAST = { pollIntervalMs: 0, maxAttempts: 5 };

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function makeFetchMock({ submitOk = true, pollSequence = ['completed'] } = {}) {
  let pollCount = 0;

  return async (url) => {
    if (url.includes('/v2/video/generate')) {
      if (!submitOk) {
        return { ok: false, status: 500, text: async () => 'Internal Server Error' };
      }
      return {
        ok: true,
        json: async () => ({ data: { video_id: VIDEO_ID } }),
      };
    }

    if (url.includes('video_status.get')) {
      const status = pollSequence[Math.min(pollCount, pollSequence.length - 1)];
      pollCount++;
      return {
        ok: true,
        json: async () => ({
          data: {
            status,
            video_url: status === 'completed' ? VIDEO_URL : undefined,
          },
        }),
      };
    }

    return { ok: false, status: 404, text: async () => 'Not found' };
  };
}

test('returns video URL when first poll status is completed', async () => {
  globalThis.fetch = makeFetchMock({ pollSequence: ['completed'] });
  const result = await generateAvatarVideo(SCRIPT, AVATAR_ID, VOICE_ID, FAST);
  assert.strictEqual(result, VIDEO_URL);
});

test('returns null when status is failed', async () => {
  globalThis.fetch = makeFetchMock({ pollSequence: ['processing', 'failed'] });
  const result = await generateAvatarVideo(SCRIPT, AVATAR_ID, VOICE_ID, FAST);
  assert.strictEqual(result, null);
});

test('returns video URL after several processing polls before completing', async () => {
  globalThis.fetch = makeFetchMock({
    pollSequence: ['processing', 'processing', 'completed'],
  });
  const result = await generateAvatarVideo(SCRIPT, AVATAR_ID, VOICE_ID, FAST);
  assert.strictEqual(result, VIDEO_URL);
});

test('returns null and does not throw when submit request fails', async () => {
  globalThis.fetch = makeFetchMock({ submitOk: false });

  let result;
  await assert.doesNotReject(async () => {
    result = await generateAvatarVideo(SCRIPT, AVATAR_ID, VOICE_ID, FAST);
  });
  assert.strictEqual(result, null);
});

test('returns null when polling times out without completing', async () => {
  globalThis.fetch = makeFetchMock({ pollSequence: ['processing'] });
  const result = await generateAvatarVideo(SCRIPT, AVATAR_ID, VOICE_ID, {
    pollIntervalMs: 0,
    maxAttempts: 3,
  });
  assert.strictEqual(result, null);
});
