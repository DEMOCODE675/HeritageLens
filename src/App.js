import React, { useState, useEffect } from 'react';
import { CssBaseline, Grid } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { getFoursquarePlaces } from './api/foursquareApi';
import Header from './components/Header/Header';
import List from './components/Lists/List';
import Map from './components/Map/Map';

const theme = createTheme();

const App = () => {
  const [type, setType] = useState('restaurants');
  const [coords, setCoords] = useState({ lat: 40.7128, lng: -74.0060 });
  const [places, setPlaces] = useState([]);
  const [childClicked, setChildClicked] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => setCoords({ lat: latitude, lng: longitude }),
      () => console.warn('Location permission was unavailable; using the default location.'),
    );
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    getFoursquarePlaces(type, coords.lat, coords.lng, 25000)
      .then((data) => { if (active) setPlaces(data); })
      .finally(() => { if (active) setIsLoading(false); });

    return () => { active = false; };
  }, [coords.lat, coords.lng, type]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header onPlaceSelected={setCoords} />
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
    </ThemeProvider>
  );
};

export default App;