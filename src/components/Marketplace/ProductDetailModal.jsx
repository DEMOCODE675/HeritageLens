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
import ShareIcon from '@mui/icons-material/Share';

const formatCurrency = (amount, curr = 'USD') => {
  if (curr === 'INR') return `₹${amount}`;
  if (curr === 'EUR') return `€${amount}`;
  if (curr === 'GBP') return `£${amount}`;
  return `$${amount}`;
};

const ProductDetailModal = ({ product, open, onClose, isLiked, onToggleLike }) => {
  if (!product) return null;

  const cleanPhone = product.sellerPhone ? product.sellerPhone.replace(/[^0-9]/g, '') : '';
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Hi! I saw your product "${product.title}" from "${product.shopName}" on Tourist Guide Marketplace and would like to know more.`
      )}`
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

          {/* Shop & Location Information */}
          <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <StorefrontIcon color="primary" /> {product.shopName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.5 }}>
              <PlaceIcon fontSize="small" color="action" /> {product.locationName}
            </Typography>
            {product.sellerName && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, pl: 3.5 }}>
                Artisan / Owner: {product.sellerName}
              </Typography>
            )}
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
