import { NextResponse } from "next/server";
import { createRouteClient } from "@/utils/supabase";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in the params, use it as the redirect destination, otherwise fallback to home
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createRouteClient();
    
    // This exchanges the temporary verification code for a real, secure user session cookie
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If something went wrong, send them back to the login page with an error context
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}