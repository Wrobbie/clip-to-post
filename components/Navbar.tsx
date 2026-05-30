"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    };
    getUserData();

    // Listen for auth state change to update email on sign in/sign out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setEmail(null); // Clear email on sign out
      } else if (session?.user?.email) {
        setEmail(session.user.email);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error.message);
      } else {
        router.refresh();
        router.push("/");
      }
    } catch (err) {
      console.error("Signout unexpected error:", err);
    }
  };

  return (
    <nav className="w-full bg-slate-850 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
      <div className="flex items-center space-x-2 cursor-pointer" onClick={() => router.push("/dashboard")}>
        <span className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
          ClipToPost 🎬
        </span>
      </div>

      {email && (
        <div className="flex items-center space-x-4">
          <span className="text-xs text-slate-400 hidden sm:inline-block font-medium bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
            👤 {email}
          </span>
          <button
            onClick={handleSignOut}
            className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 px-4 py-2 rounded-lg transition duration-200 shadow-sm"
          >
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
}