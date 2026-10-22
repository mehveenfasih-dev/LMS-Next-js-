import type { Metadata } from "next";
import { Box, Divider, Stack, Typography } from "@mui/material";
import { LocaleText } from "@/components/common/LocaleText";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <>
      <Box className="page-heading">
        <Typography component="h1" variant="h4">
          <LocaleText message="Settings" />
        </Typography>
        <Typography><LocaleText message="Core borrowing rules for the Book Hub collection." /></Typography>
      </Box>
      <Box className="content-card" sx={{ maxWidth: 720 }}>
        <Typography component="h2" sx={{ mb: 2 }} variant="h6"><LocaleText message="Loan policy" /></Typography>
        <Stack divider={<Divider flexItem />} spacing={2}>
          <Box>
            <Typography color="text.secondary" variant="body2"><LocaleText message="Standard loan period" /></Typography>
            <Typography sx={{ fontWeight: 700 }}><LocaleText message="14 days" /></Typography>
          </Box>
          <Box>
            <Typography color="text.secondary" variant="body2"><LocaleText message="Renewals" /></Typography>
            <Typography sx={{ fontWeight: 700 }}><LocaleText message="One renewal, when no other member is waiting" /></Typography>
          </Box>
          <Box>
            <Typography color="text.secondary" variant="body2"><LocaleText message="Member limit" /></Typography>
            <Typography sx={{ fontWeight: 700 }}><LocaleText message="Up to 5 active loans" /></Typography>
          </Box>
        </Stack>
        <Typography color="text.secondary" sx={{ mt: 3 }} variant="caption">
          <LocaleText message="These sample policies are informational. Configure enforcement in your library API." />
        </Typography>
      </Box>
    </>
  );
}
