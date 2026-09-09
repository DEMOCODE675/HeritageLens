import axios from 'axios';

const GEOAPIFY_API_URL = 'https://api.geoapify.com';
const GEOAPIFY_API_KEY = process.env.REACT_APP_GEOAPIFY_API_KEY;

const categoriesByType = {
  restaurants: 'catering.restaurant',
  hotels: 'accommodation.hotel',
  attractions: 'tourism.sights,leisure.park,entertainment',
};

const fallbackImages = {
  restaurants: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=640&q=80',
  hotels: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=640&q=80',
  attractions: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=640&q=80',
};

const imageForPlace = (type, id) => `https://picsum.photos/seed/${encodeURIComponent(`${type}-${id}`)}/640/360`;

const requireApiKey = () => {
  if (!GEOAPIFY_API_KEY) {
    throw new Error('Missing REACT_APP_GEOAPIFY_API_KEY in .env');
  }
};

const normalizePlace = (feature, type) => {
  const properties = feature.properties || {};
  const [lng, lat] = feature.geometry?.coordinates || [];

  return {
    id: properties.place_id || `${lat}-${lng}-${properties.name}`,
    name: properties.name || properties.address_line1 || 'Unnamed place',
    address: properties.formatted || properties.address_line2 || 'Address unavailable',
    lat: Number(properties.lat ?? lat),
    lng: Number(properties.lon ?? lng),
    category: type,
    website: properties.website,
    phone: properties.contact?.phone,
    imageUrl: properties.datasource?.raw?.image || imageForPlace(type, properties.place_id || `${lat}-${lng}`) || fallbackImages[type],
  };
};

export const getPlacesData = async (type, lat, lng, radius = 25000) => {
  requireApiKey();

  const { data } = await axios.get(`${GEOAPIFY_API_URL}/v2/places`, {
    params: {
      categories: categoriesByType[type] || categoriesByType.restaurants,
      filter: `circle:${lng},${lat},${radius}`,
      bias: `proximity:${lng},${lat}`,
      limit: 100,
      apiKey: GEOAPIFY_API_KEY,
    },
  });

  return (data.features || [])
    .map((feature) => normalizePlace(feature, type))
    .filter((place) => place.name && Number.isFinite(place.lat) && Number.isFinite(place.lng));
};

export const getAutocompleteSuggestions = async (text) => {
  const query = text.trim();
  if (!query) return [];

  requireApiKey();

  const { data } = await axios.get(`${GEOAPIFY_API_URL}/v1/geocode/search`, {
    params: {
      text: query,
      format: 'json',
      limit: 5,
      apiKey: GEOAPIFY_API_KEY,
    },
  });

  return (data.results || []).map((result) => {
    return {
      id: result.place_id || `${result.lat}-${result.lon}`,
      name: result.formatted || result.address_line1 || result.city || 'Unknown place',
      lat: Number(result.lat),
      lng: Number(result.lon),
    };
  }).filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng));
};

export const getPlacesDataSafe = async (...args) => {
  try {
    return await getPlacesData(...args);
  } catch (error) {
    console.error('Unable to load Geoapify places:', error);
    return [];
  }
};

export const getAutocompleteSuggestionsSafe = async (...args) => {
  try {
    return await getAutocompleteSuggestions(...args);
  } catch (error) {
    console.error('Unable to load Geoapify suggestions:', error);
    return [];
  }
};
