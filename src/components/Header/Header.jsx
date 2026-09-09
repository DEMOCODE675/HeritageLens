import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Box,
  List as SuggestionList,
  ListItemButton,
  ListItemText,
  Paper,
  Toolbar,
  Typography,
  InputBase,
  Button,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ExploreIcon from '@mui/icons-material/Explore';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CameraAltIcon from '@mui/icons-material/CameraAlt';

import { getAutocompleteSuggestionsSafe } from '../../api/geoapifyApi';
import useStyles from './styles';

const Header = ({
  onPlaceSelected,
  activePage = 'advisor',
  onNavigate,
  currentUser,
  onOpenAuth,
  onLogout,
}) => {
  const { classes } = useStyles();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 3) {
        setSuggestions([]);
        return;
      }

      setSuggestions(await getAutocompleteSuggestionsSafe(query));
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const selectPlace = (place) => {
    onPlaceSelected({ lat: place.lat, lng: place.lng, name: place.name });
    setQuery(place.name);
    setSuggestions([]);
    setIsFocused(false);
  };

  return (
    <AppBar position="static">
      <Toolbar className={classes.toolbar}>
        {/* App Title & Page Navigation Links */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          <Typography
            variant="h5"
            className={classes.title}
            onClick={() => onNavigate && onNavigate('advisor')}
            sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            Travel Advisor
          </Typography>

          {/* Navigation link of page called "marketPlace" */}
          <Box className={classes.navContainer}>
            <Tooltip title="Travel Guide">
              <Button
                className={`${classes.navButton} ${activePage === 'advisor' ? classes.activeNavButton : ''}`}
                startIcon={<ExploreIcon fontSize="small" />}
                onClick={() => onNavigate && onNavigate('advisor')}
                aria-label="Guide"
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Guide</Box>
              </Button>
            </Tooltip>
            <Tooltip title="Local Marketplace">
              <Button
                className={`${classes.navButton} ${
                  activePage === 'marketplace' || activePage === 'add-product' ? classes.activeNavButton : ''
                }`}
                startIcon={<StorefrontIcon fontSize="small" />}
                onClick={() => onNavigate && onNavigate('marketplace')}
                sx={{ border: '1px solid rgba(255,255,255,0.4)' }}
                aria-label="Marketplace"
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>marketPlace</Box>
              </Button>
            </Tooltip>
            <Tooltip title="Sight & Monument Scanner">
              <Button
                className={`${classes.navButton} ${
                  activePage === 'scanner' ? classes.activeNavButton : ''
                }`}
                startIcon={<CameraAltIcon fontSize="small" />}
                onClick={() => onNavigate && onNavigate('scanner')}
                sx={{
                  bgcolor: activePage === 'scanner' ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.5)',
                  fontWeight: 700,
                }}
                aria-label="Cam Scanner"
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Cam Scanner</Box>
              </Button>
            </Tooltip>
          </Box>
        </Box>

        {/* Search section & User Auth Actions */}
        <Box className={classes.searchContainer}>
          <Typography variant="h6" className={classes.subtitle}>
            {activePage === 'marketplace' ? 'Search location' : 'Explore new places'}
          </Typography>

          {/* Search bar */}
          <div className={classes.search}>
            <div className={classes.searchIcon}>
              <SearchIcon />
            </div>
            <InputBase
              value={query}
              placeholder="Search a city or place"
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setIsFocused(true)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && suggestions[0]) selectPlace(suggestions[0]);
              }}
              classes={{ root: classes.inputRoot, input: classes.inputInput }}
            />
            {isFocused && suggestions.length > 0 && (
              <Paper className={classes.suggestions} elevation={6}>
                <SuggestionList dense>
                  {suggestions.map((place) => (
                    <ListItemButton key={place.id} onMouseDown={() => selectPlace(place)}>
                      <ListItemText primary={place.name} />
                    </ListItemButton>
                  ))}
                </SuggestionList>
              </Paper>
            )}
          </div>

          {/* Right Action Icons & Auth */}
          <Box className={classes.userSection} sx={{ ml: { xs: 0, sm: 1.5 } }}>
            {/* User Profile / Login */}
            {currentUser ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Chip
                  size="small"
                  icon={<AccountCircleIcon fontSize="small" />}
                  label={`${currentUser.displayName || currentUser.email} (${
                    currentUser.role === 'seller' ? 'Seller' : 'Buyer'
                  })`}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    maxWidth: 160,
                  }}
                />
                <Tooltip title="Sign Out">
                  <IconButton color="inherit" size="small" onClick={onLogout}>
                    <LogoutIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            ) : (
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                onClick={onOpenAuth}
                sx={{
                  textTransform: 'none',
                  borderColor: 'rgba(255,255,255,0.7)',
                  borderRadius: 2,
                  whiteSpace: 'nowrap',
                }}
              >
                Sign In
              </Button>
            )}
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
