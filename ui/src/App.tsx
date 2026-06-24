import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import AppShell from './components/layout/AppShell';
import UsersPage from './components/users/UsersPage';
import WeatherStationsPage from './components/weatherStations/WeatherStationsPage';
import WeatherStationDashboard from './components/weatherStations/WeatherStationDashboard';
import MeasurementsPage from './components/measurements/MeasurementsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

const theme = createTheme({
  palette: { primary: { main: '#1565c0' } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route index element={<Navigate to="/users" replace />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="weather-stations" element={<WeatherStationsPage />} />
              <Route path="weather-stations/:id" element={<WeatherStationDashboard />} />
              <Route path="measurements" element={<MeasurementsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
