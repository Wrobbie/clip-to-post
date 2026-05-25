import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { createRouteClient } from "@/utils/supabase"; // Import helper

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
    const { videoUrl } = await request.json();

    if (!videoUrl) {
      return NextResponse.json({ error: "No YouTube URL provided" }, { status: 400 });
    }

    const videoId = getYouTubeId(videoUrl);
    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL format" }, { status: 400 });
    }

    // 1. Fetch transcript from YouTube
    const transcriptObj = await YoutubeTranscript.fetchTranscript(videoId);
    
    // 2. Combine the array of text snippets into one giant paragraph
    const fullTranscript = transcriptObj.map((item) => item.text).join(" ");

    // 3. Define the AI's instructions
    const systemInstruction = `
      You are an expert social media manager. Read the video transcript provided 
      and turn it into a high-engaging LinkedIn post summarizing the core takeaway.
    `;

    // 4. Ask Gemini to generate the content using the fetched transcript
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: `Here is the video transcript: ${fullTranscript}`,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const generatedPost = response.text;

    // ==========================================
    // 🔥 NEW: SAVE THE DATA TO SUPABASE HERE! 🔥
    // ==========================================
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
          user_id: user.id, // Using the real user ID now!
          video_url: videoUrl,
          linkedin_post: generatedPost
        });

      if (dbError) {
        console.error("Database Save Error:", dbError.message);
        return NextResponse.json({ success: false, error: `Database Error: ${dbError.message}` });
      }
    } catch (dbCatchError: any) {
      console.error("Failed to call Supabase:", dbCatchError);
      return NextResponse.json({ success: false, error: `Supabase System Error: ${dbCatchError.message}` });
    }
    // ==========================================

    // If everything succeeds (Gemini + Database save), send it back to page.tsx
    return NextResponse.json({ success: true, data: generatedPost });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch YouTube transcript. Make sure the video has captions enabled." }, 
      { status: 500 }
    );
  }
}