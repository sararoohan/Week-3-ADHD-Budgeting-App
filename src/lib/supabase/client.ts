// Supabase client for code that runs in the BROWSER (e.g. a button the user clicks).
//
// Plain-language version: this creates a little "phone line" from the user's web
// browser to Supabase. It only uses the PUBLIC keys (safe to send to a browser) —
// Row Level Security still decides what data each person can actually see.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
