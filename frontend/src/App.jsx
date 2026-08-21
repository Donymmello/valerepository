import { ThemeProvider } from "@mui/material/styles";
import AppRoutes from "./routes/AppRoutes";
import ErrorBoundary from "./components/ErrorBoundary";
import theme from "./theme";

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </ThemeProvider>
  );
}
