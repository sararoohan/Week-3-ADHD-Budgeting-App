// The protected dashboard. This is a SERVER component: it runs on the server
// before the page is sent to the browser.
//
// Plain-language version: the guard checks your wristband. No wristband -> you're
// sent to the login page. Valid wristband -> you see your dashboard and a Sign
// out button.

import { redirect } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  // getUser() re-checks with Supabase that the login is real (more trustworthy
  // than just reading the cookie). If there's no valid user, send them to login.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Google shares the person's name and picture; fall back to email if missing.
  const fullName = user.user_metadata?.full_name as string | undefined;
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const displayName = fullName ?? user.email;

  // A SERVER ACTION: runs on the server (so it can clear the httpOnly cookie),
  // then redirects to the login page.
  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
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
          {avatarUrl ? (
            <Avatar
              src={avatarUrl}
              alt=""
              sx={{ width: 72, height: 72 }}
            />
          ) : null}

          <Typography variant="h4" component="h1">
            You&rsquo;re signed in 🎉
          </Typography>

          <Typography color="text.secondary">
            Signed in as {displayName}
            {fullName ? ` (${user.email})` : null}
          </Typography>

          <form action={signOut}>
            <Button type="submit" variant="outlined" startIcon={<LogoutIcon />}>
              Sign out
            </Button>
          </form>
        </Stack>
      </Box>
    </Container>
  );
}
