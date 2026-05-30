import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { createRouteClient } from "@/utils/supabase";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Initialize Gemini with API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper function to extract YouTube video ID from URL
function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Lightweight helper to fetch video title via official oEmbed API
async function getYouTubeTitle(videoUrl: string): Promise<string> {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`);
    if (!response.ok) return "Untitled YouTube Video";
    const data = await response.json();
    return data.title || "Untitled YouTube Video";
  } catch (error) {
    console.error("Failed to fetch video title:", error);
    return "Untitled YouTube Video";
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate user at the very beginning to enforce limits early
    const supabaseUserClient = await createRouteClient();
    const { data: { user } } = await supabaseUserClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required. Please log in first." }, 
        { status: 401 }
      );
    }

    // 2. Initialize an Admin client with a strict fallback check
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn("⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY is not detected in your environment variables. Falling back to Anon Key.");
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey!
    );
    console.log("Checking profile with Admin privileges for User ID:", user.id);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("credits_used, is_pro")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Supabase Profile Read Error:", profileError.message);
      return NextResponse.json({ success: false, error: `Database read failure: ${profileError.message}` }, { status: 500 });
    }

    if (!profile) {
      console.error(`CRITICAL: Profile row missing entirely for User ID: ${user.id}`);
      return NextResponse.json({ success: false, error: "Profile missing. Please verify your profiles table setup." }, { status: 500 });
    }

    // Check if limit of 3 runs has already been met or exceeded
    if (!profile.is_pro && profile.credits_used >= 3) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Usage limit reached! You have used your 3 free credits. Please upgrade your tier to unlock unlimited outputs." 
        }, 
        { status: 403 }
      );
    }

    // 3. Extract parameters from payload body
    const { videoUrl, platform, style } = await request.json();

    if (!videoUrl) {
      return NextResponse.json({ error: "No YouTube URL provided" }, { status: 400 });
    }

    const videoId = getYouTubeId(videoUrl);
    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL format" }, { status: 400 });
    }

    // Simultaneously grab video details and transcript snippets
    const [videoTitle, transcriptObj] = await Promise.all([
      getYouTubeTitle(videoUrl),
      YoutubeTranscript.fetchTranscript(videoId)
    ]);

    // Construct static thumbnail preview URL and stringify text content
    const videoThumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    const fullTranscript = transcriptObj.map((item) => item.text).join(" ");

    // 4. Build Dynamic Formatting Instructions based on Platform Selection
    let platformInstructions = "";
    switch (platform) {
      case "twitter":
        platformInstructions = `
          Format the output strictly as a high-value viral X (Twitter) thread.
          - Break the content into numbered tweets (e.g., 1/, 2/).
          - Max 280 characters per tweet.
          - The first tweet must be an extreme hook designed to get people to click 'show more'.
          - Ensure seamless transitions from one tweet to the next.
        `;
        break;
      case "script":
        platformInstructions = `
          Format the output as an engaging 30-60 second Short/Reel spoken script.
          - Include visual cues or hook pacing in brackets like [Hook], [Visual Cut], [B-Roll].
          - Keep paragraphs short and conversational, optimized for high retention audio reading.
          - End with a strong, rapid call to action.
        `;
        break;
      case "linkedin":
      default:
        platformInstructions = `
          Format the output as a clean, highly engaging LinkedIn post.
          - Use plenty of whitespace (single sentence lines or short paragraphs).
          - Use a strong opening hook.
          - No generic corporate jargon. Use bold list pointers or clean formatting to separate ideas.
        `;
        break;
    }

    // 5. Build Dynamic Voice Instructions based on Style Selection
    let styleInstructions = "";
    switch (style) {
      case "storyteller":
        styleInstructions = `
          Write using a high-tension Narrative Storyteller persona. 
          - Start with a vulnerable or intriguing moment (e.g., "In 2022, I made a mistake...").
          - Build a dramatic arc (Conflict -> Realization -> Resolution) based on the transcript's lessons.
        `;
        break;
      case "growth":
        styleInstructions = `
          Write using a high-energy Growth Hacker persona.
          - Use punchy sentence fragments, modern active vocabulary, and intentional action emojis.
          - Focus heavily on tactical framework takeaways and immediate action items.
        `;
        break;
      case "professional":
      default:
        styleInstructions = `
          Write using an objective Professional Analyst persona.
          - Present deep, clean breakdowns of the data, core insights, and key summaries.
          - Keep the tone highly authoritative, clear, structured, and insightful.
        `;
        break;
    }

    // Combine into master system instruction directive
    const systemInstruction = `
      You are an elite, world-class content copywriter specializing in digital content distribution.
      Your task is to take a raw YouTube video transcript and repurpose it flawlessly based on the rules below.
      
      CRITICAL LAYOUT RULES:
      ${platformInstructions}

      TONE & BRAND VOICE DIRECTIVES:
      ${styleInstructions}
    `;

    // 6. Ask Gemini to generate content
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: `Here is the video transcript to repurpose: ${fullTranscript}`,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const generatedPost = response.text;

    // 7. Save generation output parameters to Supabase
    const { error: dbError } = await supabaseUserClient
      .from("generations")
      .insert({
        user_id: user.id,
        video_url: videoUrl,
        linkedin_post: generatedPost,
        platform: platform || "linkedin",
        style: style || "professional",
        video_title: videoTitle,
        video_thumbnail: videoThumbnail,
      });

    if (dbError) {
      console.error("Database Save Error:", dbError.message);
      return NextResponse.json({ success: false, error: `Database Error: ${dbError.message}` });
    }

    // Increment usage counter tracking using admin bypass client
    await supabaseAdmin
      .from("profiles")
      .update({ credits_used: profile.credits_used + 1 })
      .eq("id", user.id);

    // Return final text block on success
    return NextResponse.json({ success: true, data: generatedPost });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process transaction logic properly." }, 
      { status: 500 }
    );
  }
}