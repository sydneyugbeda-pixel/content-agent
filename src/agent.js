// Orchestrates the full content pipeline: Telegram → Claude → Nano Banana + HeyGen → Drive → Telegram reply

import { downloadTelegramFile, sendTelegramMessage } from './services/telegram.js';
import { generateContent } from './services/claude.js';
import { generateCarouselSlides } from './services/nanoBanana.js';
import { generateAvatarVideo } from './services/heyGen.js';
import { createContentFolder, uploadTextFile, uploadImageFromUrl } from './services/drive.js';
import { formatContentFile } from './utils/parseContent.js';

export async function handleUpdate(telegramUpdate) {
  const message = telegramUpdate?.message;
  if (!message) {
    console.log('[agent] Update has no message, skipping.');
    return;
  }

  const chatId = message.chat.id;
  const userText = message.text || message.caption || 'Generate content from this image';
  const hasPhoto = Boolean(message.photo);

  console.log(`[agent] Received update from chat ${chatId}. hasPhoto: ${hasPhoto}`);

  try {
    // Step 1 — Download image if present
    let imageBase64 = null;
    if (hasPhoto) {
      const photo = message.photo[message.photo.length - 1];
      console.log(`[agent] Downloading photo file_id: ${photo.file_id}`);
      imageBase64 = await downloadTelegramFile(photo.file_id);
    }

    // Step 2 — Generate structured content via Claude
    const content = await generateContent(userText, imageBase64);
    console.log(`[agent] Claude content generated for topic: "${content.topic_summary}"`);

    const avatarId = process.env.HEYGEN_AVATAR_ID;
    const voiceId = process.env.HEYGEN_VOICE_ID;

    // Step 3 — Run Nano Banana and HeyGen in parallel
    console.log('[agent] Starting Nano Banana and HeyGen in parallel...');
    const [slidesResult, videoResult] = await Promise.allSettled([
      generateCarouselSlides(content.carousel_slides),
      generateAvatarVideo(content.youtube_short_script, avatarId, voiceId),
    ]);

    const slides =
      slidesResult.status === 'fulfilled'
        ? slidesResult.value
        : (console.error('[agent] Nano Banana failed:', slidesResult.reason), []);

    const videoUrl =
      videoResult.status === 'fulfilled'
        ? videoResult.value
        : (console.error('[agent] HeyGen failed:', videoResult.reason), null);

    console.log(`[agent] Slides result: ${slides.filter((s) => s.image_url).length}/${content.carousel_slides.length} generated`);
    console.log(`[agent] Video result: ${videoUrl ? videoUrl : 'not available'}`);

    // Step 4 — Create Drive folder
    const dateStr = new Date().toISOString().slice(0, 10);
    const topicSlug = content.topic_summary
      .slice(0, 30)
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '');
    const folderName = `Content_${dateStr}_${topicSlug}`;

    const folderId = await createContentFolder(
      folderName,
      process.env.GOOGLE_DRIVE_FOLDER_ID
    );

    // Step 5 — Upload all assets to Drive
    const contentCopy = formatContentFile(content);
    await uploadTextFile(contentCopy, 'content_copy.txt', folderId);

    for (const slide of slides) {
      if (slide.image_url) {
        await uploadImageFromUrl(slide.image_url, `slide_${slide.slide}.png`, folderId);
      }
    }

    if (videoUrl) {
      await uploadTextFile(videoUrl, 'video_link.txt', folderId);
    } else {
      await uploadTextFile(
        'Video generation failed or timed out. Please retry manually.',
        'video_status.txt',
        folderId
      );
    }

    console.log(`[agent] All assets uploaded to Drive folder: ${folderId}`);

    // Step 6 — Send Drive link back to user
    const slidesCount = slides.filter((s) => s.image_url).length;
    const videoStatus = videoUrl ? 'Ready' : 'Processing failed';

    await sendTelegramMessage(
      chatId,
      `✅ Content batch ready!\n\n📁 <a href="https://drive.google.com/drive/folders/${folderId}">View in Google Drive</a>\n\n📊 Slides: ${slidesCount}/5 generated\n🎬 Video: ${videoStatus}`
    );

    console.log(`[agent] Pipeline complete for chat ${chatId}.`);
  } catch (err) {
    console.error(`[agent] Pipeline error for chat ${chatId}:`, err);
    try {
      await sendTelegramMessage(
        chatId,
        `⚠️ Content pipeline hit an error: ${err.message}. Partial results may be in Drive.`
      );
    } catch (sendErr) {
      console.error('[agent] Failed to send error message to Telegram:', sendErr.message);
    }
  }
}
