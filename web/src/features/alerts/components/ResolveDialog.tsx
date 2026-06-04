"use client";
import { ResolvePayload } from "@/features/alerts/types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useResolveAlertMutation } from "@/features/alerts/api/alertsApi";

interface Props {
  alertId: number;
  open: boolean;
  onClose: () => void;
}

// field names match what the API actually expects
const validationSchema = Yup.object({
  resolution_type:     Yup.string().required("Required"),
  root_cause:          Yup.string().required("Required"),
  action_taken:        Yup.string().required("Required"),
  preventive_measures: Yup.string(),
  time_spent_minutes:  Yup.number().min(1).optional(),
});

const RESOLUTION_TYPES = [
  { value: "fixed",            label: "Fixed" },
  { value: "false_alarm",      label: "False Alarm" },
  { value: "known_issue",      label: "Known Issue" },
  { value: "deferred",         label: "Deferred" },
  { value: "cannot_reproduce", label: "Cannot Reproduce" },
];

export default function ResolveDialog({ alertId, open, onClose }: Props) {
  const [resolveAlert, { isLoading }] = useResolveAlertMutation();

  const formik = useFormik({
    initialValues: {
      resolution_type:     "fixed",
      root_cause:          "",
      action_taken:        "",
      preventive_measures: "",
      time_spent_minutes:  undefined as number | undefined,
    },
    validationSchema,
    onSubmit: async (values) => {
      await resolveAlert({ 
        id: alertId, 
        body: values as ResolvePayload 
      });
      onClose();
    },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Resolve Alert</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            select
            label="Resolution Type *"
            name="resolution_type"
            value={formik.values.resolution_type}
            onChange={formik.handleChange}
            error={formik.touched.resolution_type && Boolean(formik.errors.resolution_type)}
            helperText={formik.touched.resolution_type && formik.errors.resolution_type}
            size="small"
          >
            {RESOLUTION_TYPES.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Root Cause *"
            name="root_cause"
            value={formik.values.root_cause}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.root_cause && Boolean(formik.errors.root_cause)}
            helperText={formik.touched.root_cause && formik.errors.root_cause}
            multiline
            rows={2}
            size="small"
          />

          <TextField
            label="Action Taken *"
            name="action_taken"
            value={formik.values.action_taken}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.action_taken && Boolean(formik.errors.action_taken)}
            helperText={formik.touched.action_taken && formik.errors.action_taken}
            multiline
            rows={2}
            size="small"
          />

          <TextField
            label="Preventive Measures"
            name="preventive_measures"
            value={formik.values.preventive_measures}
            onChange={formik.handleChange}
            multiline
            rows={2}
            size="small"
          />

          <TextField
            label="Time Spent (minutes)"
            name="time_spent_minutes"
            type="number"
            value={formik.values.time_spent_minutes ?? ""}
            onChange={formik.handleChange}
            size="small"
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          color="success"
          disabled={isLoading || !formik.isValid || !formik.dirty}
          onClick={() => formik.handleSubmit()}
        >
          {isLoading ? "Resolving..." : "Resolve Alert"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}