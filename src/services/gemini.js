// Google Gemini image generation: produces carousel slide images from Claude's image prompts

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent';

export async function generateCarouselSlides(slidesArray) {
  console.log(`[gemini] Generating ${slidesArray.length} carousel slides sequentially...`);
  const results = [];

  for (const slide of slidesArray) {
    try {
      console.log(`[gemini] Generating slide ${slide.slide} (${slide.type})...`);

      const res = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: slide.image_prompt }] }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts ?? [];
      const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith('image/'));

      if (!imagePart) {
        throw new Error(`No image in response: ${JSON.stringify(data).slice(0, 200)}`);
      }

      console.log(`[gemini] Slide ${slide.slide} generated (${imagePart.inlineData.mimeType})`);
      results.push({
        slide: slide.slide,
        image_data: imagePart.inlineData.data,
        mime_type: imagePart.inlineData.mimeType,
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
