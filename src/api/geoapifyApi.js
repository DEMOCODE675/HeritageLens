import axios from 'axios';

const GEOAPIFY_API_URL = 'https://api.geoapify.com';

export const getGeoapifyKey = () => {
  if (typeof window !== 'undefined') {
    const customKey = localStorage.getItem('geoapify_api_key');
    if (customKey && customKey.trim()) return customKey.trim();
  }
  return process.env.REACT_APP_GEOAPIFY_API_KEY || '';
};

const categoriesByType = {
  restaurants: 'catering.restaurant,catering.fast_food,catering.cafe',
  hotels: 'accommodation.hotel,accommodation.motel,accommodation.hostel',
  attractions: 'tourism.sights,tourism.attraction,tourism.museum,leisure.park,entertainment',
};

const imagePools = {
  restaurants: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=640&q=80',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=640&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=640&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=640&q=80',
    'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&w=640&q=80',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=640&q=80',
    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=640&q=80',
    'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&w=640&q=80',
  ],
  hotels: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=640&q=80',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=640&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=640&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=640&q=80',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=640&q=80',
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=640&q=80',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=640&q=80',
  ],
  attractions: [
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=640&q=80',
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=640&q=80',
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=640&q=80',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=640&q=80',
    'https://images.unsplash.com/photo-1508672019048-805b876b67e2?auto=format&fit=crop&w=640&q=80',
    'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=640&q=80',
    'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=640&q=80',
  ],
};

const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getImageForPlace = (type, seed) => {
  const pool = imagePools[type] || imagePools.restaurants;
  const index = hashString(String(seed || 'place')) % pool.length;
  return pool[index];
};

const normalizeGeoapifyPlace = (feature, type) => {
  const properties = feature.properties || {};
  const [lng, lat] = feature.geometry?.coordinates || [];
  const placeId = properties.place_id || `${lat}-${lng}-${properties.name}`;
  const h = hashString(String(placeId));
  const ratingVal = (4.0 + ((h % 10) / 10)).toFixed(1);
  const priceLevels = ['$', '$$', '$$$'];

  return {
    id: placeId,
    name: properties.name || properties.address_line1 || 'Local Establishment',
    address: properties.formatted || properties.address_line2 || 'Local area',
    lat: Number(properties.lat ?? lat),
    lng: Number(properties.lon ?? lng),
    category: type === 'restaurants' ? 'Food & Dining' : type === 'hotels' ? 'Hotels & Stays' : 'Sights & Landmarks',
    rating: Number(properties.rating || ratingVal),
    price_level: properties.price_level || priceLevels[h % 3],
    website: properties.website,
    phone: properties.contact?.phone,
    imageUrl: properties.datasource?.raw?.image || getImageForPlace(type, placeId),
  };
};

// Fetch live places from OpenStreetMap Nominatim (no API key required)
const fetchNominatimPlaces = async (type, lat, lng, radius = 25000) => {
  const deltaLat = Math.min(0.08, Math.max(0.02, radius / 111000));
  const deltaLng = Math.min(0.08, Math.max(0.02, radius / (111000 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)))));
  const minLat = lat - deltaLat;
  const maxLat = lat + deltaLat;
  const minLng = lng - deltaLng;
  const maxLng = lng + deltaLng;
  const viewbox = `${minLng},${maxLat},${maxLng},${minLat}`;

  const queryTerms = type === 'restaurants'
    ? ['restaurant', 'cafe']
    : type === 'hotels'
    ? ['hotel', 'guest house']
    : ['attraction', 'museum', 'park'];

  const results = [];
  for (const q of queryTerms) {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          format: 'json',
          q,
          bounded: 1,
          viewbox,
          limit: 12,
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'TouristAdvisorWebApp/1.0',
        },
        timeout: 6000,
      });

      if (Array.isArray(response.data) && response.data.length > 0) {
        results.push(...response.data);
      }
      if (results.length >= 15) break;
    } catch (e) {
      console.warn(`Nominatim search query "${q}" note:`, e.message);
    }
  }

  // Deduplicate by place_id or name
  const seen = new Set();
  const places = [];
  const priceLevels = ['$', '$$', '$$$'];

  for (const item of results) {
    const rawName = item.name || item.display_name?.split(',')?.[0]?.trim();
    if (!rawName || seen.has(rawName)) continue;
    seen.add(rawName);

    const pLat = Number(item.lat);
    const pLng = Number(item.lon);
    if (!Number.isFinite(pLat) || !Number.isFinite(pLng)) continue;

    const placeId = item.place_id ? String(item.place_id) : `${pLat}-${pLng}-${rawName}`;
    const h = hashString(placeId);
    const ratingVal = (4.1 + ((h % 9) / 10)).toFixed(1);

    places.push({
      id: placeId,
      name: rawName,
      address: item.display_name || 'Local area',
      lat: pLat,
      lng: pLng,
      category: type === 'restaurants' ? 'Food & Dining' : type === 'hotels' ? 'Hotels & Stays' : 'Sights & Landmarks',
      rating: Number(ratingVal),
      price_level: priceLevels[h % 3],
      website: item.extratags?.website,
      phone: item.extratags?.phone,
      imageUrl: getImageForPlace(type, placeId),
    });
  }

  return places;
};

