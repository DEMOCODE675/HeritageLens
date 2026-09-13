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

const createScannedLandmarkMarkerIcon = (landmark) => L.divIcon({
  className: 'scanned-landmark-marker',
  html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;">
    <div style="display:flex;align-items:center;gap:8px;padding:6px 14px;background:linear-gradient(135deg,#0284c7 0%,#1e40af 100%);color:#fff;border:2.5px solid #ffffff;border-radius:24px;box-shadow:0 0 0 4px rgba(2,132,199,0.5), 0 8px 24px rgba(0,0,0,0.4);cursor:pointer;font-family:sans-serif;">
      <div style="width:26px;height:26px;border-radius:50%;background:#ffffff;color:#0284c7;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;box-shadow:0 2px 4px rgba(0,0,0,0.25);">📍</div>
      <div style="text-align:left;line-height:1.2;">
        <div style="font-size:8.5px;font-weight:900;color:#fef08a;letter-spacing:0.8px;text-transform:uppercase;display:flex;align-items:center;gap:4px;">
          <span style="width:7px;height:7px;border-radius:50%;background:#4ade80;display:inline-block;box-shadow:0 0 6px #4ade80;"></span>
          YOU ARE HERE
        </div>
        <div style="font-size:12.5px;font-weight:800;color:#ffffff;max-width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${escapeHtml(landmark.title || 'Scanned Sight')}
        </div>
      </div>
    </div>
    <div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:9px solid #1e40af;margin-top:-1px;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.3));"></div>
  </div>`,
  iconSize: [200, 52],
  iconAnchor: [100, 52],
  popupAnchor: [0, -52],
});

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const RecenterMap = ({ coords, highlightedStore, highlightedLandmark }) => {
  const map = useMap();

  useEffect(() => {
    if (highlightedLandmark && Number.isFinite(highlightedLandmark.coordinates?.lat) && Number.isFinite(highlightedLandmark.coordinates?.lng)) {
      map.setView([highlightedLandmark.coordinates.lat, highlightedLandmark.coordinates.lng], 16, { animate: true });
    } else if (highlightedStore && Number.isFinite(highlightedStore.lat) && Number.isFinite(highlightedStore.lng)) {
      map.setView([highlightedStore.lat, highlightedStore.lng], 16, { animate: true });
    } else if (Number.isFinite(coords?.lat) && Number.isFinite(coords?.lng)) {
      map.setView([coords.lat, coords.lng]);
    }
  }, [coords, highlightedStore, highlightedLandmark, map]);

  return null;
};

const Map = ({ coords, places, setChildClicked, highlightedStore, highlightedLandmark, onBackToMarketplace, onBackToScanner }) => {
  const { classes } = useStyles();
  const tileConfig = getTileConfig();
  const storeMarkerRef = React.useRef(null);
  const landmarkMarkerRef = React.useRef(null);

  useEffect(() => {
    if (highlightedStore && storeMarkerRef.current) {
      storeMarkerRef.current.openPopup();
    }
  }, [highlightedStore]);

  useEffect(() => {
    if (highlightedLandmark && landmarkMarkerRef.current) {
      landmarkMarkerRef.current.openPopup();
    }
  }, [highlightedLandmark]);

  return (
    <div className={`${classes.mapContainer} ${classes.markerStyles}`}>
      <MapContainer center={[coords.lat, coords.lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution={tileConfig.attribution}
          url={tileConfig.url}
        />
        <RecenterMap coords={coords} highlightedStore={highlightedStore} highlightedLandmark={highlightedLandmark} />

        {/* Highlighted Scanned Landmark Marker ("You are here") */}
        {highlightedLandmark && Number.isFinite(highlightedLandmark.coordinates?.lat) && Number.isFinite(highlightedLandmark.coordinates?.lng) && (
          <Marker
            ref={landmarkMarkerRef}
            position={[highlightedLandmark.coordinates.lat, highlightedLandmark.coordinates.lng]}
            icon={createScannedLandmarkMarkerIcon(highlightedLandmark)}
            zIndexOffset={1200}
          >
            <Popup autoPan>
              <div style={{ maxWidth: 260, padding: 2, fontFamily: 'sans-serif' }}>
                {highlightedLandmark.imageUrl && (
                  <img
                    src={highlightedLandmark.imageUrl}
                    alt={highlightedLandmark.title}
                    style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }}
                  />
                )}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#0284c7', color: '#fff', fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 4, marginBottom: 6, letterSpacing: 0.5 }}>
                  🎯 YOU ARE HERE • SCANNED SIGHT
                </div>
                <Typography variant="subtitle1" style={{ fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>
                  {highlightedLandmark.title}
                </Typography>
                {highlightedLandmark.category && (
                  <div style={{ display: 'inline-block', background: '#f1f5f9', color: '#334155', fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, marginTop: 4 }}>
                    🏛️ {highlightedLandmark.category}
                  </div>
                )}
                {highlightedLandmark.location && (
                  <Typography variant="body2" style={{ color: '#475569', fontSize: 12, marginTop: 4, fontWeight: 500 }}>
                    📍 {highlightedLandmark.location}
                  </Typography>
                )}
                {highlightedLandmark.history && (
                  <Typography variant="body2" style={{ color: '#334155', fontSize: 11, marginTop: 6, lineHeight: 1.3, maxHeight: 60, overflow: 'hidden' }}>
                    {highlightedLandmark.history.slice(0, 130)}...
                  </Typography>
                )}
                <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <a
                    href={`https://www.openstreetmap.org/directions?to=${highlightedLandmark.coordinates.lat}%2C${highlightedLandmark.coordinates.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: 11,
                      color: '#0284c7',
                      textDecoration: 'underline',
                      fontWeight: 700,
                    }}
                  >
                    🗺️ Get Directions
                  </a>
                  {onBackToScanner && (
                    <button
                      type="button"
                      onClick={onBackToScanner}
                      style={{
                        marginLeft: 'auto',
                        background: '#0284c7',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: '4px 8px',
                      }}
                    >
                      📷 Full History
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

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