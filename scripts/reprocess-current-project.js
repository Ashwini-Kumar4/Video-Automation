const fs = require("fs");
const path = require("path");

// Load .env.local
const envContent = fs.readFileSync(".env.local", "utf-8");
envContent.split("\n").forEach((line) => {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
});

const { neon } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

async function main() {
  const projectId = "proj_1792505222957_cz6fgj";
  console.log(`\n=== Reprocessing Project: ${projectId} with Authentic Audio & Gemini AI ===\n`);

  const videoPath = path.join(".temp_uploads", "proj_1792505222957_cz6fgj_Unbroken_-_Motivational_Video.mp4");
  if (!fs.existsSync(videoPath)) {
    throw new Error(`Video file not found at ${videoPath}`);
  }

  const fileBuf = fs.readFileSync(videoPath);
  console.log(`1. Uploaded video file size: ${(fileBuf.length / (1024 * 1024)).toFixed(2)} MB`);

  // Step 1: Deepgram Speech-to-Text
  console.log("2. Transcribing with Deepgram Nova-2 API...");
  const dgRes = await fetch(
    "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true&utterances=true",
    {
      method: "POST",
      headers: {
        Authorization: "Token " + process.env.DEEPGRAM_API_KEY,
        "Content-Type": "video/mp4",
      },
      body: new Uint8Array(fileBuf),
    }
  );

  if (!dgRes.ok) {
    throw new Error(`Deepgram API returned ${dgRes.status}: ${await dgRes.text()}`);
  }

  const dgData = await dgRes.json();
  const channel = dgData?.results?.channels?.[0];
  const alt = channel?.alternatives?.[0];
  const transcript = alt?.transcript || "";
  const words = alt?.words || [];
  const duration = dgData?.metadata?.duration || 180;

  console.log(`   ✅ Deepgram transcript retrieved! (${words.length} words, ${duration.toFixed(1)}s)`);
  console.log(`   Preview: "${transcript.slice(0, 150)}..."`);

  // Step 2: Generate word-level captions
  console.log("3. Generating timed subtitle cue cards...");
  const WORDS_PER_CAPTION = 4;
  let currentChunk = [];
  let captionId = 1;
  const captions = [];

  for (let i = 0; i < words.length; i++) {
    currentChunk.push(words[i]);
    const isPunctuationEnd = /[.?!]$/.test(words[i].punctuated_word || words[i].word);
    const isChunkFull = currentChunk.length >= WORDS_PER_CAPTION;
    const isLastWord = i === words.length - 1;

    if (isChunkFull || isPunctuationEnd || isLastWord) {
      const start = currentChunk[0].start;
      const end = currentChunk[currentChunk.length - 1].end;
      const text = currentChunk.map((w) => w.punctuated_word || w.word).join(" ").trim();
      captions.push({
        id: captionId++,
        start: Number(start.toFixed(2)),
        end: Number(Math.max(end, start + 0.5).toFixed(2)),
        text,
        words: currentChunk.map((w) => ({
          word: w.punctuated_word || w.word,
          start: Number(w.start.toFixed(2)),
          end: Number(w.end.toFixed(2)),
        })),
      });
      currentChunk = [];
    }
  }

  function formatSrtTimestamp(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")},${millis.toString().padStart(3, "0")}`;
  }

  const srtLines = [];
  captions.forEach((c) => {
    srtLines.push(String(c.id));
    srtLines.push(`${formatSrtTimestamp(c.start)} --> ${formatSrtTimestamp(c.end)}`);
    srtLines.push(c.text);
    srtLines.push("");
  });
  const captionsSrt = srtLines.join("\n");

  const vttLines = ["WEBVTT", ""];
  captions.forEach((c) => {
    vttLines.push(String(c.id));
    vttLines.push(`${formatSrtTimestamp(c.start).replace(",", ".")} --> ${formatSrtTimestamp(c.end).replace(",", ".")}`);
    vttLines.push(c.text);
    vttLines.push("");
  });
  const captionsVtt = vttLines.join("\n");

  console.log(`   ✅ Generated ${captions.length} subtitle cues!`);

  // Step 3: Run Gemini AI to extract real viral moments
  console.log("4. Prompting Gemini AI to find 5 high-retention short clips from authentic speech...");
  const modelToUse = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const geminiPrompt = `You are a world-class viral short-form video editor for TikTok, YouTube Shorts, and Instagram Reels.
Analyze this video transcript and identify exactly 5 HIGH-ENGAGEMENT, VIRAL SHORT CLIPS (each between 20 and 75 seconds).

TRANSCRIPT:
${transcript}

TOTAL DURATION: ${Math.round(duration)} seconds.

INSTRUCTIONS:
1. Each clip must be a complete, coherent, powerful thought with a strong hook at the start.
2. Select non-overlapping or minimally overlapping high-impact windows (duration between 20s and 75s).
3. Provide a viral title, hook, whyReason explaining virality, SEO score (80-99), and 4-6 viral hashtags/keywords.

Return ONLY a valid JSON array matching this exact schema:
[
  {
    "title": "Viral Hook Title",
    "startTime": 0.0,
    "endTime": 32.5,
    "whyReason": "Why this short will perform well on Shorts/Reels...",
    "seoScore": 95,
    "seoKeywords": ["#keyword1", "#keyword2", "#keyword3"],
    "hook": "Exact opening words that grab attention"
  }
]`;

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const gRes = await fetch(geminiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: geminiPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    }),
  });

  if (!gRes.ok) {
    throw new Error(`Gemini API returned ${gRes.status}: ${await gRes.text()}`);
  }

  const gData = await gRes.json();
  const rawJson = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
  const clips = JSON.parse(rawJson);
  console.log(`   ✅ Gemini AI selected ${clips.length} viral shorts from authentic video!`);

  // Step 4: Save to Neon DB
  console.log("5. Updating Neon PostgreSQL Database...");

  // Update projects table
  await sql.query(
    `UPDATE projects SET 
      transcript = $1,
      captions = $2,
      captions_srt = $3,
      captions_vtt = $4,
      signed_url = $5,
      source_url = $5,
      status = 'completed',
      ai_analysis_status = 'completed',
      progress = 100,
      stage = 'All 5 viral short clips generated successfully with authentic video!',
      updated_at = NOW()
     WHERE id = $6`,
    [
      transcript,
      JSON.stringify(captions),
      captionsSrt,
      captionsVtt,
      `/api/projects/${projectId}/stream`,
      projectId,
    ]
  );

  // Delete old simulated shorts
  await sql.query(`DELETE FROM short_videos WHERE project_id = $1`, [projectId]);

  // Insert authentic short clips
  for (let idx = 0; idx < clips.length; idx++) {
    const c = clips[idx];
    const shortId = `short_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
    const durSec = Math.round(c.endTime - c.startTime);
    const durStr = `0:${durSec.toString().padStart(2, "0")}`;

    // Slice captions for this window
    const clipCaptions = captions
      .filter((cap) => cap.end >= c.startTime && cap.start <= c.endTime)
      .map((cap, i) => ({
        ...cap,
        id: i + 1,
        start: Number(Math.max(0, cap.start - c.startTime).toFixed(2)),
        end: Number((cap.end - c.startTime).toFixed(2)),
        words: cap.words.map((w) => ({
          ...w,
          start: Number(Math.max(0, w.start - c.startTime).toFixed(2)),
          end: Number((w.end - c.startTime).toFixed(2)),
        })),
      }));

    const clipSrt = clipCaptions
      .map((cap) => `${cap.id}\n${formatSrtTimestamp(cap.start)} --> ${formatSrtTimestamp(cap.end)}\n${cap.text}\n`)
      .join("\n");

    const clipVtt = `WEBVTT\n\n` + clipCaptions
      .map((cap) => `${cap.id}\n${formatSrtTimestamp(cap.start).replace(",", ".")} --> ${formatSrtTimestamp(cap.end).replace(",", ".")}\n${cap.text}\n`)
      .join("\n");

    await sql.query(
      `INSERT INTO short_videos (
        id, project_id, user_id, title, description, start_time, end_time,
        duration_seconds, duration, why_reason, seo_score, seo_keywords,
        hook, captions, captions_srt, captions_vtt, aspect_ratio, ai_model_used
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
      [
        shortId,
        projectId,
        "user_3KktGXwLL0t1ZWawrHA9YLuaXJb",
        c.title,
        c.whyReason,
        c.startTime,
        c.endTime,
        durSec,
        durStr,
        c.whyReason,
        c.seoScore || 90,
        JSON.stringify(c.seoKeywords || []),
        c.hook || c.title,
        JSON.stringify(clipCaptions),
        clipSrt,
        clipVtt,
        "9:16",
        modelToUse,
      ]
    );

    console.log(`   Short #${idx + 1}: "${c.title}" (${c.startTime}s - ${c.endTime}s | Score: ${c.seoScore}/100)`);
    console.log(`      Hook: "${c.hook}"`);
  }

  console.log("\n✨ SUCCESS! Project reprocessed with 100% authentic motivational video data!\n");
}

main().catch(console.error);
