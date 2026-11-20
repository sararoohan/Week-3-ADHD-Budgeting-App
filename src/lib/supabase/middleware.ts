// The work the middleware does on every request: refresh the user's login so it
// doesn't quietly expire, and pass the (possibly updated) cookies along.
//
// Plain-language version: the "security guard" that checks everyone's wristband
// at the door and swaps in a fresh one if theirs is about to expire.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Start with a response that just lets the request continue as normal.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write refreshed cookies onto both the request and the response so
          // the rest of the app and the browser both see the new login.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT (Supabase's rule): call getUser() right here, with no other code
  // in between. This is what actually refreshes the session. Removing it can log
  // users out unexpectedly.
  await supabase.auth.getUser();

  return supabaseResponse;
}
