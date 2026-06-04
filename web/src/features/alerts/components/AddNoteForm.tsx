"use client";

import { useState } from "react";
import { Box, TextField, Button, Typography, Stack } from "@mui/material";
import { useAddNoteMutation } from "@/features/alerts/api/alertsApi";

interface Props {
  alertId: number;
}

export default function AddNoteForm({ alertId }: Props) {
  const [note, setNote] = useState("");
  const [addNote, { isLoading }] = useAddNoteMutation();

  const handleSubmit = async () => {
    if (!note.trim()) return;
    await addNote({ id: alertId, body: { note } });
    // clear the input after successful submit
    setNote("");
  };

  return (
    <Box>
      <Typography variant="overline" color="text.secondary">
        Add Note
      </Typography>
      <Box sx={{ mt: 1 }}>
        <TextField
          fullWidth
          multiline
          rows={2}
          placeholder="Add a note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          size="small"
          sx={{ mb: 1 }}
        />
        <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            size="small"
            disabled={isLoading || !note.trim()}
            onClick={handleSubmit}
          >
            {isLoading ? "Submitting..." : "Submit"}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}