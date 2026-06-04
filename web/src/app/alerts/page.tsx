"use client";

import {
  Container,
  Typography,
  Paper,
  Stack,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
} from "@mui/material";
import { useGetAlertsQuery } from "@/features/alerts/api/alertsApi";
import { useGetDevicesQuery } from "@/features/devices/api/devicesApi";
import { useAlertFilters } from "@/features/alerts/hooks/useAlertFilters";
import AlertTable from "@/features/alerts/components/AlertTable";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";

export default function AlertsPage() {
  const { filters, updateFilter } = useAlertFilters();

  // fetch alerts using current filter state from Redux
  const { data: alerts, isLoading, isError, refetch } = useGetAlertsQuery(filters);

  // fetch devices for the device filter dropdown
  const { data: devices } = useGetDevicesQuery();

  // compute summary counts from the full unfiltered alert list
  const allAlertsQuery = useGetAlertsQuery({});
  const counts = {
    new:          allAlertsQuery.data?.filter((a) => a.status === "new").length ?? 0,
    acknowledged: allAlertsQuery.data?.filter((a) => a.status === "acknowledged").length ?? 0,
    resolved:     allAlertsQuery.data?.filter((a) => a.status === "resolved").length ?? 0,
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* page header */}
      <Typography
        variant="h5"
        sx={{ mb: 3, fontWeight: 700, letterSpacing: "0.05em", color: "primary.main" }}
      >
        KNAQ — Alert Queue
      </Typography>

      {/* summary bar - shows counts across all statuses */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Paper sx={{ px: 3, py: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="caption" color="text.secondary">NEW</Typography>
          <Chip label={counts.new} color="warning" size="small" />
        </Paper>
        <Paper sx={{ px: 3, py: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="caption" color="text.secondary">ACKNOWLEDGED</Typography>
          <Chip label={counts.acknowledged} color="info" size="small" />
        </Paper>
        <Paper sx={{ px: 3, py: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="caption" color="text.secondary">RESOLVED</Typography>
          <Chip label={counts.resolved} color="success" size="small" />
        </Paper>
      </Stack>

      {/* filter bar */}
      <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: "wrap" }}>
        {/* severity filter */}
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Severity</InputLabel>
          <Select
            value={filters.severity ?? ""}
            label="Severity"
            onChange={(e) => updateFilter({ severity: e.target.value as "" | "critical" | "warning" | "info" })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
            <MenuItem value="warning">Warning</MenuItem>
            <MenuItem value="info">Info</MenuItem>
          </Select>
        </FormControl>

        {/* status filter */}
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status ?? ""}
            label="Status"
            onChange={(e) => updateFilter({ status: e.target.value as "" | "new" | "acknowledged" | "resolved" | "dismissed" })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="new">New</MenuItem>
            <MenuItem value="acknowledged">Acknowledged</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
          </Select>
        </FormControl>

        {/* device filter - populated from API */}
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Device</InputLabel>
          <Select
            value={filters.device_id ?? ""}
            label="Device"
            onChange={(e) => updateFilter({ device_id: e.target.value })}
          >
            <MenuItem value="">All Devices</MenuItem>
            {devices?.map((d) => (
              <MenuItem key={d.device_id} value={d.device_id}>
                {d.device_id} — {d.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* search box */}
        <TextField
          size="small"
          placeholder="Search alerts..."
          value={filters.q ?? ""}
          onChange={(e) => updateFilter({ q: e.target.value })}
          sx={{ minWidth: 200 }}
        />
      </Stack>

      {/* main content area - loading / error / empty / table */}
      {isLoading && <LoadingSkeleton />}
      {isError && <ErrorState message="Failed to load alerts" onRetry={refetch} />}
      {!isLoading && !isError && alerts?.length === 0 && (
        <EmptyState message="No alerts match your filters" />
      )}
      {!isLoading && !isError && alerts && alerts.length > 0 && (
        <AlertTable alerts={alerts} />
      )}
    </Container>
  );
}