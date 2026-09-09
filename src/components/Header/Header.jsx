import React, { useEffect, useState } from 'react';
import { AppBar, Box, List as SuggestionList, ListItemButton, ListItemText, Paper, Toolbar, Typography, InputBase } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import { getAutocompleteSuggestionsSafe } from '../../api/geoapifyApi';
import useStyles from './styles';

const Header = ({ onPlaceSelected }) => {
    const { classes } = useStyles();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length < 3) {
                setSuggestions([]);
                return;
            }

            setSuggestions(await getAutocompleteSuggestionsSafe(query));
        }, 400);

        return () => clearTimeout(timer);
    }, [query]);

    const selectPlace = (place) => {
        onPlaceSelected({ lat: place.lat, lng: place.lng });
        setQuery(place.name);
        setSuggestions([]);
        setIsFocused(false);
    };

    return (
        <AppBar position="static">
            <Toolbar className={classes.toolbar}>
                {/* App Title */}
                <Typography variant="h5" className={classes.title}>
                    Travel Advisor
                </Typography>

                {/* Search section */}
                <Box className={classes.searchContainer}>
                    <Typography variant="h6" className={classes.subtitle}>
                        Explore new places
                    </Typography>

                    <div className={classes.search}>
                        <div className={classes.searchIcon}>
                            <SearchIcon />
                        </div>
                        <InputBase
                            value={query}
                            placeholder="Search a city or place"
                            onChange={(event) => setQuery(event.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && suggestions[0]) selectPlace(suggestions[0]);
                            }}
                            classes={{ root: classes.inputRoot, input: classes.inputInput }}
                        />
                        {isFocused && suggestions.length > 0 && (
                            <Paper className={classes.suggestions} elevation={6}>
                                <SuggestionList dense>
                                    {suggestions.map((place) => (
                                        <ListItemButton key={place.id} onMouseDown={() => selectPlace(place)}>
                                            <ListItemText primary={place.name} />
                                        </ListItemButton>
                                    ))}
                                </SuggestionList>
                            </Paper>
                        )}
                    </div>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header;