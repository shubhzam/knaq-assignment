"use client";

import { Container, Typography, Paper, Box } from "@mui/material";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from "recharts";
import { useGetAlertsQuery } from "@/features/alerts/api/alertsApi";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#F44336",
  warning:  "#FFA726",
  info:     "#29B6F6",
};

const STATUS_COLORS: Record<string, string> = {
  new:          "#FFA726",
  acknowledged: "#29B6F6",
  resolved:     "#66BB6A",
  dismissed:    "#666",
};

export default function AnalyticsPage() {
  const { data: alerts, isLoading, isError, refetch } = useGetAlertsQuery({});

  if (isLoading) return <LoadingSkeleton />;
  if (isError || !alerts) return <ErrorState message="Failed to load analytics" onRetry={refetch} />;

  // alerts by severity
  const bySeverity = Object.entries(
    alerts.reduce((acc, a) => {
      acc[a.severity] = (acc[a.severity] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // alerts by device
  const byDevice = Object.entries(
    alerts.reduce((acc, a) => {
      acc[a.device_id] = (acc[a.device_id] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // alerts by status
  const byStatus = Object.entries(
    alerts.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // alerts over time by day
  const byDay = Object.entries(
    alerts.reduce((acc, a) => {
      const day = new Date(a.triggered_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      acc[day] = (acc[day] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, letterSpacing: "0.05em", color: "primary.main" }}>
        KNAQ — Analytics
      </Typography>

      {/* top row - two charts side by side */}
      <Box sx={{ display: "flex", gap: 3, mb: 3, flexWrap: "wrap" }}>
        {/* chart 1 - by severity */}
        <Paper sx={{ p: 3, flex: 1, minWidth: 300 }}>
          <Typography variant="overline" color="text.secondary">
            Alerts by Severity
          </Typography>
          <Box sx={{ height: 280, mt: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bySeverity}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {bySeverity.map((entry) => (
                    <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] ?? "#888"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "none" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* chart 2 - by status */}
        <Paper sx={{ p: 3, flex: 1, minWidth: 300 }}>
          <Typography variant="overline" color="text.secondary">
            Alerts by Status
          </Typography>
          <Box sx={{ height: 280, mt: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byStatus} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 11 }} />
                <YAxis tick={{ fill: "#888", fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "none" }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {byStatus.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#888"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Box>

      {/* chart 3 - by device */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="overline" color="text.secondary">
          Alerts by Device
        </Typography>
        <Box sx={{ height: 280, mt: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDevice} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 11 }} />
              <YAxis tick={{ fill: "#888", fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: "#111827", border: "none" }} />
              <Bar dataKey="value" fill="#4B8189" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* chart 4 - over time */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="overline" color="text.secondary">
          Alert Volume Over Time
        </Typography>
        <Box sx={{ height: 280, mt: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={byDay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 11 }} />
              <YAxis tick={{ fill: "#888", fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: "#111827", border: "none" }} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#EFC01A"
                strokeWidth={2}
                dot={{ fill: "#EFC01A", r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Container>
  );
}