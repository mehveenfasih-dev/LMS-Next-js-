import { Box, Button, Container, Typography } from "@mui/material";

export default function NotFound() {
  return (
    <Container maxWidth="sm">
      <Box className="error-page">
        <Typography component="h1" variant="h4">
          Page not found
        </Typography>
        <Typography color="text.secondary">
          The page you requested does not exist or may have moved.
        </Typography>
        <Button href="/catalog" variant="contained">
          Go to catalog
        </Button>
      </Box>
    </Container>
  );
}
