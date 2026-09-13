import axios from 'axios';
import { getPlacesDataSafe } from './geoapifyApi';

const FOURSQUARE_URL = 'https://api.foursquare.com/v3/places/search';

export const getFoursquareConfig = () => {
  if (typeof window !== 'undefined') {
    const customKey = localStorage.getItem('foursquare_api_key');
    const customEnabled = localStorage.getItem('foursquare_enabled');
    if (customKey && customKey.trim()) {
      return {
        key: customKey.trim(),
        enabled: customEnabled === 'true' || true,
      };
    }
  }
  return {
    key: process.env.REACT_APP_FOURSQUARE_API_KEY || '',
    enabled: process.env.REACT_APP_ENABLE_FOURSQUARE_API === 'true',
  };
};

const categoriesByType = {
  restaurants: '13065',
  hotels: '19014',
  attractions: '16000',
};

const fallbackImages = {
  restaurants: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=640&q=80',
  hotels: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=640&q=80',
  attractions: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=640&q=80',
};

const imageForPlace = (type, id) => `https://picsum.photos/seed/${encodeURIComponent(`${type}-${id}`)}/640/360`;

export const getFoursquarePlaces = async (type, lat, lng, radius = 25000) => {
  const { key, enabled } = getFoursquareConfig();

  if (!enabled || !key) {
    return getPlacesDataSafe(type, lat, lng, radius);
  }

  try {
    const { data } = await axios.get(FOURSQUARE_URL, {
      headers: {
        Accept: 'application/json',
        Authorization: key,
      },
      params: {
        ll: `${lat},${lng}`,
        radius,
        categories: categoriesByType[type] || categoriesByType.restaurants,
        limit: 50,
        sort: 'DISTANCE',
        fields: 'fsq_id,name,location,geocodes,categories,rating,photos,website,tel',
      },
      timeout: 6000,
    });

    const results = (data.results || []).map((place) => {
      const coordinates = place.geocodes?.main || {};
      const category = place.categories?.[0]?.name || (type === 'restaurants' ? 'Food & Dining' : type === 'hotels' ? 'Hotels & Stays' : 'Sights & Landmarks');
      const photo = place.photos?.[0];

      return {
        id: place.fsq_id,
        name: place.name,
        address: place.location?.formatted || place.location?.address || 'Local area',
        lat: Number(coordinates.latitude),
        lng: Number(coordinates.longitude),
        category,
        rating: Number(place.rating) || 4.2,
        imageUrl: photo
          ? `${photo.prefix}original${photo.suffix}`
          : imageForPlace(type, place.fsq_id) || fallbackImages[type],
        website: place.website,
        phone: place.tel,
      };
    }).filter((place) => place.name && Number.isFinite(place.lat) && Number.isFinite(place.lng));

    if (results.length > 0) {
      return results;
    }
    return getPlacesDataSafe(type, lat, lng, radius);
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('Foursquare authentication failed or missing; using OpenStreetMap/Geoapify places instead.');
    } else {
      console.warn('Unable to load Foursquare places; falling back to alternative source:', error.message);
    }
    return getPlacesDataSafe(type, lat, lng, radius);
  }
};