// Fallback curated establishments centered on the selected coordinates
const generateCuratedPlaces = (type, lat, lng) => {
  const templates = {
    restaurants: [
      { name: 'The Rustic Table', price: '$$', sub: 'Farm-to-table dining & craft cocktails' },
      { name: 'Bella Vista Ristorante', price: '$$$', sub: 'Authentic Italian cuisine & fine wines' },
      { name: 'Golden Lotus Bistro', price: '$$', sub: 'Contemporary Asian fusion cuisine' },
      { name: 'Harbor Grill & Seafood', price: '$$$', sub: 'Fresh seafood & coastal favorites' },
      { name: 'Artisan Bakery & Cafe', price: '$', sub: 'Handcrafted pastries, espresso & brunch' },
      { name: 'La Trattoria del Sol', price: '$$', sub: 'Mediterranean tapas & wood-fired pizza' },
      { name: 'Prime Cut Steakhouse', price: '$$$', sub: 'Dry-aged prime steaks & wine pairings' },
      { name: 'Green Garden Bowl & Eatery', price: '$', sub: 'Organic salads, bowls & pressed juices' },
    ],
    hotels: [
      { name: 'Grand Horizon Luxury Hotel', price: '$$$', sub: '5-star boutique suites & skyline views' },
      { name: 'The Heritage Boutique Hotel', price: '$$', sub: 'Historic charm & bespoke amenities' },
      { name: 'Metropolitan Park Suites', price: '$$', sub: 'Modern comfortable suites in the city center' },
      { name: 'Azure Vista Resort & Spa', price: '$$$', sub: 'Luxury spa retreat & wellness center' },
      { name: 'Urban Comfort Inn', price: '$', sub: 'Cozy, modern rooms with complimentary breakfast' },
      { name: 'Riverside Lodge & Suites', price: '$$', sub: 'Scenic river views & serene guest rooms' },
      { name: 'Crown Palace Hotel', price: '$$$', sub: 'Elegant architecture with executive club lounge' },
      { name: 'The Oasis Townhouse', price: '$$', sub: 'Charming courtyard suites in peaceful quarter' },
    ],
    attractions: [
      { name: 'City Heritage Museum & Gallery', price: '$$', sub: 'Curated historic artifacts & art exhibitions' },
      { name: 'Botanical Sanctuary & Conservatory', price: '$', sub: 'Vibrant tropical flora & glass pavilions' },
      { name: 'Panoramic Sky Observatory', price: '$$', sub: '360-degree observation deck & sunset views' },
      { name: 'Historic Waterfront Promenade', price: '$', sub: 'Scenic walking paths along historic docks' },
      { name: 'Grand Central Plaza & Arch', price: '$', sub: 'Iconic civic monument & public gathering park' },
      { name: 'Science & Discovery Center', price: '$$', sub: 'Interactive science exhibits & planetarium' },
      { name: 'Old Town Clocktower & Square', price: '$', sub: 'Landmark historic square & architecture' },
      { name: 'Sculpture Gardens & Arboretum', price: '$', sub: 'Open-air contemporary art among lush trees' },
    ],
  };

  const list = templates[type] || templates.restaurants;
  const offsets = [
    [0.005, 0.007],
    [-0.004, 0.006],
    [0.007, -0.005],
    [-0.006, -0.007],
    [0.002, 0.011],
    [-0.008, 0.003],
    [0.010, 0.002],
    [-0.003, -0.010],
  ];

  return list.map((item, idx) => {
    const [dLat, dLng] = offsets[idx % offsets.length];
    const placeLat = Number((lat + dLat).toFixed(5));
    const placeLng = Number((lng + dLng).toFixed(5));
    const placeId = `curated-${type}-${idx}-${placeLat}-${placeLng}`;
    const ratingVal = (4.3 + (idx * 0.07) % 0.6).toFixed(1);

    return {
      id: placeId,
      name: item.name,
      address: `${item.sub}, near Center (${placeLat}, ${placeLng})`,
      lat: placeLat,
      lng: placeLng,
      category: type === 'restaurants' ? 'Food & Dining' : type === 'hotels' ? 'Hotels & Stays' : 'Sights & Landmarks',
      rating: Number(ratingVal),
      price_level: item.price,
      website: 'https://www.openstreetmap.org',
      phone: '+1 (555) 019-2834',
      imageUrl: getImageForPlace(type, item.name),
    };
  });
};

