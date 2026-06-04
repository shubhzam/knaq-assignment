"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Box,
} from "@mui/material";
import { useGetUsersQuery } from "@/features/devices/api/devicesApi";
import { useAssignAlertMutation } from "@/features/alerts/api/alertsApi";

interface Props {
  alertId: number;
  currentAssigneeId?: number;
  open: boolean;
  onClose: () => void;
}

export default function AssignDialog({ alertId, currentAssigneeId, open, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(currentAssigneeId ?? null);
  const [note, setNote] = useState("");

  const { data: users = [] } = useGetUsersQuery();
  const [assignAlert, { isLoading }] = useAssignAlertMutation();

  // filter users by search term against name or role
  const filtered = users.filter((u) =>
    `${u.name} ${u.role}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = async () => {
    if (!selectedUserId) return;
    await assignAlert({
      id: alertId,
      body: { assignee_id: selectedUserId, note: note || undefined },
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Assign Alert</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* search box */}
          <TextField
            size="small"
            placeholder="Search teammates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
          />

          {/* user list with radio select */}
          <RadioGroup
            value={selectedUserId?.toString() ?? ""}
            onChange={(e) => setSelectedUserId(Number(e.target.value))}
          >
            {filtered.map((user) => (
              <FormControlLabel
                key={user.id}
                value={user.id.toString()}
                control={<Radio size="small" />}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2">{user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.role}
                    </Typography>
                    {user.id === currentAssigneeId && (
                      <Chip label="current" size="small" variant="outlined" sx={{ fontSize: "0.6rem" }} />
                    )}
                  </Box>
                }
              />
            ))}
          </RadioGroup>

          {/* optional note */}
          <TextField
            size="small"
            label="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            rows={2}
            fullWidth
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          color="secondary"
          disabled={isLoading || !selectedUserId}
          onClick={handleAssign}
        >
          {isLoading ? "Assigning..." : "Assign"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}