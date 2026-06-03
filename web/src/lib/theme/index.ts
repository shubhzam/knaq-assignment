import { createTheme } from "@mui/material/styles";

// knaq brand colors from the spec
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#EFC01A", // gold
    },
    secondary: {
      main: "#4B8189", // teal
    },
    error: {
      main: "#F44336",
    },
    warning: {
      main: "#FFA726",
    },
    info: {
      main: "#29B6F6",
    },
    success: {
      main: "#66BB6A",
    },
    background: {
      default: "#0A0E1A",  // deep navy - makes the gold pop
      paper: "#111827",    // slightly lighter for cards and surfaces
    },
  },
  typography: {
    fontFamily: '"IBM Plex Mono", "Courier New", monospace',
    h6: {
      fontWeight: 600,
      letterSpacing: "0.05em",
    },
  },
  components: {
    // make all buttons consistent - this is a dense ops tool not a marketing site
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
    // tighten up table rows - this is a dense data app
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "10px 16px",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 700,
          fontSize: "0.7rem",
          letterSpacing: "0.08em",
        },
      },
    },
  },
});

export default theme;