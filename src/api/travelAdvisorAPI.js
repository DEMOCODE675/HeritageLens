import axios from 'axios';

const GEOAPIFY_URL = 'https://api.geoapify.com/v2';
const GEOAPIFY_KEY = process.env.REACT_APP_GEOAPIFY_API_KEY;

const categoriesForType = {
  restaurants: 'catering.restaurant',
  hotels: 'accommodation.hotel',
  attractions: 'tourism.attraction,tourism.sights,tourism.museum',
};

const imageForType = (type) => ({
  restaurants: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=640&q=80',
  hotels: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=640&q=80',
  attractions: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=640&q=80',
}[type] || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=640&q=80');

const toPlace = (feature, type) => {
  const properties = feature.properties || {};
  const latitude = properties.lat ?? feature.geometry?.coordinates?.[1];
  const longitude = properties.lon ?? feature.geometry?.coordinates?.[0];
  return {
    location_id: properties.place_id,
    name: properties.name || properties.address_line1,
    latitude,
    longitude,
    rating: Number(properties.rating) || 0,
    num_reviews: Number(properties.reviews?.count) || 0,
    price_level: properties.price_level || '',
    ranking: properties.rank?.value || '',
    address: properties.formatted,
    phone: properties.contact?.phone,
    website: properties.website,
    web_url: properties.website,
    photo: {
      images: {
        large: { url: properties.datasource?.raw?.image || imageForType(type) },
      },
    },
  };
};

export const getPlacesData = async (type, sw, ne) => {
  if (!GEOAPIFY_KEY) return [];

  try {
    const { data } = await axios.get(`${GEOAPIFY_URL}/places`, {
      params: {
        categories: categoriesForType[type] || categoriesForType.restaurants,
        filter: `rect:${sw.lng},${sw.lat},${ne.lng},${ne.lat}`,
        limit: 100,
        apiKey: GEOAPIFY_KEY,
      },
    });

    return (data.features || [])
      .map((feature) => toPlace(feature, type))
      .filter((place) => place.name && Number.isFinite(place.latitude) && Number.isFinite(place.longitude));
  } catch (error) {
    console.error('Unable to load nearby places:', error);
    return [];
  }
};

const weatherDescription = (code) => {
  if (code === 0) return 'Clear sky';
  if ([1, 2, 3].includes(code)) return 'Partly cloudy';
  if ([45, 48].includes(code)) return 'Foggy';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67].includes(code)) return 'Rain';
  if ([71, 73, 75, 77].includes(code)) return 'Snow';
  if ([80, 81, 82].includes(code)) return 'Rain showers';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Current weather';
};

export const getWeatherData = async (lat, lng) => {
  try {
    const { data } = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: lat,
        longitude: lng,
        current: 'temperature_2m,weather_code,wind_speed_10m',
        timezone: 'auto',
      },
    });

    return {
      ...data,
      description: weatherDescription(data.current?.weather_code),
    };
  } catch (error) {
    console.error('Unable to load weather:', error);
    return null;
  }
};

export const searchPlaces = async (query) => {
  if (!query.trim() || !GEOAPIFY_KEY) return [];

  try {
    const { data } = await axios.get(`${GEOAPIFY_URL}/geocode/autocomplete`, {
      params: { text: query, limit: 5, apiKey: GEOAPIFY_KEY },
    });

    return (data.features || []).map((feature) => {
      const properties = feature.properties || {};
      return {
        place_id: properties.place_id,
        display_name: properties.formatted,
        lat: properties.lat,
        lon: properties.lon,
      };
    });
  } catch (error) {
    console.error('Unable to search places:', error);
    return [];
  }
};
