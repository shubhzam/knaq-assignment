"use client";

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
import { ResolvePayload } from "@/features/alerts/types";

interface Props {
  alertId: number;
  open: boolean;
  onClose: () => void;
}

// yup schema - required fields block submit
const validationSchema = Yup.object({
  resolution_type: Yup.string().required("Required"),
  resolution_root_cause: Yup.string().required("Required"),
  resolution_action_taken: Yup.string().required("Required"),
  resolution_preventive_measures: Yup.string(),
  resolution_time_spent_minutes: Yup.number().min(1).optional(),
});

const RESOLUTION_TYPES = [
  { value: "fixed",             label: "Fixed" },
  { value: "false_alarm",       label: "False Alarm" },
  { value: "known_issue",       label: "Known Issue" },
  { value: "deferred",          label: "Deferred" },
  { value: "cannot_reproduce",  label: "Cannot Reproduce" },
];

export default function ResolveDialog({ alertId, open, onClose }: Props) {
  const [resolveAlert, { isLoading }] = useResolveAlertMutation();

  const formik = useFormik<ResolvePayload>({
    initialValues: {
      resolution_type: "fixed",
      resolution_root_cause: "",
      resolution_action_taken: "",
      resolution_preventive_measures: "",
      resolution_time_spent_minutes: undefined,
    },
    validationSchema,
    onSubmit: async (values) => {
      await resolveAlert({ id: alertId, body: values });
      onClose();
    },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Resolve Alert</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* resolution type dropdown */}
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

          {/* root cause - required */}
          <TextField
            label="Root Cause *"
            name="resolution_root_cause"
            value={formik.values.resolution_root_cause}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.resolution_root_cause && Boolean(formik.errors.resolution_root_cause)}
            helperText={formik.touched.resolution_root_cause && formik.errors.resolution_root_cause}
            multiline
            rows={2}
            size="small"
          />

          {/* action taken - required */}
          <TextField
            label="Action Taken *"
            name="resolution_action_taken"
            value={formik.values.resolution_action_taken}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.resolution_action_taken && Boolean(formik.errors.resolution_action_taken)}
            helperText={formik.touched.resolution_action_taken && formik.errors.resolution_action_taken}
            multiline
            rows={2}
            size="small"
          />

          {/* preventive measures - optional */}
          <TextField
            label="Preventive Measures"
            name="resolution_preventive_measures"
            value={formik.values.resolution_preventive_measures}
            onChange={formik.handleChange}
            multiline
            rows={2}
            size="small"
          />

          {/* time spent - optional */}
          <TextField
            label="Time Spent (minutes)"
            name="resolution_time_spent_minutes"
            type="number"
            value={formik.values.resolution_time_spent_minutes ?? ""}
            onChange={formik.handleChange}
            size="small"
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        {/* disabled until form is valid */}
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