"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Button,
  Divider,
  Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useGetAlertQuery, useAcknowledgeAlertMutation } from "@/features/alerts/api/alertsApi";
import StatusBadge from "@/components/StatusBadge";
import SeverityChip from "@/components/SeverityChip";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import AddNoteForm from "@/features/alerts/components/AddNoteForm";
import ResolveDialog from "@/features/alerts/components/ResolveDialog";
import AssignDialog from "@/features/alerts/components/AssignDialog";

interface Props {
  params: { id: string };
}

export default function AlertDetailPage({ params }: Props) {
  const { id } = params;
  const router = useRouter();

  const [resolveOpen, setResolveOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const { data: alert, isLoading, isError, refetch } = useGetAlertQuery(Number(id));
  const [acknowledgeAlert, { isLoading: isAcking }] = useAcknowledgeAlertMutation();

  if (isLoading) return <LoadingSkeleton />;
  if (isError || !alert) return <ErrorState message="Failed to load alert" onRetry={refetch} />;

  const hasReading = alert.reading_value !== undefined && alert.reading_value !== null;
  const hasThreshold = alert.threshold !== undefined && alert.threshold !== null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* back button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push("/alerts")}
        sx={{ mb: 3, color: "text.secondary" }}
      >
        Back to Queue
      </Button>

      {/* header */}
      <Stack direction="row" spacing={2} sx={{ mb: 1, alignItems: "center" }}>
        <Typography variant="h5" sx={{ fontWeight: 700, textTransform: "capitalize" }}>
          {alert.alert_type.replace(/_/g, " ")}
        </Typography>
        <SeverityChip severity={alert.severity} />
        <StatusBadge status={alert.status} />
      </Stack>

      {/* device info */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {alert.device.name} · {alert.device.location} · {alert.device_id}
      </Typography>

      {/* metric card */}
      {(hasReading || hasThreshold) && (
        <Paper sx={{ p: 3, mb: 3, display: "flex", gap: 4 }}>
          {hasReading && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                READING
              </Typography>
              <Typography variant="h4" color="error.main" sx={{ fontWeight: 700 }}>
                {alert.reading_value}
                {alert.reading_name ? (
                  <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                    {alert.reading_name}
                  </Typography>
                ) : null}
              </Typography>
            </Box>
          )}
          {hasThreshold && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                THRESHOLD
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {alert.threshold}
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* action buttons */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        {alert.status === "new" && (
          <Button
            variant="contained"
            color="primary"
            disabled={isAcking}
            onClick={() => acknowledgeAlert(alert.id)}
          >
            {isAcking ? "Acknowledging..." : "Acknowledge"}
          </Button>
        )}
        {alert.status === "acknowledged" && (
          <Button variant="contained" color="success" onClick={() => setResolveOpen(true)}>
            Resolve
          </Button>
        )}
        {(alert.status === "new" || alert.status === "acknowledged") && (
          <Button variant="outlined" color="secondary" onClick={() => setAssignOpen(true)}>
            Assign
          </Button>
        )}
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* assignee info */}
      {alert.assignee && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.secondary">
            ASSIGNED TO
          </Typography>
          <Typography variant="body2">
            {alert.assignee.name} · {alert.assignee.role}
          </Typography>
        </Box>
      )}

      {/* timeline */}
      <Typography variant="overline" color="text.secondary">
        Timeline
      </Typography>
      <Paper sx={{ p: 2, mt: 1, mb: 3 }}>
        {alert.timeline.map((entry, i) => (
          <Box key={i} sx={{ mb: 1.5 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Chip label={entry.action} size="small" variant="outlined" sx={{ fontSize: "0.65rem" }} />
              <Typography variant="caption" color="text.secondary">
                {entry.user}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {new Date(entry.timestamp).toLocaleString()}
              </Typography>
            </Stack>
            {entry.note && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ml: 1 }}>
                {entry.note}
              </Typography>
            )}
          </Box>
        ))}
      </Paper>

      {/* add note form */}
      <AddNoteForm alertId={alert.id} />

      {/* dialogs */}
      <ResolveDialog
        alertId={alert.id}
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
      />
      <AssignDialog
        alertId={alert.id}
        currentAssigneeId={alert.assigned_to}
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
      />
    </Container>
  );
}