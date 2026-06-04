"use client";

import { ReactNode } from "react";
import { Provider } from "react-redux";
import { ThemeProvider, CssBaseline, AppBar, Toolbar, Typography, Button, Stack } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { store } from "@/lib/store";
import theme from "@/lib/theme";
import UserSwitcher from "@/components/UserSwitcher";

function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <AppBar position="static" sx={{ bgcolor: "background.paper", borderBottom: "1px solid rgba(255,255,255,0.06)" }} elevation={0}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography variant="h6" sx={{ color: "primary.main", fontWeight: 700, letterSpacing: "0.1em" }}>
          KNAQ
        </Typography>

        {/* nav links */}
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            onClick={() => router.push("/alerts")}
            sx={{ color: pathname === "/alerts" ? "primary.main" : "text.secondary" }}
          >
            Queue
          </Button>
          <Button
            size="small"
            onClick={() => router.push("/analytics")}
            sx={{ color: pathname?.startsWith("/analytics") ? "primary.main" : "text.secondary" }}
          >
            Analytics
          </Button>
        </Stack>

        <UserSwitcher />
      </Toolbar>
    </AppBar>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Provider store={store}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Nav />
            {children}
          </ThemeProvider>
        </Provider>
      </body>
    </html>
  );
}