// audit trail entry - appended by the server on every state change
export interface TimelineEntry {
  action: "created" | "acknowledged" | "assigned" | "resolved" | "note_added";
  user: string; // user.name or "system"
  timestamp: string; // ISO string
  details?: string;
  note?: string;
}

// device as returned by GET /devices and nested in alert responses
export interface Device {
  device_id: string;
  type: string;
  company: string;
  name: string;
  location: string;
  timezone: string;
  floor_count?: number;
  reading_types: string[];
  thresholds: Record<string, number>;
}

// user as returned by GET /users and nested in alert.assignee
export interface User {
  id: number;
  name: string;
  role: string;
  company: string;
  email: string;
}

// full alert shape - mirrors the Prisma model + nested relations
export interface Alert {
  id: number;
  device_id: string;
  alert_type: string;
  severity: "critical" | "warning" | "info";
  triggered_at: string;
  threshold?: number;
  reading_value?: number;
  reading_name?: string;

  // mutable triage state
  status: "new" | "acknowledged" | "resolved" | "dismissed";
  assigned_to?: number;
  acknowledged_at?: string;
  resolved_at?: string;

  // populated after resolve
  resolution_type?: string;
  resolution_root_cause?: string;
  resolution_action_taken?: string;
  resolution_preventive_measures?: string;
  resolution_time_spent_minutes?: number;

  // audit trail
  timeline: TimelineEntry[];

  // nested relations from the server join
  device: Device;
  assignee?: User;
}

// sensor reading from GET /devices/:id/readings
export interface Reading {
  id: number;
  device_id: string;
  timestamp: string; // device local time when returned from API
  input_name: string;
  input_value: number;
}

// body for POST /alerts/:id/assign
export interface AssignPayload {
  assignee_id: number;
  note?: string;
}

// body for POST /alerts/:id/resolve
export interface ResolvePayload {
  resolution_type:
    | "fixed"
    | "false_alarm"
    | "known_issue"
    | "deferred"
    | "cannot_reproduce";
  resolution_root_cause: string;
  resolution_action_taken: string;
  resolution_preventive_measures?: string;
  resolution_time_spent_minutes?: number;
}

// body for POST /alerts/:id/notes
export interface NotePayload {
  note: string;
}

// query params for GET /alerts
export interface AlertFilters {
  severity?: "critical" | "warning" | "info" | "";
  status?: "new" | "acknowledged" | "resolved" | "dismissed" | "";
  device_id?: string;
  q?: string;
  from?: string;
  to?: string;
}

// summary counts shown in the summary bar
export interface AlertCounts {
  new: number;
  acknowledged: number;
  resolved: number;
}