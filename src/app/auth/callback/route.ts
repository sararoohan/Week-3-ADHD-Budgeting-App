// Where Google sends the user back after they sign in.
//
// Plain-language version: Google hands us a one-time "claim ticket" (the code).
// We trade it for the real logged-in session (which gets saved as a cookie), then
// forward the user to their dashboard. If anything goes wrong, we send them back
// to the login page with a note that something failed.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Where to go after a successful login (default: the dashboard).
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // In production the app may sit behind a load balancer, so prefer the
      // forwarded host header when present; otherwise use the request's origin.
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // No code, or the trade failed: back to login with an error flag.
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
