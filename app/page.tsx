"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import CopyButton from "@/components/CopyButton";

interface Generation {
  id: string;
  video_url: string;
  linkedin_post: string;
  platform: string; // ✨ Track target platform
  style: string;    // ✨ Track writing style
  created_at: string;
}

export default function Home() {
  const [videoUrl, setVideoUrl] = useState("");
  const [platform, setPlatform] = useState("linkedin"); // Default to LinkedIn
  const [style, setStyle] = useState("professional");   // Default to Professional
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Generation[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("generations")
        .select("id, video_url, linkedin_post, platform, style, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error pulling history:", error.message);
      } else if (data) {
        setHistory(data as Generation[]);
      }
    } catch (err) {
      console.error("Failed to connect to history endpoint:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;

    setIsLoading(true);
    setResult("");

    try {
      // Send videoUrl along with platform and style options to our backend API
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl, platform, style }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        
        const newGeneration: Generation = {
          id: Math.random().toString(), 
          video_url: videoUrl,
          linkedin_post: data.data,
          platform: platform,
          style: style,
          created_at: new Date().toISOString()
        };

        setHistory((prevHistory) => [newGeneration, ...prevHistory]);
        setVideoUrl("");
      } else {
        setResult(`Error: ${data.error || "Something went wrong"}`);
      }
    } catch (error) {
      console.error(error);
      setResult("Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post from your history?")) return;

    try {
      const { error } = await supabase
        .from("generations")
        .delete()
        .eq("id", id);

      if (error) {
        alert(`Failed to delete: ${error.message}`);
      } else {
        setHistory((prevHistory) => prevHistory.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Error running delete routine:", err);
    }
  };

  // Quick helper map to render beautiful badges for our UI history stream
  const platformBadges: Record<string, string> = {
    linkedin: "💼 LinkedIn Post",
    twitter: "🐦 X Thread",
    script: "📝 Shorts Script"
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-8 flex flex-col items-center justify-start space-y-12">
      {/* Main Generator Box */}
      <div className="max-w-3xl w-full space-y-8 bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Repurpose Content Engine</h2>
          <p className="mt-1 text-sm text-slate-400">
            Convert any YouTube transcript into highly optimized multi-platform formats.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. ✨ NEW: Target Platform Selector Chip Grid */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2.5">
              1. Choose Target Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "linkedin", label: "💼 LinkedIn", desc: "Spaced out, high hook" },
                { id: "twitter", label: "🐦 X Thread", desc: "Viral bit-sized sequence" },
                { id: "script", label: "📝 Video Script", desc: "30-60s retention audio" }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPlatform(opt.id)}
                  className={`p-3 rounded-lg border text-left flex flex-col transition duration-150 ${
                    platform === opt.id
                      ? "bg-blue-600/20 border-blue-500 text-blue-200 shadow-md shadow-blue-500/5"
                      : "bg-slate-950/40 border-slate-700 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <span className="text-sm font-semibold">{opt.label}</span>
                  <span className="text-[10px] mt-0.5 opacity-80">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. ✨ NEW: Writing Style Persona Dropdown Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              2. Select Content Style/Persona
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            >
              <option value="professional">Professional Analyst (Data-focused, clean breakdowns)</option>
              <option value="storyteller">The Storyteller (Hooks reader via high tension stories)</option>
              <option value="growth">The Growth Hacker (High energy, punchy takeaways, active emojis)</option>
            </select>
          </div>

          {/* 3. YouTube URL Submission Field */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              3. YouTube Video URL
            </label>
            <input
              type="url"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-lg transition duration-200 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Analyzing Transcript & Re-Writing Style..." : "Generate Content"}
          </button>
        </form>

        {result && (
          <div className="mt-8 border-t border-slate-700 pt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-200">
                Generated Output 🎉
              </h2>
              <CopyButton text={result} />
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-700 whitespace-pre-wrap text-slate-300 text-sm leading-relaxed">
              {result}
            </div>
          </div>
        )}
      </div>

      {/* Past Generations Dashboard History List */}
      <div className="max-w-3xl w-full space-y-6">
        <h2 className="text-xl font-bold tracking-tight text-slate-200 border-b border-slate-800 pb-2">
          Your Past Generations 📜
        </h2>

        {history.length === 0 ? (
          <p className="text-sm text-slate-500 italic text-center py-8">
            No previous generations found. Create your first asset above!
          </p>
        ) : (
          <div className="space-y-4">
            {history.map((post) => (
              <div 
                key={post.id} 
                className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-xl hover:border-slate-600/80 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
                  <div className="flex flex-wrap items-center gap-2 max-w-md">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-medium text-[11px] text-slate-300">
                      {platformBadges[post.platform] || "💼 Post"}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 capitalize">
                      ✨ {post.style}
                    </span>
                    <span className="truncate text-blue-400 font-mono ml-1 max-w-[180px] sm:max-w-xs">
                      {post.video_url}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 justify-between sm:justify-end w-full sm:w-auto">
                    <span>
                      📅 {new Date(post.created_at).toLocaleDateString()}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <CopyButton text={post.linkedin_post} />
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-1.5 rounded-md bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-900/50 hover:bg-rose-950/20 transition duration-200"
                        title="Delete generation"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-950/50 p-4 rounded-lg text-slate-300 text-xs whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto border border-slate-900">
                  {post.linkedin_post}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}