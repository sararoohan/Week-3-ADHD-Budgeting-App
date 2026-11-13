import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Note: `cacheComponents` and `partialPrefetching` are new Next.js 16 defaults
  // from create-next-app. Disabled for MVP #1 to keep Supabase cookie/auth
  // handling simple later. Flip back to `true` if you want to adopt them.
  cacheComponents: false,
  partialPrefetching: false,
};

export default nextConfig;