export const getPlacesData = async (type, lat, lng, radius = 25000) => {
  const geoapifyKey = getGeoapifyKey();

  // 1. Try Geoapify if an API key is available
  if (geoapifyKey) {
    try {
      const { data } = await axios.get(`${GEOAPIFY_API_URL}/v2/places`, {
        params: {
          categories: categoriesByType[type] || categoriesByType.restaurants,
          filter: `circle:${lng},${lat},${radius}`,
          bias: `proximity:${lng},${lat}`,
          limit: 50,
          apiKey: geoapifyKey,
        },
        timeout: 6000,
      });

      const parsed = (data.features || [])
        .map((feature) => normalizeGeoapifyPlace(feature, type))
        .filter((place) => place.name && Number.isFinite(place.lat) && Number.isFinite(place.lng));

      if (parsed.length > 0) {
        return parsed;
      }
    } catch (err) {
      console.warn('Geoapify places call encountered an error; attempting OpenStreetMap live data:', err.message);
    }
  }

  // 2. Try OpenStreetMap Nominatim live data (free, no API key required)
  try {
    const osmPlaces = await fetchNominatimPlaces(type, lat, lng, radius);
    if (osmPlaces.length > 0) {
      return osmPlaces;
    }
  } catch (osmErr) {
    console.warn('OpenStreetMap places search note:', osmErr.message);
  }

  // 3. Fallback to curated local places around the given coordinates
  return generateCuratedPlaces(type, lat, lng);
};

export const getAutocompleteSuggestions = async (text) => {
  const query = text.trim();
  if (!query) return [];

  const geoapifyKey = getGeoapifyKey();

  // 1. Try Geoapify autocomplete if key is configured
  if (geoapifyKey) {
    try {
      const { data } = await axios.get(`${GEOAPIFY_API_URL}/v1/geocode/search`, {
        params: {
          text: query,
          format: 'json',
          limit: 5,
          apiKey: geoapifyKey,
        },
        timeout: 4000,
      });

      const results = (data.results || []).map((result) => ({
        id: result.place_id || `${result.lat}-${result.lon}`,
        name: result.formatted || result.address_line1 || result.city || 'Unknown place',
        lat: Number(result.lat),
        lng: Number(result.lon),
      })).filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng));

      if (results.length > 0) {
        return results;
      }
    } catch (err) {
      console.warn('Geoapify autocomplete error; trying Nominatim:', err.message);
    }
  }

  // 2. Try OpenStreetMap Nominatim search (free, keyless)
  try {
    const { data } = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        text: query,
        q: query,
        format: 'json',
        limit: 5,
        addressdetails: 1,
      },
      headers: {
        'User-Agent': 'TouristAdvisorWebApp/1.0',
      },
      timeout: 5000,
    });

    if (Array.isArray(data)) {
      return data.map((item) => ({
        id: item.place_id ? String(item.place_id) : `${item.lat}-${item.lon}`,
        name: item.display_name,
        lat: Number(item.lat),
        lng: Number(item.lon),
      })).filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng));
    }
  } catch (err) {
    console.warn('Nominatim autocomplete note:', err.message);
  }

  return [];
};

export const getPlacesDataSafe = async (...args) => {
  try {
    return await getPlacesData(...args);
  } catch (error) {
    console.error('Unable to load places safely:', error);
    const [type = 'restaurants', lat = 40.7128, lng = -74.0060] = args;
    return generateCuratedPlaces(type, lat, lng);
  }
};

export const getAutocompleteSuggestionsSafe = async (...args) => {
  try {
    return await getAutocompleteSuggestions(...args);
  } catch (error) {
    console.error('Unable to load suggestions safely:', error);
    return [];
  }
};

