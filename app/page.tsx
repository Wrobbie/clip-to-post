"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

import CopyButton from "../components/CopyButton";

interface Generation {
  id: string;
  video_url: string;
  linkedin_post: string;
  created_at: string;
}

export default function Home() {
  const [videoUrl, setVideoUrl] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Generation[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchHistory = async () => {
    try {
      // Get current logged in user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Pull rows that match the user and sort by newest
      const { data, error } = await supabase
        .from("generations")
        .select("id, video_url, linkedin_post, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching history:", error.message);
      } else if (data) {
        setHistory(data);
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
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl }), // Sending videoUrl now
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        fetchHistory();
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

  // Function to delete a post from Supabase and update local UI state
  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;
    
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
      } catch(err) {
          console.error("Error deleting post:", err);
        }
    };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-8 flex flex-col items-center justify-start space-y-12">
      <div className="max-w-3xl w-full space-y-8 bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            ClipToPost 🎬
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Drop a YouTube link below to turn it into a high-engaging LinkedIn post.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              YouTube Video URL
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
            {isLoading ? "Fetching Transcript & Generating..." : "Generate Content"}
          </button>
        </form>

        {result && (
          <div className="mt-8 border-t border-slate-700 pt-6">
            {/* Flex container to hold header and button on the same line */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-200">
                Generated LinkedIn Post 🎉
              </h2>
              <CopyButton text={result} /> {/* <-- Added Copy Button here! */}
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-700 whitespace-pre-wrap text-slate-300 text-sm leading-relaxed">
              {result}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-3xl w-full space-y-6">
        <h2 className="text-xl font-bold tracking-tight text-slate-200 border-b border-slate-800 pb-2">
          Your Past Generations
        </h2>

        {history.length === 0 ? (
          <p className="text-sm text-slate-500 italic text-center py-8">
            No previous posts found. Create your first generation above!
          </p>
        ) : (
          <div className="space-y-4">
            {history.map((post) => (
              <div 
                key={post.id} 
                className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-xl hover:border-slate-600/80 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-1">
                  <span className="truncate max-w-md font-mono text-blue-400">
                    🔗 {post.video_url}
                  </span>
                  <div className="flex items-center gap-3">
                    <span>
                      📅 {new Date(post.created_at).toLocaleDateString()}
                    </span>
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