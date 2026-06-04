import { configureStore } from "@reduxjs/toolkit";
import { alertsApi } from "@/features/alerts/api/alertsApi";
import { devicesApi } from "@/features/devices/api/devicesApi";
import filtersReducer from "@/features/alerts/slices/filtersSlice";
import authReducer from "@/lib/auth/authSlice";

export const store = configureStore({
  reducer: {
    auth:    authReducer,
    filters: filtersReducer,
    [alertsApi.reducerPath]:  alertsApi.reducer,
    [devicesApi.reducerPath]: devicesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(alertsApi.middleware, devicesApi.middleware),
});

export type RootState  = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;