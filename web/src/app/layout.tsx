"use client";

import { ReactNode } from "react";
import { Provider } from "react-redux";
import { ThemeProvider, CssBaseline, AppBar, Toolbar, Typography, Box } from "@mui/material";
import { store } from "@/lib/store";
import theme from "@/lib/theme";
import UserSwitcher from "@/components/UserSwitcher";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Provider store={store}>
          <ThemeProvider theme={theme}>
            <CssBaseline />

            {/* top nav bar */}
            <AppBar position="static" sx={{ bgcolor: "background.paper", borderBottom: "1px solid rgba(255,255,255,0.06)" }} elevation={0}>
              <Toolbar sx={{ justifyContent: "space-between" }}>
                <Typography variant="h6" sx={{ color: "primary.main", fontWeight: 700, letterSpacing: "0.1em" }}>
                  KNAQ
                </Typography>
                <UserSwitcher />
              </Toolbar>
            </AppBar>

            {children}
          </ThemeProvider>
        </Provider>
      </body>
    </html>
  );
}