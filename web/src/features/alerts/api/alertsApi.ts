import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Alert, AlertFilters, AssignPayload, ResolvePayload, NotePayload } from "@/features/alerts/types";
import { RootState } from "@/lib/store";

// reads the active token from Redux so switching users works at runtime
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

export const alertsApi = createApi({
  reducerPath: "alertsApi",
  baseQuery,
  tagTypes: ["Alert"],
  endpoints: (builder) => ({
    getAlerts: builder.query<Alert[], AlertFilters>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters.severity)  params.set("severity",  filters.severity);
        if (filters.status)    params.set("status",    filters.status);
        if (filters.device_id) params.set("device_id", filters.device_id);
        if (filters.q)         params.set("q",         filters.q);
        return `/alerts?${params.toString()}`;
      },
      providesTags: ["Alert"],
    }),

    getAlert: builder.query<Alert, number>({
      query: (id) => `/alerts/${id}`,
      providesTags: ["Alert"],
    }),

    acknowledgeAlert: builder.mutation<Alert, number>({
      query: (id) => ({ url: `/alerts/${id}/acknowledge`, method: "POST" }),
      invalidatesTags: ["Alert"],
    }),

    assignAlert: builder.mutation<Alert, { id: number; body: AssignPayload }>({
      query: ({ id, body }) => ({ url: `/alerts/${id}/assign`, method: "POST", body }),
      invalidatesTags: ["Alert"],
    }),

    resolveAlert: builder.mutation<Alert, { id: number; body: ResolvePayload }>({
      query: ({ id, body }) => ({ url: `/alerts/${id}/resolve`, method: "POST", body }),
      invalidatesTags: ["Alert"],
    }),

    addNote: builder.mutation<Alert, { id: number; body: NotePayload }>({
      query: ({ id, body }) => ({ url: `/alerts/${id}/notes`, method: "POST", body }),
      invalidatesTags: ["Alert"],
    }),
  }),
});

export const {
  useGetAlertsQuery,
  useGetAlertQuery,
  useAcknowledgeAlertMutation,
  useAssignAlertMutation,
  useResolveAlertMutation,
  useAddNoteMutation,
} = alertsApi;