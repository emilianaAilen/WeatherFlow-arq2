import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import CloudIcon from '@mui/icons-material/Cloud';
import PeopleIcon from '@mui/icons-material/People';
import SensorsIcon from '@mui/icons-material/Sensors';
import { useNavigate, useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 220;

const navItems = [
  { label: 'Users', path: '/users', icon: <PeopleIcon /> },
  { label: 'Weather Stations', path: '/weather-stations', icon: <SensorsIcon /> },
  { label: 'Measurements', path: '/measurements', icon: <CloudIcon /> },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
      }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap sx={{ fontWeight: 'bold' }}>
          WeatherFlow
        </Typography>
      </Toolbar>

      <List>
        {navItems.map(({ label, path, icon }) => (
          <ListItemButton
            key={path}
            selected={pathname.startsWith(path)}
            onClick={() => navigate(path)}
          >
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}

export { DRAWER_WIDTH };
