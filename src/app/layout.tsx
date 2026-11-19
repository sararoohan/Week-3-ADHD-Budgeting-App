import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

// Inter font, loaded from the self-hosted @fontsource/inter package
// in the weights we use.
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/700.css";

import theme from "@/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "ADHD Budget",
  description: "A calmer, ADHD-friendly way to manage your money.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        {/* AppRouterCacheProvider makes Emotion's styles render correctly
            on the server so there's no style flicker on first load. */}
        <AppRouterCacheProvider>
          {/* ThemeProvider applies our theme everywhere; CssBaseline is a
              consistent cross-browser style reset. */}
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
