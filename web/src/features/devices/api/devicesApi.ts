import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Device, User } from "@/features/alerts/types";

// same base query pattern as alertsApi - auth header on every request
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  prepareHeaders: (headers) => {
    headers.set("Authorization", `Bearer ${process.env.NEXT_PUBLIC_TOKEN}`);
    return headers;
  },
});

export const devicesApi = createApi({
  reducerPath: "devicesApi",
  baseQuery,
  tagTypes: ["Device", "User"],

  endpoints: (builder) => ({
    // GET /devices - returns all devices for the logged-in user's company
    getDevices: builder.query<Device[], void>({
      query: () => "/devices",
      providesTags: ["Device"],
    }),

    // GET /users - returns all teammates in the same company
    // used in the assign dialog to show who you can assign to
    getUsers: builder.query<User[], void>({
      query: () => "/users",
      providesTags: ["User"],
    }),
  }),
});

export const { useGetDevicesQuery, useGetUsersQuery } = devicesApi;