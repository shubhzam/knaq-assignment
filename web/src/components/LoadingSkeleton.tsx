"use client";

import { Skeleton, Stack } from "@mui/material";

// shown while RTK Query is fetching - gives the user a sense of the layout
// before data arrives instead of a blank screen
export default function LoadingSkeleton() {
  return (
    <Stack spacing={1} sx={{ p: 2 }}>
      {/* render 6 fake rows to match a typical alerts list */}
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rectangular"
          height={48}
          sx={{ borderRadius: 1, bgcolor: "rgba(255,255,255,0.06)" }}
        />
      ))}
    </Stack>
  );
}