import axios from 'axios';
import { getPlacesDataSafe } from './geoapifyApi';

const FOURSQUARE_URL = 'https://api.foursquare.com/v3/places/search';
const FOURSQUARE_KEY = process.env.REACT_APP_FOURSQUARE_API_KEY;
const FOURSQUARE_ENABLED = process.env.REACT_APP_ENABLE_FOURSQUARE_API === 'true';

const categoriesByType = {
  restaurants: '13065',
  hotels: '19014',
  attractions: '16000',
};

const fallbackImages = {
  restaurants: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=640&q=80',
  ho2tels: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=640&q=80',
  attractions: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=640&q=80',
};

const imageForPlace = (type, id) => `https://picsum.photos/seed/${encodeURIComponent(`${type}-${id}`)}/640/360`;

export const getFoursquarePlaces = async (type, lat, lng, radius = 25000) => {
  if (!FOURSQUARE_ENABLED || !FOURSQUARE_KEY) {
    return getPlacesDataSafe(type, lat, lng, radius);
  }

  try {
    const { data } = await axios.get(FOURSQUARE_URL, {
      headers: {
        Accept: 'application/json',
        Authorization: FOURSQUARE_KEY,
      },
      params: {
        ll: `${lat},${lng}`,
        radius,
        categories: categoriesByType[type] || categoriesByType.restaurants,
        limit: 50,
        sort: 'DISTANCE',
        fields: 'fsq_id,name,location,geocodes,categories,rating,photos,website,tel',
      },
    });

    return (data.results || []).map((place) => {
      const coordinates = place.geocodes?.main || {};
      const category = place.categories?.[0]?.name || type;
      const photo = place.photos?.[0];

      return {
        id: place.fsq_id,
        name: place.name,
        address: place.location?.formatted || place.location?.address || 'Address unavailable',
        lat: Number(coordinates.latitude),
        lng: Number(coordinates.longitude),
        category,
        rating: Number(place.rating) || 0,
        imageUrl: photo
          ? `${photo.prefix}original${photo.suffix}`
          : imageForPlace(type, place.fsq_id) || fallbackImages[type],
        website: place.website,
        phone: place.tel,
      };
    }).filter((place) => place.name && Number.isFinite(place.lat) && Number.isFinite(place.lng));
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('Foursquare authentication failed; using Geoapify places instead.');
      return getPlacesDataSafe(type, lat, lng, radius);
    }

    console.error('Unable to load Foursquare places:', error);
    return getPlacesDataSafe(type, lat, lng, radius);
  }
};
