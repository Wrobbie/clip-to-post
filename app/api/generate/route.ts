import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { createRouteClient } from "@/utils/supabase";

export const dynamic = "force-dynamic";

// Initialize Gemini with API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper function to extract YouTube video ID from URL
function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export async function POST(request: Request) {
  try {
    // 1. Extract the new options alongside the video URL
    const { videoUrl, platform, style } = await request.json();

    if (!videoUrl) {
      return NextResponse.json({ error: "No YouTube URL provided" }, { status: 400 });
    }

    const videoId = getYouTubeId(videoUrl);
    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL format" }, { status: 400 });
    }

    // 2. Fetch the real transcript from YouTube
    const transcriptObj = await YoutubeTranscript.fetchTranscript(videoId);
    const fullTranscript = transcriptObj.map((item) => item.text).join(" ");

    // 3. Build Dynamic Formatting Instructions based on Platform Selection
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

    // 4. Build Dynamic Voice Instructions based on Style Selection
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

    // Combine them into a master system instruction directive
    const systemInstruction = `
      You are an elite, world-class content copywriter specializing in digital content distribution.
      Your task is to take a raw YouTube video transcript and repurpose it flawlessly based on the rules below.
      
      CRITICAL LAYOUT RULES:
      ${platformInstructions}

      TONE & BRAND VOICE DIRECTIVES:
      ${styleInstructions}
    `;

    // 5. Ask Gemini to generate the content using the dynamic configuration
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: `Here is the video transcript to repurpose: ${fullTranscript}`,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const generatedPost = response.text;

    // 6. Save the generation to Supabase with the new columns included
    try {
      const supabase = await createRouteClient();

      // Get the real logged-in user session
      const { data: { user } } = await supabase.auth.getUser();

      // If there is no user logged in, explicitly block the generation!
      if (!user) {
        return NextResponse.json({ success: false, error: "Authentication required. Please log in first." }, { status: 401 });
      }

      const { error: dbError } = await supabase
        .from("generations")
        .insert({
          user_id: user.id,
          video_url: videoUrl,
          linkedin_post: generatedPost, // Keeping original column name for the post content
          platform: platform || "linkedin", // Logs selected platform
          style: style || "professional"    // Logs selected tone persona
        });

      if (dbError) {
        console.error("Database Save Error:", dbError.message);
        return NextResponse.json({ success: false, error: `Database Error: ${dbError.message}` });
      }
    } catch (dbCatchError: any) {
      console.error("Failed to call Supabase:", dbCatchError);
      return NextResponse.json({ success: false, error: `Supabase System Error: ${dbCatchError.message}` });
    }

    // Return the final text block on success
    return NextResponse.json({ success: true, data: generatedPost });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch YouTube transcript. Make sure the video has captions enabled." }, 
      { status: 500 }
    );
  }
}