import React, { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Typography } from '@mui/material';
import 'leaflet/dist/leaflet.css';

import useStyles from './styles.js';

const GEOAPIFY_KEY = process.env.REACT_APP_GEOAPIFY_API_KEY;

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const createPlaceIcon = (place) => L.divIcon({
  className: 'place-marker-icon',
  html: `<div style="display:flex;align-items:center;gap:4px;width:96px;height:34px;padding:3px;box-sizing:border-box;background:#fff;border:1px solid #d7dee8;border-radius:6px;box-shadow:0 1px 5px rgba(15,23,42,.24);overflow:hidden;"><img style="width:28px;height:28px;flex:0 0 28px;object-fit:cover;border-radius:4px;" src="${escapeHtml(place.imageUrl)}" alt="" /><span style="display:block;overflow:hidden;color:#172033;font:600 9px/1.2 sans-serif;white-space:nowrap;text-overflow:ellipsis;">${escapeHtml(place.name)}</span></div>`,
  iconSize: [96, 34],
  iconAnchor: [48, 34],
  popupAnchor: [0, -34],
});

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const RecenterMap = ({ coords }) => {
  const map = useMap();

  useEffect(() => {
    if (Number.isFinite(coords?.lat) && Number.isFinite(coords?.lng)) {
      map.setView([coords.lat, coords.lng]);
    }
  }, [coords, map]);

  return null;
};

const Map = ({ coords, places, setChildClicked }) => {
  const { classes } = useStyles();

  return (
    <div className={`${classes.mapContainer} ${classes.markerStyles}`}>
      <MapContainer center={[coords.lat, coords.lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.geoapify.com/">Geoapify</a>, &copy; OpenStreetMap contributors'
          url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_KEY}`}
        />
        <RecenterMap coords={coords} />
        {places.map((place, index) => {
          const position = [place.lat, place.lng];
          if (position.some(Number.isNaN)) return null;

          return (
            <Marker
              position={position}
              icon={createPlaceIcon(place)}
              key={place.id || index}
              eventHandlers={{ click: () => setChildClicked(index) }}
            >
              <Popup>
                <img
                  className={classes.pointer}
                  style={{ width: '150px', height: '80px', objectFit: 'cover', display: 'block' }}
                  src={place.imageUrl}
                  alt={place.name}
                />
                <Typography variant="subtitle2" gutterBottom>{place.name}</Typography>
                <Typography variant="body2">{place.address}</Typography>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default Map;