// Nano Banana API integration: generates carousel slide images from Claude's image prompts

const API_URL = 'https://nanobanana.expert/api/v1/generate';

export async function generateCarouselSlides(slidesArray) {
  console.log(`[nanoBanana] Generating ${slidesArray.length} carousel slides sequentially...`);
  const results = [];

  for (const slide of slidesArray) {
    try {
      console.log(`[nanoBanana] Generating slide ${slide.slide} (${slide.type})...`);

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NANO_BANANA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: slide.image_prompt,
          aspect_ratio: '1:1',
          resolution: '1k',
          output_format: 'png',
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      console.log(`[nanoBanana] Slide ${slide.slide} generated: ${data.image_url}`);

      results.push({
        slide: slide.slide,
        image_url: data.image_url,
        prompt: slide.image_prompt,
      });
    } catch (err) {
      console.error(`[nanoBanana] Slide ${slide.slide} failed: ${err.message}`);
      results.push({ slide: slide.slide, image_url: null, error: err.message });
    }

    if (slide !== slidesArray[slidesArray.length - 1]) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const succeeded = results.filter((r) => r.image_url).length;
  console.log(`[nanoBanana] Done. ${succeeded}/${slidesArray.length} slides generated successfully.`);
  return results;
}
