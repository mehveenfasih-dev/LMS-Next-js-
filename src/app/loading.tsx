import { Box, CircularProgress, Typography } from "@mui/material";
import { LocaleText } from "@/components/common/LocaleText";

export default function Loading() {
  return (
    <Box className="guard-loading" role="status">
      <CircularProgress size={28} />
      <Typography color="text.secondary" sx={{ ml: 2 }}>
        <LocaleText message="Loading the library…" />
      </Typography>
    </Box>
  );
}
