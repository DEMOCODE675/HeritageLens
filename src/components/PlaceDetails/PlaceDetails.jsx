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

const PlaceDetails = ({ place, coords }) => {
  const { classes } = useStyles();
  const mapUrl = `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=18/${place.lat}/${place.lng}`;

  return (
    <Card className={classes.card} elevation={2}>
      <CardMedia component="img" className={classes.image} image={place.imageUrl} alt={place.name} />
      <CardContent className={classes.content}>
        <Typography className={classes.name} variant="subtitle1">{place.name}</Typography>
        <Box className={classes.ratingRow}>
          <Rating size="small" value={Number(place.rating) || 0} precision={0.5} readOnly />
          <Typography className={classes.reviewText} variant="caption">
            {place.rating ? `${place.rating} rating` : 'New place'}
          </Typography>
        </Box>
        <Typography className={classes.meta} variant="caption">Price: {place.price_level || 'Not listed'}</Typography>
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