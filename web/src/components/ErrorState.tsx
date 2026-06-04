"use client";

import { Box, Typography, Button } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlined";

interface Props {
  message?: string;
  onRetry?: () => void;
}

// shown when RTK Query gets an error response from the API
// onRetry is optional - if passed, shows a retry button
export default function ErrorState({
  message = "Something went wrong",
  onRetry,
}: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        gap: 2,
        color: "error.main",
      }}
    >
      <ErrorOutlineIcon sx={{ fontSize: 48, opacity: 0.7 }} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
      {onRetry && (
        <Button variant="outlined" color="error" size="small" onClick={onRetry}>
          Retry
        </Button>
      )}
    </Box>
  );
}