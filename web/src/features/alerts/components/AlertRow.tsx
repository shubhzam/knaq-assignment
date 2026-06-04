"use client";

import { TableRow, TableCell, Checkbox, Button, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { Alert } from "@/features/alerts/types";
import { useAcknowledgeAlertMutation } from "@/features/alerts/api/alertsApi";
import StatusBadge from "@/components/StatusBadge";
import SeverityChip from "@/components/SeverityChip";

interface Props {
  alert: Alert;
  selected: boolean;
  onSelect: (id: number) => void;
}

// formats a timestamp into a human-readable "X mins ago" string
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AlertRow({ alert, selected, onSelect }: Props) {
  const router = useRouter();
  const [acknowledgeAlert, { isLoading }] = useAcknowledgeAlertMutation();

  // navigate to detail page when row is clicked
  const handleRowClick = () => {
    router.push(`/alerts/${alert.id}`);
  };

  // acknowledge without navigating - stop propagation so row click doesn't fire
  const handleAcknowledge = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await acknowledgeAlert(alert.id);
  };

  return (
    <TableRow
      hover
      onClick={handleRowClick}
      sx={{ cursor: "pointer" }}
      selected={selected}
    >
      {/* checkbox - stop propagation so clicking it doesn't navigate */}
      <TableCell onClick={(e) => e.stopPropagation()} padding="checkbox">
        <Checkbox
          checked={selected}
          onChange={() => onSelect(alert.id)}
          size="small"
        />
      </TableCell>

      <TableCell>
        <SeverityChip severity={alert.severity} />
      </TableCell>

      <TableCell>
        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
          {alert.alert_type.replace(/_/g, " ")}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {alert.device.name}
        </Typography>
        <Typography variant="caption" color="text.disabled">
          {alert.device_id}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {timeAgo(alert.triggered_at)}
        </Typography>
      </TableCell>

      <TableCell>
        <StatusBadge status={alert.status} />
      </TableCell>

      {/* inline acknowledge button - only shown for new alerts */}
      <TableCell onClick={(e) => e.stopPropagation()}>
        {alert.status === "new" && (
          <Button
            size="small"
            variant="outlined"
            color="primary"
            disabled={isLoading}
            onClick={handleAcknowledge}
          >
            {isLoading ? "..." : "Acknowledge"}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}