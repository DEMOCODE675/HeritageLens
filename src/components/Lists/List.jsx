import React from 'react';
import { CircularProgress, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';

import PlaceDetails from '../PlaceDetails/PlaceDetails';
import useStyles from './styles';

const List = ({ places, coords, isLoading, childClicked, type, setType }) => {
  const { classes } = useStyles();

  return (
    <div className={classes.container}>
      <Typography className={classes.heading} variant="h5">{type === 'restaurants' ? 'Food & Dining' : type} around you</Typography>
      <FormControl className={classes.formControl}>
        <InputLabel id="place-type-label">Type</InputLabel>
        <Select
          size="small"
          labelId="place-type-label"
          value={type}
          label="Type"
          onChange={(event) => setType(event.target.value)}
        >
          <MenuItem value="restaurants">Restaurants</MenuItem>
          <MenuItem value="hotels">Hotels</MenuItem>
          <MenuItem value="attractions">Attractions</MenuItem>
        </Select>
      </FormControl>
      {isLoading ? <div className={classes.loading}><CircularProgress /></div> : (
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
