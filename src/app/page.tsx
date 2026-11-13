import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";

export default function Home() {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center" }}>
          <SavingsOutlinedIcon color="primary" sx={{ fontSize: 56 }} />
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
            ADHD Budget
          </Typography>
          <Typography variant="h6" component="p" color="text.secondary">
            A calmer, ADHD-friendly way to see your money and stay on top of it —
            without the overwhelm.
          </Typography>
          <Button variant="contained" size="large" disableElevation>
            Get started
          </Button>
          <Typography variant="body2" color="text.secondary">
            MVP #1 · Built with Next.js &amp; Material UI
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
