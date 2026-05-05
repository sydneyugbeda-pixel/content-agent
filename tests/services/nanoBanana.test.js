import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { generateCarouselSlides } from '../../src/services/nanoBanana.js';

const SLIDES_INPUT = [
  { slide: 1, type: 'hook', image_prompt: 'A bold hook image' },
  { slide: 2, type: 'problem', image_prompt: 'A problem visualization' },
  { slide: 3, type: 'insight', image_prompt: 'An insight graphic' },
  { slide: 4, type: 'solution', image_prompt: 'A solution illustration' },
  { slide: 5, type: 'cta', image_prompt: 'A call-to-action visual' },
];

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function makeFetchMock(failOnSlide = null) {
  return async (_url, options) => {
    const body = JSON.parse(options.body);
    const matchingSlide = SLIDES_INPUT.find((s) => s.image_prompt === body.prompt);

    if (failOnSlide && matchingSlide?.slide === failOnSlide) {
      return {
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded',
      };
    }

    return {
      ok: true,
      json: async () => ({
        image_url: `https://cdn.nanobanana.example/img_${matchingSlide?.slide}.png`,
        generation_id: `gen_${matchingSlide?.slide}`,
      }),
    };
  };
}

test('generateCarouselSlides returns 5 results for a 5-slide input', async () => {
  globalThis.fetch = makeFetchMock();
  const results = await generateCarouselSlides(SLIDES_INPUT);

  assert.strictEqual(results.length, 5);
  for (const r of results) {
    assert.ok(r.image_url, `Expected image_url on slide ${r.slide}`);
    assert.ok(r.slide >= 1 && r.slide <= 5);
  }
});

test('generateCarouselSlides handles a per-slide failure gracefully without throwing', async () => {
  globalThis.fetch = makeFetchMock(3);

  let results;
  await assert.doesNotReject(async () => {
    results = await generateCarouselSlides(SLIDES_INPUT);
  });

  assert.strictEqual(results.length, 5);

  const failed = results.find((r) => r.slide === 3);
  assert.strictEqual(failed.image_url, null);
  assert.ok(failed.error, 'Failed slide should carry an error message');

  const succeeded = results.filter((r) => r.slide !== 3);
  for (const r of succeeded) {
    assert.ok(r.image_url, `Slide ${r.slide} should have succeeded`);
  }
});

test('generateCarouselSlides result objects have slide, image_url, and prompt keys', async () => {
  globalThis.fetch = makeFetchMock();
  const results = await generateCarouselSlides(SLIDES_INPUT);

  for (const r of results) {
    assert.ok('slide' in r);
    assert.ok('image_url' in r);
    assert.ok('prompt' in r);
  }
});
