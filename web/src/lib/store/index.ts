import { configureStore } from "@reduxjs/toolkit";
import { alertsApi } from "@/features/alerts/api/alertsApi";
import { devicesApi } from "@/features/devices/api/devicesApi";
import filtersReducer from "@/features/alerts/slices/filtersSlice";

// the central store - one per app
// every component can read from or write to this
export const store = configureStore({
  reducer: {
    // client state - filter values the user has selected
    filters: filtersReducer,

    // server state - RTK Query manages these automatically
    [alertsApi.reducerPath]: alertsApi.reducer,
    [devicesApi.reducerPath]: devicesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      // RTK Query needs its middleware for caching and invalidation to work
      .concat(alertsApi.middleware, devicesApi.middleware),
});

// these types let TypeScript know the exact shape of your store
// useSelector and useDispatch will be fully typed
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;