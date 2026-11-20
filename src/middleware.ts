// Next.js automatically runs this file on incoming requests. We just hand the
// work off to our helper. The `matcher` below tells Next WHICH requests to run
// it on — we skip static files (images, icons) because they don't need a login
// check, and skipping them keeps the app fast.

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Run on everything EXCEPT Next's internal files and common image types.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
