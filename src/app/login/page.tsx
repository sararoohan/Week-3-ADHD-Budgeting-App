// The login screen: a welcome message and a "Continue with Google" button.
//
// "use client" means this runs in the browser, so it can respond to a click.
// When clicked, we ask Supabase to start Google sign-in. Supabase sends the user
// to Google's "choose an account" page, then Google returns them to our callback
// route (see src/app/auth/callback/route.ts), now signed in.

"use client";

import { useState } from "react";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Where Google sends the user back after they sign in.
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    // If starting sign-in fails, stop the spinner so the button works again.
    if (error) setLoading(false);
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
        }}
      >
        <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center" }}>
          <Typography variant="h4" component="h1">
            Welcome to ADHD Budget
          </Typography>
          <Typography color="text.secondary">
            A calmer way to manage your money. Sign in to get started.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={signInWithGoogle}
            disabled={loading}
          >
            {loading ? "Redirecting…" : "Continue with Google"}
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
