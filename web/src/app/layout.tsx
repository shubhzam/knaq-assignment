"use client";

import { ReactNode } from "react";
import { Provider } from "react-redux";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { store } from "@/lib/store";
import theme from "@/lib/theme";


export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Provider makes the Redux store available to every component below */}
        <Provider store={store}>
          {/* ThemeProvider makes MUI use our brand colors everywhere */}
          <ThemeProvider theme={theme}>
            {/* CssBaseline normalizes browser default styles - like a CSS reset */}
            <CssBaseline />
            {children}
          </ThemeProvider>
        </Provider>
      </body>
    </html>
  );
}