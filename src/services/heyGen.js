// HeyGen API integration: submits avatar video generation jobs and polls for completion

const HEYGEN_BASE = 'https://api.heygen.com';
const POLL_INTERVAL_MS = 10_000;
const MAX_ATTEMPTS = 30;

export async function generateAvatarVideo(
  script,
  avatarId,
  voiceId,
  { pollIntervalMs = POLL_INTERVAL_MS, maxAttempts = MAX_ATTEMPTS } = {}
) {
  try {
    console.log('[heyGen] Submitting video generation job...');

    const submitRes = await fetch(`${HEYGEN_BASE}/v2/video/generate`, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.HEYGEN_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_inputs: [
          {
            character: {
              type: 'avatar',
              avatar_id: avatarId,
              avatar_style: 'normal',
            },
            voice: {
              type: 'text',
              input_text: script,
              voice_id: voiceId,
            },
            background: {
              type: 'color',
              value: '#1a1a2e',
            },
          },
        ],
        dimension: { width: 1080, height: 1920 },
      }),
    });

    if (!submitRes.ok) {
      const errorText = await submitRes.text();
      throw new Error(`Video submit failed HTTP ${submitRes.status}: ${errorText}`);
    }

    const submitData = await submitRes.json();
    const videoId = submitData.data?.video_id;

    if (!videoId) {
      throw new Error(`No video_id in response: ${JSON.stringify(submitData)}`);
    }

    console.log(`[heyGen] Job submitted. video_id: ${videoId}. Polling for completion...`);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise((r) => setTimeout(r, pollIntervalMs));

      const statusRes = await fetch(
        `${HEYGEN_BASE}/v1/video_status.get?video_id=${videoId}`,
        { headers: { 'x-api-key': process.env.HEYGEN_API_KEY } }
      );

      if (!statusRes.ok) {
        console.error(`[heyGen] Status check HTTP ${statusRes.status} on attempt ${attempt}`);
        continue;
      }

      const statusData = await statusRes.json();
      const status = statusData.data?.status;

      console.log(`[heyGen] Attempt ${attempt}/${maxAttempts} — status: ${status}`);

      if (status === 'completed') {
        const videoUrl = statusData.data?.video_url;
        console.log(`[heyGen] Video ready: ${videoUrl}`);
        return videoUrl;
      }

      if (status === 'failed') {
        console.error(`[heyGen] Video generation failed: ${JSON.stringify(statusData)}`);
        return null;
      }
    }

    console.warn(`[heyGen] Polling timed out after ${maxAttempts} attempts. video_id: ${videoId}`);
    return null;
  } catch (err) {
    console.error(`[heyGen] generateAvatarVideo failed: ${err.message}`);
    return null;
  }
}
