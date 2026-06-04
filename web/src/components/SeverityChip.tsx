"use client";

import { Chip } from "@mui/material";
import { Alert } from "@/features/alerts/types";

interface Props {
  severity: Alert["severity"];
}

// maps each severity level to a color and label
const severityConfig: Record<Alert["severity"], { label: string; color: "error" | "warning" | "info" }> = {
  critical: { label: "CRIT", color: "error"   },
  warning:  { label: "WARN", color: "warning" },
  info:     { label: "INFO", color: "info"    },
};

export default function SeverityChip({ severity }: Props) {
  const config = severityConfig[severity];
  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
    />
  );
}