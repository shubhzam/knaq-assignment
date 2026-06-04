"use client";

import { Box, Typography } from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";

// shown when the API returns an empty array
// e.g. no critical alerts exist, or search found nothing
export default function EmptyState({ message = "No alerts found" }: { message?: string }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        gap: 2,
        color: "text.secondary",
      }}
    >
      <InboxIcon sx={{ fontSize: 48, opacity: 0.4 }} />
      <Typography variant="body2">{message}</Typography>
    </Box>
  );
}