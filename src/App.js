import React, { useState, useEffect } from 'react';
import { CssBaseline, Grid } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { getFoursquarePlaces } from './api/foursquareApi';
import Header from './components/Header/Header';
import List from './components/Lists/List';
import Map from './components/Map/Map';
import Marketplace from './components/Marketplace/Marketplace';
import AddProduct from './components/Marketplace/AddProduct';
import AuthModal from './components/Auth/AuthModal';
import ConfigModal from './components/ConfigModal/ConfigModal';
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
  const [activePage, setActivePage] = useState('advisor'); // 'advisor' | 'marketplace' | 'add-product'
  const [currentUser, setCurrentUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [pendingPage, setPendingPage] = useState(null);

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
        onOpenConfig={() => setConfigModalOpen(true)}
      />

      {/* 1. Tourist Guide Advisor View (Unmodified original logic & layout) */}
      {activePage === 'advisor' && (
        <Grid container spacing={3} style={{ width: '100%' }}>
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
            />
          </Grid>
        </Grid>
      )}

      {/* 2. Marketplace Listing View */}
      {activePage === 'marketplace' && (
        <Marketplace
          currentUser={currentUser}
          currentCoords={coords}
          currentPlaceName={currentPlaceName}
          onNavigateToAddProduct={() => handleNavigate('add-product')}
          onOpenAuth={() => setAuthModalOpen(true)}
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

      {/* Firebase Authentication Modal */}
      <AuthModal
        open={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingPage(null);
        }}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Firebase & Appwrite Keys Configuration Modal */}
      <ConfigModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
      />
    </ThemeProvider>
  );
};

export default App;
