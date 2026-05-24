"use client";

import { useState } from "react";

export default function Home() {
  const [videoUrl, setVideoUrl] = useState(""); // Changed from transcript to videoUrl
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-8 flex flex-col items-center justify-center">
      <div className="max-w-3xl w-full space-y-8 bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700">
        
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            ClipToPost 🎬 ✨
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
            <h2 className="text-lg font-semibold text-slate-200 mb-3">
              Generated LinkedIn Post 🎉
            </h2>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-700 whitespace-pre-wrap text-slate-300 text-sm leading-relaxed">
              {result}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}