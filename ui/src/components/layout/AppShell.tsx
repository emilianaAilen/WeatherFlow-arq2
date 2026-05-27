import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppShell() {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, minHeight: '100vh', backgroundColor: 'grey.100' }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
