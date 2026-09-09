import React from 'react';
import { Box, Card, CardContent, CardMedia, Link, Rating, Typography } from '@mui/material';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';

import useStyles from './styles.js';

const distanceBetween = (from, to) => {
  const earthRadiusKm = 6371;
  const latDelta = ((to.lat - from.lat) * Math.PI) / 180;
  const lngDelta = ((to.lng - from.lng) * Math.PI) / 180;
  const fromLatitude = (from.lat * Math.PI) / 180;
  const toLatitude = (to.lat * Math.PI) / 180;
  const value = Math.sin(latDelta / 2) ** 2
    + Math.sin(lngDelta / 2) ** 2 * Math.cos(fromLatitude) * Math.cos(toLatitude);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

const formatDistance = (place, coords) => {
  if (!coords || !Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return 'Distance unavailable';

  const distanceKm = distanceBetween(coords, place);
  return distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m away` : `${distanceKm.toFixed(1)} km away`;
};

const PlaceDetails = ({ place, coords, selected }) => {
  const { classes } = useStyles();
  const cardRef = React.useRef(null);
  const mapUrl = `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=18/${place.lat}/${place.lng}`;

  React.useEffect(() => {
    if (selected && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selected]);

  return (
    <Card
      ref={cardRef}
      className={classes.card}
      elevation={selected ? 5 : 1}
      sx={{
        border: selected ? '2px solid #1976d2' : '1px solid #e1e6ed',
        borderRadius: '8px',
        transition: 'all 0.25s ease',
      }}
    >
      <CardMedia
        component="img"
        className={classes.image}
        image={place.imageUrl}
        alt={place.name}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=640&q=80';
        }}
      />
      <CardContent className={classes.content}>
        <Typography className={classes.name} variant="subtitle1">{place.name}</Typography>
        <Box className={classes.ratingRow}>
          <Rating size="small" value={Number(place.rating) || 4} precision={0.5} readOnly />
          <Typography className={classes.reviewText} variant="caption">
            {place.rating ? `${place.rating} rating` : 'Recommended'}
          </Typography>
        </Box>
        <Typography className={classes.meta} variant="caption">Price: {place.price_level || '$$'}</Typography>
        <Typography className={classes.meta} variant="caption">Category: {place.category}</Typography>
        <Typography className={classes.meta} variant="caption">Distance: {formatDistance(place, coords)}</Typography>
        <Typography className={classes.meta} variant="caption">
          <LocationOnOutlinedIcon fontSize="inherit" /> {place.address}
        </Typography>
        {place.phone && (
          <Typography className={classes.meta} variant="caption">
            <PhoneOutlinedIcon fontSize="inherit" /> {place.phone}
          </Typography>
        )}
        <Box className={classes.links}>
          <Link href={mapUrl} target="_blank" rel="noreferrer" underline="hover">
            View map <OpenInNewOutlinedIcon fontSize="inherit" />
          </Link>
          {place.website && (
            <Link href={place.website} target="_blank" rel="noreferrer" underline="hover">
              Website <OpenInNewOutlinedIcon fontSize="inherit" />
            </Link>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default PlaceDetails;