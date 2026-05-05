// Formats Claude JSON output into a human-readable multi-section text document

export function formatContentFile(contentJSON) {
  const {
    topic_summary,
    linkedin,
    instagram_caption,
    instagram_hashtags,
    twitter_thread,
    youtube_short_script,
    carousel_slides,
  } = contentJSON;

  const line = (char = '-', len = 40) => char.repeat(len);

  const sections = [
    `${line('=')}\nCONTENT BATCH\n${line('=')}`,

    `\nTOPIC\n${line()}\n${topic_summary}`,

    `\nLINKEDIN\n${line()}\n${linkedin}`,

    `\nINSTAGRAM CAPTION\n${line()}\n${instagram_caption}`,

    `\nINSTAGRAM HASHTAGS\n${line()}\n${instagram_hashtags.map((h) => `#${h}`).join(' ')}`,

    `\nTWITTER / X THREAD\n${line()}\n${twitter_thread.map((t, i) => `${i + 1}. ${t}`).join('\n')}`,

    `\nYOUTUBE SHORT SCRIPT\n${line()}\n${youtube_short_script}`,

    `\nCAROUSEL SLIDES (Image Prompts)\n${line()}\n${carousel_slides
      .map((s) => `Slide ${s.slide} [${s.type.toUpperCase()}]\n${s.image_prompt}`)
      .join('\n\n')}`,

    `\n${line('=')}`,
  ];

  return sections.join('\n');
}
