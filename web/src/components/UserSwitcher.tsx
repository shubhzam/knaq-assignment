"use client";

import { useDispatch, useSelector } from "react-redux";
import { Select, MenuItem, Box, Typography, Chip } from "@mui/material";
import { RootState } from "@/lib/store";
import { setToken, USERS } from "@/lib/auth/authSlice";
import { alertsApi } from "@/features/alerts/api/alertsApi";
import { devicesApi } from "@/features/devices/api/devicesApi";
import { clearFilters } from "@/features/alerts/slices/filtersSlice";

export default function UserSwitcher() {
  const dispatch = useDispatch();
  const activeToken = useSelector((state: RootState) => state.auth.token);
  const activeUser = USERS.find((u) => u.token === activeToken) ?? USERS[0];

  const handleSwitch = (token: string) => {
    dispatch(setToken(token));
    // clear filters so device_id from previous user doesn't bleed over
    dispatch(clearFilters());
    // reset all cached data so everything re-fetches as the new user
    dispatch(alertsApi.util.resetApiState());
    dispatch(devicesApi.util.resetApiState());
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography variant="caption" color="text.secondary">
        Logged in as
      </Typography>
      <Select
        value={activeToken}
        onChange={(e) => handleSwitch(e.target.value)}
        size="small"
        variant="outlined"
        sx={{ minWidth: 180, fontSize: "0.8rem" }}
      >
        {USERS.map((u) => (
          <MenuItem key={u.token} value={u.token}>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography variant="body2">{u.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {u.company}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
      <Chip
        label={activeUser.role}
        size="small"
        color={activeUser.role === "manager" ? "primary" : "default"}
        variant="outlined"
      />
    </Box>
  );
}