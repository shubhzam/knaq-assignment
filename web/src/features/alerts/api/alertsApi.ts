import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Alert, AlertFilters, AssignPayload, ResolvePayload, NotePayload } from "@/features/alerts/types";

// the base query handles auth for every request automatically
// no need to add the Authorization header in each endpoint
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  prepareHeaders: (headers) => {
    headers.set("Authorization", `Bearer ${process.env.NEXT_PUBLIC_TOKEN}`);
    return headers;
  },
});

export const alertsApi = createApi({
  reducerPath: "alertsApi",
  baseQuery,

  // "Alert" is a cache tag - any endpoint that provides it will re-fetch
  // automatically when any mutation invalidates it
  tagTypes: ["Alert"],

  endpoints: (builder) => ({
    // GET /alerts - returns filtered list of alerts
    getAlerts: builder.query<Alert[], AlertFilters>({
      query: (filters) => {
        // build query string from only the filters that have a value
        const params = new URLSearchParams();
        if (filters.severity) params.set("severity", filters.severity);
        if (filters.status) params.set("status", filters.status);
        if (filters.device_id) params.set("device_id", filters.device_id);
        if (filters.q) params.set("q", filters.q);
        return `/alerts?${params.toString()}`;
      },
      // this endpoint "provides" Alert tags - it will re-fetch when invalidated
      providesTags: ["Alert"],
    }),

    // GET /alerts/:id - returns single alert with full timeline
    getAlert: builder.query<Alert, number>({
      query: (id) => `/alerts/${id}`,
      providesTags: ["Alert"],
    }),

    // POST /alerts/:id/acknowledge - transitions status from new → acknowledged
    acknowledgeAlert: builder.mutation<Alert, number>({
      query: (id) => ({
        url: `/alerts/${id}/acknowledge`,
        method: "POST",
      }),
      // invalidating "Alert" causes getAlerts and getAlert to re-fetch automatically
      invalidatesTags: ["Alert"],
    }),

    // POST /alerts/:id/assign - assigns an engineer, optional note
    assignAlert: builder.mutation<Alert, { id: number; body: AssignPayload }>({
      query: ({ id, body }) => ({
        url: `/alerts/${id}/assign`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Alert"],
    }),

    // POST /alerts/:id/resolve - transitions status from acknowledged → resolved
    resolveAlert: builder.mutation<Alert, { id: number; body: ResolvePayload }>({
      query: ({ id, body }) => ({
        url: `/alerts/${id}/resolve`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Alert"],
    }),

    // POST /alerts/:id/notes - adds a note without changing status
    addNote: builder.mutation<Alert, { id: number; body: NotePayload }>({
      query: ({ id, body }) => ({
        url: `/alerts/${id}/notes`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Alert"],
    }),
  }),
});

// these are the hooks your components will import and call directly
export const {
  useGetAlertsQuery,
  useGetAlertQuery,
  useAcknowledgeAlertMutation,
  useAssignAlertMutation,
  useResolveAlertMutation,
  useAddNoteMutation,
} = alertsApi;