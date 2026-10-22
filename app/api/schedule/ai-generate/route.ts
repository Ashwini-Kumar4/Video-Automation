import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiApiKey } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clipTitle = "High Impact Short Video",
      clipHook = "",
      whyReason = "",
      seoKeywords = [],
      platforms = ["youtube", "tiktok", "instagram"],
      userDraft = "",
      tone = "viral",
    } = body;

    const keywordsList = Array.isArray(seoKeywords)
      ? seoKeywords
      : typeof seoKeywords === "string"
      ? seoKeywords.split(",").map((k: string) => k.trim())
      : [];

    const apiKey = getGeminiApiKey();

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = userDraft && userDraft.trim().length > 0
          ? `You are an elite viral social media growth expert specializing in YouTube Shorts, TikTok, and Instagram Reels.
The user has provided their own post draft / idea:
"${userDraft.trim()}"

Video context:
- Video Title: "${clipTitle}"
- Video Hook: "${clipHook || "Engaging hook"}"
- Key Topics: "${keywordsList.join(", ") || "viral video, creators, growth"}"
- Target Platforms: ${platforms.join(", ")}
- Desired Tone: ${tone}

Please REFINE, POLISH, and ELEVATE the user's draft into an irresistible social media post.
Keep the core intent of the user, but supercharge the hook, flow, engagement question, and CTA.
Respond with ONLY valid JSON with this exact schema:
{
  "title": "A punchy, click-worthy title (under 60 chars) with 1 emoji, perfect for YouTube Shorts & Reels",
  "caption": "The refined and elevated post caption (2-4 sentences) retaining user's intent with a magnetic hook and CTA",
  "hashtags": ["#Shorts", "#Viral", "#5_to_8_relevant_trending_hashtags"],
  "fullPostText": "The complete post ready to paste, with the caption followed by the hashtags cleanly formatted"
}`
          : `You are an elite viral social media growth expert specializing in YouTube Shorts, TikTok, and Instagram Reels.
Analyze this short-form video clip:
- Video Title: "${clipTitle}"
- Hook / First 3 seconds: "${clipHook || "Captivating visual and vocal hook"}"
- Virality & Retention Reason: "${whyReason || "High audience retention and strong curiosity loop"}"
- Key Topics & Keywords: "${keywordsList.join(", ") || "viral video, creators, growth"}"
- Target Platforms: ${platforms.join(", ")}
- Desired Tone: ${tone}

Generate a complete, high-converting social media post.
Respond with ONLY valid JSON with this exact schema:
{
  "title": "A punchy, click-worthy title (under 60 chars) with 1 emoji, perfect for YouTube Shorts & Reels",
  "caption": "A 2-3 sentence magnetic caption that builds curiosity, asks a conversation-starter question, and includes a CTA to save or share",
  "hashtags": ["#Shorts", "#Viral", "#5_to_8_relevant_trending_hashtags"],
  "fullPostText": "The complete post ready to paste, with the caption followed by the hashtags cleanly formatted"
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        // Clean markdown backticks if any
        const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        return NextResponse.json({
          success: true,
          source: "gemini-ai",
          title: parsed.title || `${clipTitle} 🚀`,
          caption: parsed.caption || (userDraft || "Watch till the end! What do you think about this? Drop your thoughts below 👇"),
          hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : ["#Shorts", "#Viral", "#Trending"],
          fullPostText: parsed.fullPostText || `${parsed.caption}\n\n${(parsed.hashtags || []).join(" ")}`,
        });
      } catch (aiErr) {
        console.warn("[API:schedule/ai-generate] Gemini generation fallback:", aiErr);
        // Fallback to intelligent generation below
      }
    }

    // Intelligent algorithmic generation fallback if Gemini is offline or rate-limited
    const titleClean = clipTitle.replace(/[#@]/g, "").trim();
    const cleanWords = titleClean
      .split(/\s+/)
      .filter((w: string) => w.length > 3 && !/^(with|from|that|this|what|when|where|your|about)$/i.test(w))
      .slice(0, 4);

    const generatedHashtags = [
      "#Shorts",
      "#Viral",
      ...cleanWords.map((w: string) => `#${w.charAt(0).toUpperCase() + w.slice(1).toLowerCase().replace(/[^a-zA-Z0-9]/g, "")}`),
      ...keywordsList.slice(0, 3).map((k: string) => `#${k.replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "")}`),
      "#ContentCreator",
      "#TrendingNow",
    ].filter((val, idx, arr) => arr.indexOf(val) === idx && val.length > 2);

    const generatedTitle = `${titleClean} 🚀`;
    const generatedCaption = userDraft && userDraft.trim().length > 0
      ? `${userDraft.trim()}\n\nWhat do you think about this? Drop your thoughts below 👇`
      : clipHook
      ? `${clipHook}\n\n💡 Here is why this matters: ${whyReason ? whyReason.slice(0, 120) + "..." : "Save this before you forget!"} Drop your thoughts in the comments 👇`
      : `The secret nobody talks about when it comes to ${titleClean}.\n\nSave this post for later and share it with someone who needs to hear this! 🔥`;

    const fullPostText = `${generatedCaption}\n\n${generatedHashtags.join(" ")}`;

    return NextResponse.json({
      success: true,
      source: "algorithmic-fallback",
      title: generatedTitle,
      caption: generatedCaption,
      hashtags: generatedHashtags,
      fullPostText,
    });
  } catch (error: unknown) {
    console.error("[API:schedule/ai-generate] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error)?.message || "Failed to generate AI post content",
      },
      { status: 500 }
    );
  }
}
