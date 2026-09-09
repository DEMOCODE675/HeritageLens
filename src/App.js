import React, { useState, useEffect } from 'react';
import { CssBaseline, Grid, Box, Alert, Button, IconButton } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CloseIcon from '@mui/icons-material/Close';
import PlaceIcon from '@mui/icons-material/Place';

import { getFoursquarePlaces } from './api/foursquareApi';
import Header from './components/Header/Header';
import List from './components/Lists/List';
import Map from './components/Map/Map';
import Marketplace from './components/Marketplace/Marketplace';
import AddProduct from './components/Marketplace/AddProduct';
import MonumentScanner from './components/Scanner/MonumentScanner';
import AuthModal from './components/Auth/AuthModal';
import { subscribeToAuth, logoutUser } from './config/firebase';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#e91e63',
    },
  },
});

const App = () => {
  // Existing Tourist Guide State
  const [type, setType] = useState('restaurants');
  const [coords, setCoords] = useState({ lat: 40.7128, lng: -74.0060 });
  const [currentPlaceName, setCurrentPlaceName] = useState('New York, USA');
  const [places, setPlaces] = useState([]);
  const [childClicked, setChildClicked] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Marketplace & Navigation State
  const [activePage, setActivePage] = useState('advisor'); // 'advisor' | 'marketplace' | 'add-product' | 'scanner'
  const [currentUser, setCurrentUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingPage, setPendingPage] = useState(null);
  const [highlightedStore, setHighlightedStore] = useState(null);
  const [highlightedLandmark, setHighlightedLandmark] = useState(null);

  // Subscribe to Firebase Auth changes
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Geolocation detection on mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setCoords({ lat: latitude, lng: longitude });
        setCurrentPlaceName('Current Location');
      },
      () => console.warn('Location permission was unavailable; using the default location.'),
    );
  }, []);

  // Fetch Tourist Guide places when in advisor mode
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    getFoursquarePlaces(type, coords.lat, coords.lng, 25000)
      .then((data) => { if (active) setPlaces(data); })
      .finally(() => { if (active) setIsLoading(false); });

    return () => { active = false; };
  }, [coords.lat, coords.lng, type]);

  // Handle place selection from search bar
  const handlePlaceSelected = ({ lat, lng, name }) => {
    setCoords({ lat, lng });
    if (name) {
      setCurrentPlaceName(name);
    }
    setHighlightedStore(null);
  };

  // Move user from Marketplace to Location Map with highlighted seller store
  const handleViewStoreOnMap = (storeData) => {
    if (storeData && Number.isFinite(Number(storeData.lat)) && Number.isFinite(Number(storeData.lng))) {
      setCoords({ lat: Number(storeData.lat), lng: Number(storeData.lng) });
      setCurrentPlaceName(storeData.shopName ? `${storeData.shopName} (${storeData.locationName || 'Local Store'})` : 'Seller Store');
      setHighlightedStore(storeData);
      setActivePage('advisor');
    }
  };

  // Handle navigation requests
  const handleNavigate = (page) => {
    // If navigating to marketplace or add-product, user must be authenticated first
    if (page === 'marketplace' || page === 'add-product') {
      if (!currentUser) {
        setPendingPage(page);
        setAuthModalOpen(true);
        return;
      }
    }
    setActivePage(page);
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    if (pendingPage) {
      setActivePage(pendingPage);
      setPendingPage(null);
    } else {
      setActivePage('marketplace');
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setActivePage('advisor');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header
        onPlaceSelected={handlePlaceSelected}
        activePage={activePage}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* 1. Tourist Guide Advisor View */}
      {activePage === 'advisor' && (
        <Box sx={{ width: '100%' }}>
          {/* Scanned Landmark "You Are Here" Alert Banner */}
          {highlightedLandmark && (
            <Box sx={{ px: 3, pt: 2, pb: 1 }}>
              <Alert
                severity="info"
                icon={<PlaceIcon fontSize="inherit" sx={{ color: '#0284c7' }} />}
                action={
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button
                      color="inherit"
                      size="small"
                      variant="outlined"
                      onClick={() => setActivePage('scanner')}
                      sx={{ textTransform: 'none', fontWeight: 700, borderColor: 'currentColor' }}
                    >
                      View in Scanner
                    </Button>
                    <IconButton size="small" color="inherit" onClick={() => setHighlightedLandmark(null)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                }
                sx={{
                  borderRadius: 2,
                  alignItems: 'center',
                  bgcolor: '#f0f9ff',
                  border: '1.5px solid #bae6fd',
                  color: '#0369a1',
                }}
              >
                🎯 <strong>You are here!</strong> Scanned Landmark: <strong>{highlightedLandmark.title}</strong>
                {highlightedLandmark.location && ` (${highlightedLandmark.location})`}
                {' '}— Highlighted with a special pulsing beacon on the map so you know your exact spot.
              </Alert>
            </Box>
          )}

          {/* Seller Store Banner when navigating from marketplace */}
          {highlightedStore && (
            <Box sx={{ px: 3, pt: 2, pb: 1 }}>
              <Alert
                severity="success"
                icon={<StorefrontIcon fontSize="inherit" />}
                action={
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button
                      color="inherit"
                      size="small"
                      variant="outlined"
                      onClick={() => setActivePage('marketplace')}
                      sx={{ textTransform: 'none', fontWeight: 600, borderColor: 'currentColor' }}
                    >
                      Return to Marketplace
                    </Button>
                    <IconButton size="small" color="inherit" onClick={() => setHighlightedStore(null)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                }
                sx={{ borderRadius: 2, alignItems: 'center' }}
              >
                Displaying seller store location: <strong>{highlightedStore.shopName}</strong> located at <strong>{highlightedStore.locationName}</strong>
                {highlightedStore.title && ` — Featuring "${highlightedStore.title}"`}
              </Alert>
            </Box>
          )}

          <Grid container spacing={3} style={{ width: '100%', margin: 0 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <List
                isLoading={isLoading}
                childClicked={childClicked}
                places={places}
                coords={coords}
                type={type}
                setType={setType}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 8 }} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Map
                setChildClicked={setChildClicked}
                coords={coords}
                places={places}
                highlightedStore={highlightedStore}
                highlightedLandmark={highlightedLandmark}
                onBackToMarketplace={() => setActivePage('marketplace')}
                onBackToScanner={() => setActivePage('scanner')}
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {/* 2. Marketplace Listing View */}
      {activePage === 'marketplace' && (
        <Marketplace
          currentUser={currentUser}
          currentCoords={coords}
          currentPlaceName={currentPlaceName}
          onNavigateToAddProduct={() => handleNavigate('add-product')}
          onOpenAuth={() => setAuthModalOpen(true)}
          onViewStoreOnMap={handleViewStoreOnMap}
        />
      )}

      {/* 3. Add Product / Store Details Form */}
      {activePage === 'add-product' && (
        <AddProduct
          currentUser={currentUser}
          currentCoords={coords}
          currentPlaceName={currentPlaceName}
          onBack={() => setActivePage('marketplace')}
          onProductCreated={() => setActivePage('marketplace')}
        />
      )}

      {/* 4. Tourist Heritage Cam / Monument & Cafe Scanner */}
      {activePage === 'scanner' && (
        <MonumentScanner
          onBack={() => setActivePage('advisor')}
          onViewLocationOnMap={(landmarkCoords, landmarkData) => {
            if (landmarkCoords && Number.isFinite(landmarkCoords.lat) && Number.isFinite(landmarkCoords.lng)) {
              setCoords({ lat: landmarkCoords.lat, lng: landmarkCoords.lng });
              const title = (landmarkData && typeof landmarkData === 'object' ? landmarkData.title : landmarkData) || 'Scanned Sight';
              setCurrentPlaceName(title);
              setHighlightedStore(null);
              setHighlightedLandmark(
                typeof landmarkData === 'object' && landmarkData !== null
                  ? { ...landmarkData, coordinates: landmarkCoords }
                  : { title, coordinates: landmarkCoords }
              );
              setActivePage('advisor');
            }
          }}
        />
      )}

      {/* Firebase Authentication Modal */}
      <AuthModal
        open={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingPage(null);
        }}
        onAuthSuccess={handleAuthSuccess}
      />
    </ThemeProvider>
  );
};

export default App;
