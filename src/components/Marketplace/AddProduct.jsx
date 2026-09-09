import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  CircularProgress,
  Alert,
  LinearProgress,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PhoneIcon from '@mui/icons-material/Phone';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import ImageIcon from '@mui/icons-material/Image';

import { createMarketplaceProduct, updateUserProfile, isFirebaseConfigured } from '../../config/firebase';
import { uploadMediaFile, isAppwriteConfigured } from '../../config/appwrite';

const CATEGORIES = [
  'Handicrafts & Art',
  'Local Foods & Spices',
  'Textiles & Wearables',
  'Antiques & Pottery',
  'Souvenirs & Gifts',
  'Jewelry & Gems',
  'Herbal & Wellness',
];

const AddProduct = ({ currentUser, currentCoords, currentPlaceName, onBack, onProductCreated }) => {
  const [shopName, setShopName] = useState(currentUser?.shopName || '');
  const [sellerPhone, setSellerPhone] = useState(currentUser?.phone || '');
  const [locationName, setLocationName] = useState(currentPlaceName || 'Local Craft Market');
  const [lat, setLat] = useState(currentCoords?.lat || 40.7128);
  const [lng, setLng] = useState(currentCoords?.lng || -74.0060);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Product fields
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [category, setCategory] = useState('Handicrafts & Art');
  const [description, setDescription] = useState('');

  // Media upload state
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef(null);

  // If user profile updates later, populate fields
  useEffect(() => {
    if (currentUser?.shopName && !shopName) setShopName(currentUser.shopName);
    if (currentUser?.phone && !sellerPhone) setSellerPhone(currentUser.phone);
  }, [currentUser, shopName, sellerPhone]);

  // Handle GPS auto-detect
  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const detectedLat = position.coords.latitude;
        const detectedLng = position.coords.longitude;
        setLat(detectedLat);
        setLng(detectedLng);
        setLocationName(`Current Location (${detectedLat.toFixed(3)}, ${detectedLng.toFixed(3)})`);
        setIsDetectingLocation(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setError('Could not detect GPS location automatically. Please type your location manually.');
        setIsDetectingLocation(false);
      },
      { timeout: 8000 }
    );
  };

  const handleFileSelected = (file) => {
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      setError('Please upload a valid image (JPG, PNG, WebP) or video (MP4, WebM) file.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit.');
      return;
    }

    setError('');
    setMediaFile(file);
    setMediaType(isVideo ? 'video' : 'image');

    const previewUrl = URL.createObjectURL(file);
    setMediaPreview(previewUrl);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const removeMedia = () => {
    if (mediaPreview && mediaPreview.startsWith('blob:')) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaFile(null);
    setMediaPreview(null);
    setUploadProgress(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please enter the product title.');
      return;
    }
    if (!price || isNaN(Number(price))) {
      setError('Please enter a valid price.');
      return;
    }
    if (!shopName.trim()) {
      setError('Please enter your shop or studio name.');
      return;
    }
    if (!sellerPhone.trim()) {
      setError('Please provide a contact phone number so buyers can reach you.');
      return;
    }

    setSubmitting(true);
    setUploadProgress(10);

    try {
      let finalMediaUrl = 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80';
      let finalMediaType = 'image';

      if (mediaFile) {
        setUploadProgress(30);
        const uploadResult = await uploadMediaFile(mediaFile, (pct) => {
          setUploadProgress(30 + Math.round(pct * 0.5));
        });
        finalMediaUrl = uploadResult.url;
        finalMediaType = uploadResult.mediaType;
      }

      setUploadProgress(85);

      // 1. Save product to Firebase Firestore
      const newProduct = await createMarketplaceProduct({
        title: title.trim(),
        price: parseFloat(price),
        currency,
        category,
        description: description.trim(),
        shopName: shopName.trim(),
        sellerPhone: sellerPhone.trim(),
        sellerName: currentUser?.displayName || 'Local Artisan',
        sellerUid: currentUser?.uid || 'anonymous',
        locationName: locationName.trim(),
        lat: Number(lat),
        lng: Number(lng),
        mediaUrl: finalMediaUrl,
        mediaType: finalMediaType,
      });

      // 2. Persist shop name and phone number to user's profile in Firebase
      // so the seller never has to re-type them for subsequent products!
      if (currentUser?.uid) {
        await updateUserProfile(currentUser.uid, {
          shopName: shopName.trim(),
          phone: sellerPhone.trim(),
        });
      }

      setUploadProgress(100);
      setSuccess(true);

      setTimeout(() => {
        onProductCreated(newProduct);
      }, 800);
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err.message || 'Failed to publish product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const appwriteLive = isAppwriteConfigured();
  const firebaseLive = isFirebaseConfigured();

  return (
    <Box sx={{ maxWidth: 840, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          variant="outlined"
          size="small"
          sx={{ textTransform: 'none' }}
        >
          Back to Marketplace
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            size="small"
            label={firebaseLive ? 'Database: Firebase Live' : 'Database: Firebase (Keys pending)'}
            color={firebaseLive ? 'success' : 'default'}
            variant="outlined"
          />
          <Chip
            size="small"
            label={appwriteLive ? 'Media: Appwrite Live' : 'Media: Appwrite (Keys pending)'}
            color={appwriteLive ? 'success' : 'default'}
            variant="outlined"
          />
        </Box>
      </Box>

      <Paper elevation={2} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: 'text.primary' }}>
            List a Product in Local Marketplace
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Promote your authentic crafts, local street specialties, souvenirs, and art to travelers and locals nearby.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 3 }}>
            Product published successfully! Redirecting to marketplace...
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Seller / Store Information */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <StorefrontIcon color="primary" /> Shop & Contact Details
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Shop / Studio Name"
                  fullWidth
                  size="small"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Kashmiri Loom House"
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Seller Phone Number (Auto-saved)"
                  fullWidth
                  size="small"
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                  placeholder="+1 (555) 012-3456"
                  required
                  helperText="Saved in your profile — no need to re-type each time!"
                  InputProps={{
                    startAdornment: <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Location Detection Section */}
          <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Store Location / Landmark
              </Typography>
              <Button
                size="small"
                variant="outlined"
                color="secondary"
                startIcon={isDetectingLocation ? <CircularProgress size={16} /> : <MyLocationIcon />}
                onClick={handleAutoDetectLocation}
                disabled={isDetectingLocation}
                sx={{ textTransform: 'none' }}
              >
                Auto-detect GPS Location
              </Button>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Location Name / Area / Landmark"
                  fullWidth
                  size="small"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g., Old Market Square, Stall 14"
                  required
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  label="Latitude"
                  type="number"
                  fullWidth
                  size="small"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  inputProps={{ step: 'any' }}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  label="Longitude"
                  type="number"
                  fullWidth
                  size="small"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  inputProps={{ step: 'any' }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Product Media Upload (Appwrite Storage) */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Product Image / Video (Powered by Appwrite Storage)
            </Typography>

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileSelected(e.target.files?.[0])}
              accept="image/*,video/*"
              style={{ display: 'none' }}
            />

            {!mediaPreview ? (
              <Box
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  border: '2px dashed',
                  borderColor: isDragging ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  bgcolor: isDragging ? 'action.hover' : 'background.paper',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 48, color: isDragging ? 'primary.main' : 'text.secondary', mb: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Drag & Drop Product Image or Video here
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  or click to browse from device (JPG, PNG, WebP, MP4, WebM up to 50MB)
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  position: 'relative',
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: 'black',
                  maxHeight: 360,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {mediaType === 'video' ? (
                  <video
                    src={mediaPreview}
                    controls
                    style={{ maxHeight: 360, maxWidth: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    style={{ maxHeight: 360, maxWidth: '100%', objectFit: 'contain' }}
                  />
                )}

                <Tooltip title="Remove and choose another">
                  <IconButton
                    onClick={removeMedia}
                    sx={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      bgcolor: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.8)' },
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>

                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 10,
                    left: 10,
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.8,
                    fontSize: '0.8rem',
                  }}
                >
                  {mediaType === 'video' ? <VideoLibraryIcon fontSize="small" /> : <ImageIcon fontSize="small" />}
                  {mediaFile?.name}
                </Box>
              </Box>
            )}

            {submitting && uploadProgress > 0 && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Uploading media to Appwrite Storage & saving details...
                  </Typography>
                  <Typography variant="caption" fontWeight="bold">
                    {uploadProgress}%
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 6, borderRadius: 1 }} />
              </Box>
            )}
          </Box>

          {/* Product Details */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Product Title"
                fullWidth
                size="small"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Hand-Carved Rosewood Jewelry Box"
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Category"
                fullWidth
                size="small"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 8, sm: 4 }}>
              <TextField
                label="Price"
                type="number"
                fullWidth
                size="small"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="25.00"
                required
                inputProps={{ min: '0', step: '0.01' }}
              />
            </Grid>

            <Grid size={{ xs: 4, sm: 2 }}>
              <TextField
                select
                label="Currency"
                fullWidth
                size="small"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <MenuItem value="USD">USD ($)</MenuItem>
                <MenuItem value="EUR">EUR (€)</MenuItem>
                <MenuItem value="INR">INR (₹)</MenuItem>
                <MenuItem value="GBP">GBP (£)</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Description & Artisan Craft Story"
                fullWidth
                multiline
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe how this product was made, the materials used, cultural heritage, or custom requests available..."
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button variant="outlined" color="inherit" onClick={onBack} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={submitting}
              sx={{ minWidth: 180 }}
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : 'Publish to Marketplace'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default AddProduct;
