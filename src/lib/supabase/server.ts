// Supabase client for code that runs on the SERVER (server components, server
// actions, and route handlers).
//
// Plain-language version: this is the phone line to Supabase from OUR server
// (not the user's browser). The user's login "wristband" lives in their cookies,
// so we teach this client how to read those cookies and how to hand back a fresh
// one when the login needs refreshing.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  // In Next.js, reading cookies on the server is async, so we await it.
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // How to READ every cookie we were sent.
        getAll() {
          return cookieStore.getAll();
        },
        // How to WRITE cookies back (e.g. a refreshed login token).
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // This throws when called from a Server Component (which can't set
            // cookies). That's fine — the middleware already refreshes the
            // session, so we can safely ignore it here.
          }
        },
      },
    },
  );
}
