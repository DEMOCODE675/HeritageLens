import React from 'react';
import { Box, Chip, CircularProgress, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';

import PlaceDetails from '../PlaceDetails/PlaceDetails';
import useStyles from './styles';

const getCategoryTitle = (type) => {
  if (type === 'restaurants') return 'Food & Dining';
  if (type === 'hotels') return 'Hotels & Stays';
  return 'Attractions & Sights';
};

const List = ({ places = [], coords, isLoading, childClicked, type, setType }) => {
  const { classes } = useStyles();

  return (
    <div className={classes.container}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography className={classes.heading} variant="h5" sx={{ m: 0 }}>
          {getCategoryTitle(type)}
        </Typography>
        {!isLoading && (
          <Chip
            size="small"
            label={`${places.length} places`}
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        )}
      </Box>

      <FormControl className={classes.formControl}>
        <InputLabel id="place-type-label">Category</InputLabel>
        <Select
          size="small"
          labelId="place-type-label"
          value={type}
          label="Category"
          onChange={(event) => setType(event.target.value)}
        >
          <MenuItem value="restaurants">🍽️ Restaurants & Dining</MenuItem>
          <MenuItem value="hotels">🏨 Hotels & Accommodations</MenuItem>
          <MenuItem value="attractions">🎡 Attractions & Sights</MenuItem>
        </Select>
      </FormControl>

      {isLoading ? (
        <div className={classes.loading}>
          <CircularProgress size={36} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            Finding {type} around this location...
          </Typography>
        </div>
      ) : places.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1', mt: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#334155' }}>
            No {type} found in this immediate radius
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Try searching for a larger city in the search bar above or switch categories.
          </Typography>
        </Box>
      ) : (
        <div className={classes.list}>
          {places.map((place, index) => (
            <PlaceDetails key={place.id || index} place={place} coords={coords} selected={childClicked === index} />
          ))}
        </div>
      )}
    </div>
  );
};

export default List;

