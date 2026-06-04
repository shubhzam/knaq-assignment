import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const USERS = [
  { token: "token-sarah", name: "Sarah Chen",  role: "manager",  company: "Brookfield Properties" },
  { token: "token-james", name: "James Park",  role: "engineer", company: "Brookfield Properties" },
  { token: "token-nina",  name: "Nina Torres", role: "engineer", company: "Brookfield Properties" },
  { token: "token-raj",   name: "Raj Patel",   role: "manager",  company: "Hines" },
  { token: "token-lisa",  name: "Lisa Wong",   role: "engineer", company: "Hines" },
  { token: "token-kenji", name: "Kenji Mori",  role: "manager",  company: "Mitsui Fudosan" },
];

interface AuthState {
  token: string;
}

const initialState: AuthState = {
  token: process.env.NEXT_PUBLIC_TOKEN ?? "token-sarah",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
  },
});

export const { setToken } = authSlice.actions;
export default authSlice.reducer;