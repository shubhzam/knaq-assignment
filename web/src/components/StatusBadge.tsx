"use client";

import { Chip } from "@mui/material";
import { Alert } from "@/features/alerts/types";

interface Props {
  status: Alert["status"];
}

// maps each status to a MUI color - uses our theme colors automatically
const statusConfig: Record<Alert["status"], { label: string; color: "warning" | "info" | "success" | "default" }> = {
  new:          { label: "NEW",          color: "warning" },
  acknowledged: { label: "ACKNOWLEDGED", color: "info"    },
  resolved:     { label: "RESOLVED",     color: "success" },
  dismissed:    { label: "DISMISSED",    color: "default" },
};

export default function StatusBadge({ status }: Props) {
  const config = statusConfig[status];
  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      variant="outlined"
    />
  );
}