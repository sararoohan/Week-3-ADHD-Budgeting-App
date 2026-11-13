"use client";

import { createTheme } from "@mui/material/styles";

// Central Material UI theme for the ADHD Budgeting app.
// This is the single place to adjust colors, typography, and component
// defaults — changes here apply across the whole app.
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#4f46e5", // indigo — calm, focused accent
    },
    secondary: {
      main: "#14b8a6", // teal
    },
  },
  typography: {
    fontFamily: [
      "Roboto",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Arial",
      "sans-serif",
    ].join(","),
  },
  shape: {
    borderRadius: 10,
  },
});

export default theme;
