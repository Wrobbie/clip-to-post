"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* HEADER / NAVIGATION BAR */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => router.push("/")}>
          <span className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            ClipToPost 🎬
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.push("/login")}
            className="text-sm font-medium text-slate-400 hover:text-white transition duration-150"
          >
            Sign In
          </button>
          <button 
            onClick={() => router.push("/login?signup=true")}
            className="text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition duration-150 shadow-md shadow-blue-600/10"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-20 max-w-4xl mx-auto text-center space-y-8">
        
        {/* Value Proposition Badge */}
        <div className="inline-flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-[11px] font-medium tracking-wide uppercase text-indigo-300">
            AI-Powered Multi-Platform Repurposing
          </span>
        </div>

        {/* Core Catchy Heading */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight max-w-3xl">
          Turn Your YouTube Videos Into{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            Viral Social Content
          </span>
        </h1>

        {/* Sub-headline explaining what the tool does */}
        <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
          Stop spending hours writing summaries. Paste any YouTube link and instantly extract high-converting X threads, professional LinkedIn posts, and short-form scripts in your exact style.
        </p>

        {/* Dynamic CTA Action Block */}
        <div className="pt-4 flex flex-col items-center space-y-3.5">
          <button
            onClick={() => router.push("/login")}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-base font-bold rounded-xl shadow-xl shadow-indigo-600/20 transform hover:-translate-y-0.5 transition duration-200"
          >
            Start Repurposing Now
          </button>
          
          {/* Subtle Free Trial Hook Line */}
          <button 
            onClick={() => router.push("/login")}
            className="text-xs font-semibold text-slate-500 hover:text-indigo-400 transition duration-150 border-b border-dashed border-slate-700 hover:border-indigo-400 pb-0.5"
          >
            🎁 Claim your 3 free generations • No credit card required
          </button>
        </div>

        {/* FEATURES GRID SNEAK-PEEK */}
        <section className="pt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left">
          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-xl space-y-2">
            <div className="text-xl">💼</div>
            <h3 className="font-bold text-slate-200 text-sm">LinkedIn Layouts</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Spaced formatting, sharp structural hooks, and organic professional distribution setups.</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-xl space-y-2">
            <div className="text-xl">🐦</div>
            <h3 className="font-bold text-slate-200 text-sm">X Thread Splits</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Automatically sequences long ideas into short 280-character numbered posts ready to go viral.</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-xl space-y-2">
            <div className="text-xl">📝</div>
            <h3 className="font-bold text-slate-200 text-sm">Shorts Scripts</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Converts detailed explanations into highly punchy spoken scripts with bracketed video hook cues.</p>
          </div>
          </section>

      </main>

      {/* COMPACT FOOTER */}
      <footer className="w-full border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} ClipToPost. Built for modern content workflows.
      </footer>
    </div>
  );
}