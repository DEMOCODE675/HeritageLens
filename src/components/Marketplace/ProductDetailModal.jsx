import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PlaceIcon from '@mui/icons-material/Place';
import MapIcon from '@mui/icons-material/Map';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const formatCurrency = (amount, curr = 'USD') => {
  if (curr === 'INR') return `₹${amount}`;
  if (curr === 'EUR') return `€${amount}`;
  if (curr === 'GBP') return `£${amount}`;
  return `$${amount}`;
};

const ProductDetailModal = ({ product, open, onClose, isLiked, onToggleLike, onViewStoreOnMap }) => {
  if (!product) return null;

  const cleanPhone = product.sellerPhone ? product.sellerPhone.replace(/[^0-9]/g, '') : '';
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Hi! I saw your product "${product.title}" from "${product.shopName}" on Tourist Guide Marketplace and would like to know more.`
      )}`
    : null;

  const osmUrl = (product.lat && product.lng)
    ? `https://www.openstreetmap.org/?mlat=${product.lat}&mlon=${product.lng}#map=17/${product.lat}/${product.lng}`
    : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, pr: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.title}
        </Typography>
        <IconButton aria-label="close" onClick={onClose} sx={{ color: 'grey.500' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {/* Media Player / Image */}
        <Box sx={{ width: '100%', bgcolor: 'black', maxHeight: 380, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
          {product.mediaType === 'video' ? (
            <video
              src={product.mediaUrl}
              controls
              autoPlay
              style={{ maxHeight: 380, maxWidth: '100%', objectFit: 'contain' }}
            />
          ) : (
            <img
              src={product.mediaUrl}
              alt={product.title}
              style={{ maxHeight: 380, width: '100%', objectFit: 'cover' }}
            />
          )}
        </Box>

        <Box sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
            <Box>
              <Chip label={product.category || 'Local Craft'} size="small" color="primary" variant="outlined" sx={{ mb: 1 }} />
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 800 }}>
                {formatCurrency(product.price, product.currency)}
              </Typography>
            </Box>

            <IconButton
              onClick={() => onToggleLike(product.id)}
              color={isLiked ? 'error' : 'default'}
              sx={{ bgcolor: 'action.hover' }}
            >
              {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* Shop & Location Information with Store Location Map Feature */}
          <Box sx={{ p: 2, bgcolor: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: 1 }}>
                <StorefrontIcon color="success" /> {product.shopName}
              </Typography>
              <Chip
                size="small"
                label="Verified Store"
                color="success"
                sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }}
              />
            </Box>

            <Typography variant="body2" sx={{ color: '#334155', display: 'flex', alignItems: 'center', gap: 0.8, mt: 1 }}>
              <PlaceIcon fontSize="small" sx={{ color: '#15803d' }} /> {product.locationName}
            </Typography>

            {product.sellerName && (
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, pl: 3.5, color: '#64748b' }}>
                Seller / Artisan: <strong>{product.sellerName}</strong>
              </Typography>
            )}

            {/* Click to move to location map button */}
            <Box sx={{ mt: 1.8, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<MapIcon />}
                onClick={() => {
                  onClose();
                  if (onViewStoreOnMap) {
                    onViewStoreOnMap(product);
                  }
                }}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  bgcolor: '#059669',
                  '&:hover': { bgcolor: '#047857' },
                  boxShadow: '0 2px 8px rgba(5,150,105,0.3)',
                }}
              >
                Move to Store on Map
              </Button>

              {osmUrl && (
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  href={osmUrl}
                  target="_blank"
                  rel="noreferrer"
                  startIcon={<OpenInNewIcon fontSize="small" />}
                  sx={{ textTransform: 'none', fontSize: '0.8rem', borderColor: '#cbd5e1' }}
                >
                  External Map
                </Button>
              )}
            </Box>
          </Box>

          {/* Description / Story */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            About this Craft / Product:
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 2.5 }}>
            {product.description || 'Authentic local product handcrafted with regional traditions. Direct from certified regional sellers.'}
          </Typography>

          {/* Contact Seller Options */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Direct Seller Contact:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {product.sellerPhone && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PhoneIcon />}
                href={`tel:${product.sellerPhone}`}
                sx={{ textTransform: 'none', flexGrow: 1 }}
              >
                Call: {product.sellerPhone}
              </Button>
            )}

            {whatsappUrl && (
              <Button
                variant="contained"
                sx={{
                  bgcolor: '#25D366',
                  color: 'white',
                  textTransform: 'none',
                  flexGrow: 1,
                  '&:hover': { bgcolor: '#1ebe5d' },
                }}
                startIcon={<WhatsAppIcon />}
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp Seller
              </Button>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductDetailModal;
