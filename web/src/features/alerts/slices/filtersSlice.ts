import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AlertFilters } from "@/features/alerts/types";

// this is the initial state - what the filters look like when the app loads
// empty strings mean "no filter selected" (show everything)
const initialState: AlertFilters = {
  severity: "",
  status: "",
  device_id: "",
  q: "",
};

const filtersSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    // update a single filter field - called when user changes a dropdown or types in search
    setFilter: (state, action: PayloadAction<Partial<AlertFilters>>) => {
      return { ...state, ...action.payload };
    },

    // reset everything back to the initial empty state
    clearFilters: () => initialState,
  },
});

export const { setFilter, clearFilters } = filtersSlice.actions;
export default filtersSlice.reducer;