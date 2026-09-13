import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Tabs,
  Tab,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Chip,
  CircularProgress,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PersonIcon from '@mui/icons-material/Person';
import { loginUser, registerUser, isFirebaseConfigured } from '../../config/firebase';

const AuthModal = ({ open, onClose, onAuthSuccess, initialRole = 'seller' }) => {
  const [tabIndex, setTabIndex] = useState(0); // 0: Login, 1: Sign Up
  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const firebaseConnected = isFirebaseConfigured();

  const handleTabChange = (event, newIndex) => {
    setTabIndex(newIndex);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tabIndex === 0) {
        // Sign In
        if (!email || !password) {
          throw new Error('Please enter both email and password.');
        }
        const user = await loginUser(email, password);
        onAuthSuccess(user);
        onClose();
      } else {
        // Sign Up
        if (!email || !password || !displayName) {
          throw new Error('Please fill in your name, email, and password.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        if (role === 'seller' && !shopName) {
          throw new Error('Please enter your Shop or Studio Name.');
        }
        const user = await registerUser({
          email,
          password,
          displayName,
          role,
          phone,
          shopName: role === 'seller' ? shopName : '',
        });
        onAuthSuccess(user);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoRole) => {
    setError('');
    setLoading(true);
    try {
      const demoEmail = demoRole === 'seller' ? 'artisan@localcrafts.com' : 'traveler@guide.com';
      const demoUser = await registerUser({
        email: demoEmail,
        password: 'password123',
        displayName: demoRole === 'seller' ? 'Rajesh Kumar (Artisan)' : 'Sarah Jenkins',
        role: demoRole,
        phone: demoRole === 'seller' ? '+1 (555) 019-2834' : '+1 (555) 982-1100',
        shopName: demoRole === 'seller' ? 'Heritage Woodcrafts & Silks' : '',
      }).catch(async () => {
        return await loginUser(demoEmail, 'password123');
      });

      onAuthSuccess(demoUser);
      onClose();
    } catch (err) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LockOutlinedIcon />
          </Box>
        </Box>
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          Marketplace Authentication
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {tabIndex === 0
            ? 'Sign in to access marketplace'
            : 'Create your account to browse or sell local crafts'}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Chip
            size="small"
            label={firebaseConnected ? 'Signed In / Signed Up' : 'Firebase: Demo Mode (Keys can be added)'}
            color={firebaseConnected ? 'success' : 'info'}
            variant="outlined"
          />
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
        <Tabs value={tabIndex} onChange={handleTabChange} variant="fullWidth">
          <Tab label="Sign In" />
          <Tab label="Register" />
        </Tabs>
      </Box>

      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} id="auth-form">
          {tabIndex === 1 && (
            <Box sx={{ mb: 2 }}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  I am joining as:
                </FormLabel>
                <RadioGroup row value={role} onChange={(e) => setRole(e.target.value)}>
                  <FormControlLabel
                    value="seller"
                    control={<Radio size="small" />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.9rem' }}>
                        <StorefrontIcon fontSize="small" /> Local Seller
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="buyer"
                    control={<Radio size="small" />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.9rem' }}>
                        <PersonIcon fontSize="small" /> Tourist / Buyer
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>

              <TextField
                margin="dense"
                label="Full Name"
                fullWidth
                size="small"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />

              {role === 'seller' && (
                <>
                  <TextField
                    margin="dense"
                    label="Shop / Studio Name"
                    fullWidth
                    size="small"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    required
                    helperText="Name displayed on all your product listings"
                  />
                  <TextField
                    margin="dense"
                    label="Phone Number (for customer contact)"
                    fullWidth
                    size="small"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    helperText="Saved to profile so you don't re-type for each product"
                  />
                </>
              )}
            </Box>
          )}

          <TextField
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            size="small"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            size="small"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            helperText={tabIndex === 1 ? 'Minimum 6 characters' : ''}
          />
        </form>

        <Box sx={{ mt: 2, pt: 1, borderTop: '1px dashed #e0e0e0' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, textAlign: 'center' }}>
            Instant Testing
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              onClick={() => handleQuickDemoLogin('seller')}
              startIcon={<StorefrontIcon />}
              disabled={loading}
              sx={{ textTransform: 'none', fontSize: '0.78rem' }}
            >
              Demo Seller
            </Button>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              onClick={() => handleQuickDemoLogin('buyer')}
              startIcon={<PersonIcon />}
              disabled={loading}
              sx={{ textTransform: 'none', fontSize: '0.78rem' }}
            >
              Demo Tourist
            </Button>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="auth-form"
          variant="contained"
          disabled={loading}
          sx={{ minWidth: 100 }}
        >
          {loading ? <CircularProgress size={22} color="inherit" /> : tabIndex === 0 ? 'Sign In' : 'Create Account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuthModal;
