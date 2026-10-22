import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import { Box, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { LanguageToggle } from "@/components/common/LanguageToggle";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <Box className="auth-shell">
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: 640,
          mx: "auto",
          px: 2,
          py: 2,
        }}
      >
        <Link className="auth-brand" href="/catalog">
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <AutoStoriesOutlinedIcon color="primary" />
            <Typography sx={{ fontWeight: 800 }}>Book Hub</Typography>
          </Stack>
        </Link>
       
      </Box>
      <Container maxWidth="sm">{children}</Container>
    </Box>
  );
}
