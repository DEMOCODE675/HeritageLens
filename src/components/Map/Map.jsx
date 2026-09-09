import React, { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Typography } from '@mui/material';
import 'leaflet/dist/leaflet.css';

import useStyles from './styles.js';

const getTileConfig = () => {
  const geoapifyKey = typeof window !== 'undefined'
    ? (localStorage.getItem('geoapify_api_key') || process.env.REACT_APP_GEOAPIFY_API_KEY)
    : process.env.REACT_APP_GEOAPIFY_API_KEY;

  if (geoapifyKey && geoapifyKey.trim()) {
    return {
      attribution: '&copy; <a href="https://www.geoapify.com/">Geoapify</a>, &copy; OpenStreetMap contributors',
      url: `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${geoapifyKey.trim()}`,
    };
  }

  return {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  };
};

const escapeHtml = (value) => String(value || '')
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

const createStoreMarkerIcon = (store) => L.divIcon({
  className: 'seller-store-marker',
  html: `<div style="display:flex;align-items:center;gap:6px;min-width:145px;height:44px;padding:4px 10px;box-sizing:border-box;background:#047857;color:#fff;border:2.5px solid #ffffff;border-radius:22px;box-shadow:0 4px 16px rgba(4,120,87,0.55), 0 0 0 3px rgba(16,185,129,0.35);cursor:pointer;">
    <div style="font-size:20px;line-height:1;">🏪</div>
    <div style="overflow:hidden;line-height:1.2;text-align:left;">
      <div style="font-size:8px;font-weight:800;letter-spacing:0.5px;color:#a7f3d0;text-transform:uppercase;">SELLER STORE</div>
      <div style="font-size:12px;font-weight:700;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;max-width:115px;">${escapeHtml(store.shopName || 'Store')}</div>
    </div>
  </div>`,
  iconSize: [155, 44],
  iconAnchor: [77, 44],
  popupAnchor: [0, -44],
});

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const RecenterMap = ({ coords, highlightedStore }) => {
  const map = useMap();

  useEffect(() => {
    if (highlightedStore && Number.isFinite(highlightedStore.lat) && Number.isFinite(highlightedStore.lng)) {
      map.setView([highlightedStore.lat, highlightedStore.lng], 16, { animate: true });
    } else if (Number.isFinite(coords?.lat) && Number.isFinite(coords?.lng)) {
      map.setView([coords.lat, coords.lng]);
    }
  }, [coords, highlightedStore, map]);

  return null;
};

const Map = ({ coords, places, setChildClicked, highlightedStore, onBackToMarketplace }) => {
  const { classes } = useStyles();
  const tileConfig = getTileConfig();
  const storeMarkerRef = React.useRef(null);

  useEffect(() => {
    if (highlightedStore && storeMarkerRef.current) {
      storeMarkerRef.current.openPopup();
    }
  }, [highlightedStore]);

  return (
    <div className={`${classes.mapContainer} ${classes.markerStyles}`}>
      <MapContainer center={[coords.lat, coords.lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution={tileConfig.attribution}
          url={tileConfig.url}
        />
        <RecenterMap coords={coords} highlightedStore={highlightedStore} />

        {/* Highlighted Marketplace Seller Store Marker */}
        {highlightedStore && Number.isFinite(highlightedStore.lat) && Number.isFinite(highlightedStore.lng) && (
          <Marker
            ref={storeMarkerRef}
            position={[highlightedStore.lat, highlightedStore.lng]}
            icon={createStoreMarkerIcon(highlightedStore)}
            zIndexOffset={1000}
          >
            <Popup autoPan>
              <div style={{ maxWidth: 240, padding: 2 }}>
                {highlightedStore.mediaUrl && (
                  <img
                    src={highlightedStore.mediaUrl}
                    alt={highlightedStore.title || highlightedStore.shopName}
                    style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }}
                  />
                )}
                <div style={{ display: 'inline-block', background: '#047857', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4, marginBottom: 6, letterSpacing: 0.5 }}>
                  🏪 VERIFIED SELLER STORE
                </div>
                <Typography variant="subtitle1" style={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                  {highlightedStore.shopName}
                </Typography>
                {highlightedStore.title && (
                  <Typography variant="caption" style={{ display: 'block', color: '#1976d2', fontWeight: 600, marginTop: 2 }}>
                    Featured item: {highlightedStore.title}
                  </Typography>
                )}
                <Typography variant="body2" style={{ color: '#475569', fontSize: 12, marginTop: 4 }}>
                  📍 {highlightedStore.locationName}
                </Typography>
                {highlightedStore.sellerPhone && (
                  <div style={{ marginTop: 8 }}>
                    <a
                      href={`tel:${highlightedStore.sellerPhone}`}
                      style={{
                        display: 'inline-block',
                        background: '#e0f2fe',
                        color: '#0284c7',
                        padding: '4px 10px',
                        borderRadius: 4,
                        fontSize: 12,
                        textDecoration: 'none',
                        fontWeight: 700,
                      }}
                    >
                      📞 Call {highlightedStore.sellerPhone}
                    </a>
                  </div>
                )}
                <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                  <a
                    href={`https://www.openstreetmap.org/directions?to=${highlightedStore.lat}%2C${highlightedStore.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: 11,
                      color: '#047857',
                      textDecoration: 'underline',
                      fontWeight: 600,
                    }}
                  >
                    🗺️ Get Directions
                  </a>
                  {onBackToMarketplace && (
                    <button
                      type="button"
                      onClick={onBackToMarketplace}
                      style={{
                        marginLeft: 'auto',
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: 4,
                        fontSize: 11,
                        cursor: 'pointer',
                        padding: '2px 6px',
                      }}
                    >
                      Back to Market
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

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