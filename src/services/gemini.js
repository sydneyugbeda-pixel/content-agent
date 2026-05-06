// Google Imagen 3 image generation: produces carousel slide images from Claude's image prompts

const IMAGEN_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict';

export async function generateCarouselSlides(slidesArray) {
  console.log(`[gemini] Generating ${slidesArray.length} carousel slides with Imagen 3...`);
  const results = [];

  for (const slide of slidesArray) {
    try {
      console.log(`[gemini] Generating slide ${slide.slide} (${slide.type})...`);

      const res = await fetch(`${IMAGEN_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: slide.image_prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
          },
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      const prediction = data.predictions?.[0];

      if (!prediction?.bytesBase64Encoded) {
        throw new Error(`No image in response: ${JSON.stringify(data).slice(0, 200)}`);
      }

      console.log(`[gemini] Slide ${slide.slide} generated (${prediction.mimeType ?? 'image/png'})`);
      results.push({
        slide: slide.slide,
        image_data: prediction.bytesBase64Encoded,
        mime_type: prediction.mimeType ?? 'image/png',
        prompt: slide.image_prompt,
      });
    } catch (err) {
      console.error(`[gemini] Slide ${slide.slide} failed: ${err.message}`);
      results.push({ slide: slide.slide, image_data: null, mime_type: null, error: err.message, prompt: slide.image_prompt });
    }

    if (slide !== slidesArray[slidesArray.length - 1]) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const succeeded = results.filter((r) => r.image_data).length;
  console.log(`[gemini] Done. ${succeeded}/${slidesArray.length} slides generated successfully.`);
  return results;
}
