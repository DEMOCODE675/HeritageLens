import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Tooltip,
  Paper,
  Badge,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PlaceIcon from '@mui/icons-material/Place';
import PhoneIcon from '@mui/icons-material/Phone';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import FilterListIcon from '@mui/icons-material/FilterList';
import MapIcon from '@mui/icons-material/Map';

import {
  fetchMarketplaceProducts,
  getFavorites,
  toggleFavorite,
  isFirebaseConfigured,
} from '../../config/firebase';
import ProductDetailModal from './ProductDetailModal';

const CATEGORIES = [
  'All',
  'Handicrafts & Art',
  'Local Foods & Spices',
  'Textiles & Wearables',
  'Antiques & Pottery',
  'Souvenirs & Gifts',
  'Jewelry & Gems',
];

// Calculate approximate distance between two lat/lng points in kilometers
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

const formatCurrency = (amount, curr = 'USD') => {
  if (curr === 'INR') return `₹${amount}`;
  if (curr === 'EUR') return `€${amount}`;
  if (curr === 'GBP') return `£${amount}`;
  return `$${amount}`;
};

const Marketplace = ({
  currentUser,
  currentCoords,
  currentPlaceName,
  onNavigateToAddProduct,
  onOpenAuth,
  onViewStoreOnMap,
}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showOnlyLiked, setShowOnlyLiked] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Load products & favorites
  const loadData = async () => {
    setLoading(true);
    try {
      const items = await fetchMarketplaceProducts();
      setProducts(items);
      setFavorites(getFavorites());
    } catch (err) {
      console.error('Failed to load marketplace products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentCoords]);

  const handleToggleLike = (productId, e) => {
    if (e) e.stopPropagation();
    const updated = toggleFavorite(productId);
    setFavorites(updated);
  };

  const handleCreateClick = () => {
    if (!currentUser) {
      onOpenAuth();
    } else {
      onNavigateToAddProduct();
    }
  };

  // Filter products based on category, search filter, and liked toggle
  const filteredProducts = products.filter((item) => {
    if (showOnlyLiked && !favorites.includes(item.id)) {
      return false;
    }
    if (selectedCategory !== 'All' && item.category !== selectedCategory) {
      return false;
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchShop = item.shopName?.toLowerCase().includes(q);
      const matchLocation = item.locationName?.toLowerCase().includes(q);
      const matchCategory = item.category?.toLowerCase().includes(q);
      return matchTitle || matchShop || matchLocation || matchCategory;
    }
    return true;
  });

  return (
    <Box sx={{ maxWidth: 1300, mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Upper Top Bar with Create (+) and Like (❤️) controls */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 800, color: 'text.primary' }}>
            Local Marketplace & Artisans
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <PlaceIcon fontSize="small" color="primary" />
            Stores & crafts near: <strong style={{ color: '#1976d2' }}>{currentPlaceName || 'Selected Location'}</strong>
          </Typography>
        </Box>

        {/* Action Controls: Like Button + Create Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Like filter button in upper top */}
          <Tooltip title={showOnlyLiked ? 'Show all products' : 'Show liked / favorite items'}>
            <Button
              variant={showOnlyLiked ? 'contained' : 'outlined'}
              color="error"
              onClick={() => setShowOnlyLiked(!showOnlyLiked)}
              startIcon={
                <Badge badgeContent={favorites.length} color="error" invisible={favorites.length === 0}>
                  <FavoriteIcon />
                </Badge>
              }
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {showOnlyLiked ? 'Showing Liked' : 'Favorites'}
            </Button>
          </Tooltip>

          {/* Create + button in upper top */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateClick}
            startIcon={<AddIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              boxShadow: 2,
              px: 2.5,
              py: 1,
            }}
          >
            Create / Add Product
          </Button>
        </Box>
      </Paper>

      {/* Filter and Search Bar */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Filter by product, shop name, or specialty..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          sx={{ width: { xs: '100%', md: 360 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />

        {/* Category Chips */}
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', width: '100%', py: 0.5 }}>
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              clickable
              color={selectedCategory === cat ? 'primary' : 'default'}
              variant={selectedCategory === cat ? 'filled' : 'outlined'}
              onClick={() => setSelectedCategory(cat)}
              sx={{ fontWeight: 500 }}
            />
          ))}
        </Box>
      </Box>

      {/* Product List Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredProducts.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2, bgcolor: 'background.paper' }}>
          <StorefrontIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {showOnlyLiked ? 'No favorite products yet.' : 'No products found for this location or filter.'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            {showOnlyLiked
              ? 'Click the heart icon on any product to save it to your favorites.'
              : 'Be the first local seller to list products in this marketplace!'}
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateClick} sx={{ textTransform: 'none' }}>
            List a Product Here
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredProducts.map((product) => {
            const isLiked = favorites.includes(product.id);
            const dist = getDistanceFromLatLonInKm(
              currentCoords?.lat,
              currentCoords?.lng,
              product.lat,
              product.lng
            );

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => setSelectedProduct(product)}
                >
                  {/* Media preview */}
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={
                        product.mediaType === 'video'
                          ? 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80'
                          : product.mediaUrl
                      }
                      alt={product.title}
                      sx={{ objectFit: 'cover' }}
                    />

                    {product.mediaType === 'video' && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          bgcolor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          borderRadius: 1,
                          px: 1,
                          py: 0.3,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          fontSize: '0.75rem',
                        }}
                      >
                        <PlayCircleIcon fontSize="small" /> Video
                      </Box>
                    )}

                    {/* Upper Like Button on card */}
                    <IconButton
                      onClick={(e) => handleToggleLike(product.id, e)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(255, 255, 255, 0.85)',
                        '&:hover': { bgcolor: 'white' },
                        color: isLiked ? 'error.main' : 'grey.600',
                      }}
                      size="small"
                    >
                      {isLiked ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                    </IconButton>

                    {dist && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          left: 8,
                          bgcolor: 'rgba(0, 0, 0, 0.75)',
                          color: 'white',
                          borderRadius: 1,
                          px: 1,
                          py: 0.3,
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        <PlaceIcon sx={{ fontSize: 13 }} /> ~{dist} km away
                      </Box>
                    )}
                  </Box>

                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Chip label={product.category || 'Craft'} size="small" sx={{ fontSize: '0.7rem', height: 20 }} />
                      <Typography variant="h6" color="primary.main" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
                        {formatCurrency(product.price, product.currency)}
                      </Typography>
                    </Box>

                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        lineHeight: 1.3,
                        mb: 0.8,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {product.title}
                    </Typography>

                    {/* Interactive Seller Store Location Box */}
                    <Box
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onViewStoreOnMap) onViewStoreOnMap(product);
                      }}
                      sx={{
                        mt: 1,
                        p: 1.2,
                        borderRadius: 1.5,
                        bgcolor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: '#dcfce7',
                          borderColor: '#4ade80',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 6px rgba(16,185,129,0.2)',
                        },
                      }}
                      title="Click to view store on location map"
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.3 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: '#166534',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <StorefrontIcon sx={{ fontSize: 16, color: '#15803d' }} />
                          <span>{product.shopName}</span>
                        </Typography>
                        <Chip
                          size="small"
                          icon={<PlaceIcon sx={{ fontSize: '12px !important' }} />}
                          label="Map"
                          color="success"
                          sx={{
                            height: 20,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            bgcolor: '#059669',
                            color: '#fff',
                            cursor: 'pointer',
                            '& .MuiChip-icon': { color: '#fff' },
                          }}
                        />
                      </Box>

                      <Typography
                        variant="caption"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.4,
                          color: '#475569',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <PlaceIcon sx={{ fontSize: 13, color: '#64748b' }} />
                        {product.locationName}
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', gap: 0.8 }}>
                      {product.sellerPhone && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PhoneIcon />}
                          href={`tel:${product.sellerPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          sx={{ textTransform: 'none', fontSize: '0.75rem', px: 1 }}
                        >
                          Call
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        startIcon={<PlaceIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onViewStoreOnMap) onViewStoreOnMap(product);
                        }}
                        sx={{ textTransform: 'none', fontSize: '0.75rem', px: 1, fontWeight: 600 }}
                      >
                        Map
                      </Button>
                    </Box>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => setSelectedProduct(product)}
                      sx={{ textTransform: 'none', fontWeight: 600, ml: 'auto' }}
                    >
                      Details →
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        open={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        isLiked={selectedProduct ? favorites.includes(selectedProduct.id) : false}
        onToggleLike={handleToggleLike}
        onViewStoreOnMap={onViewStoreOnMap}
      />
    </Box>
  );
};

export default Marketplace;
