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
  Alert,
  Tabs,
  Tab,
  Chip,
  Divider,
} from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { getFirebaseConfig, isFirebaseConfigured, reloadFirebaseWithConfig } from '../../config/firebase';
import { getAppwriteConfig, isAppwriteConfigured, reloadAppwriteWithConfig } from '../../config/appwrite';

const ConfigModal = ({ open, onClose }) => {
  const [tabIndex, setTabIndex] = useState(0);

  // Firebase fields
  const currentFb = getFirebaseConfig();
  const [fbApiKey, setFbApiKey] = useState(currentFb.apiKey || '');
  const [fbAuthDomain, setFbAuthDomain] = useState(currentFb.authDomain || '');
  const [fbProjectId, setFbProjectId] = useState(currentFb.projectId || '');
  const [fbStorageBucket, setFbStorageBucket] = useState(currentFb.storageBucket || '');
  const [fbSenderId, setFbSenderId] = useState(currentFb.messagingSenderId || '');
  const [fbAppId, setFbAppId] = useState(currentFb.appId || '');

  // Appwrite fields
  const currentAw = getAppwriteConfig();
  const [awEndpoint, setAwEndpoint] = useState(currentAw.endpoint || 'https://cloud.appwrite.io/v1');
  const [awProjectId, setAwProjectId] = useState(currentAw.projectId || '');
  const [awBucketId, setAwBucketId] = useState(currentAw.bucketId || '');

  const [savedMessage, setSavedMessage] = useState('');

  const fbConnected = isFirebaseConfigured();
  const awConnected = isAppwriteConfigured();

  const handleSaveFirebase = () => {
    const config = {
      apiKey: fbApiKey.trim(),
      authDomain: fbAuthDomain.trim(),
      projectId: fbProjectId.trim(),
      storageBucket: fbStorageBucket.trim(),
      messagingSenderId: fbSenderId.trim(),
      appId: fbAppId.trim(),
    };
    reloadFirebaseWithConfig(config);
  };

  const handleResetFirebase = () => {
    reloadFirebaseWithConfig(null);
  };

  const handleSaveAppwrite = () => {
    const config = {
      endpoint: awEndpoint.trim(),
      projectId: awProjectId.trim(),
      bucketId: awBucketId.trim(),
    };
    reloadAppwriteWithConfig(config);
  };

  const handleResetAppwrite = () => {
    reloadAppwriteWithConfig(null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <KeyIcon color="primary" />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            API Keys & Backend Integration
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Configure live Firebase (Auth & Firestore) and Appwrite (Media Storage) keys
          </Typography>
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
        <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} variant="fullWidth">
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                Firebase (Auth & DB)
                {fbConnected && <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />}
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                Appwrite (Media Storage)
                {awConnected && <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />}
              </Box>
            }
          />
        </Tabs>
      </Box>

      <DialogContent sx={{ pt: 2.5 }}>
        {tabIndex === 0 ? (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Firebase Web Credentials
              </Typography>
              <Chip
                size="small"
                label={fbConnected ? 'Connected to Firebase' : 'Using Demo Mock Database'}
                color={fbConnected ? 'success' : 'default'}
              />
            </Box>

            <Alert severity="info" sx={{ mb: 2, fontSize: '0.85rem' }}>
              You can also define these in <code>.env</code> with <code>REACT_APP_FIREBASE_API_KEY</code>, etc. Saving here applies them instantly.
            </Alert>

            <TextField
              margin="dense"
              label="API Key"
              fullWidth
              size="small"
              value={fbApiKey}
              onChange={(e) => setFbApiKey(e.target.value)}
              placeholder="AIzaSy..."
            />
            <TextField
              margin="dense"
              label="Project ID"
              fullWidth
              size="small"
              value={fbProjectId}
              onChange={(e) => setFbProjectId(e.target.value)}
              placeholder="my-tourist-project"
            />
            <TextField
              margin="dense"
              label="Auth Domain"
              fullWidth
              size="small"
              value={fbAuthDomain}
              onChange={(e) => setFbAuthDomain(e.target.value)}
              placeholder="my-tourist-project.firebaseapp.com"
            />
            <TextField
              margin="dense"
              label="Storage Bucket"
              fullWidth
              size="small"
              value={fbStorageBucket}
              onChange={(e) => setFbStorageBucket(e.target.value)}
              placeholder="my-tourist-project.appspot.com"
            />
            <TextField
              margin="dense"
              label="App ID"
              fullWidth
              size="small"
              value={fbAppId}
              onChange={(e) => setFbAppId(e.target.value)}
              placeholder="1:123456789:web:abcdef"
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button color="error" size="small" onClick={handleResetFirebase}>
                Clear Keys
              </Button>
              <Button variant="contained" onClick={handleSaveFirebase}>
                Save & Apply Firebase Keys
              </Button>
            </Box>
          </Box>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Appwrite Cloud Storage Credentials
              </Typography>
              <Chip
                size="small"
                label={awConnected ? 'Connected to Appwrite' : 'Using Local Media Converter'}
                color={awConnected ? 'success' : 'default'}
              />
            </Box>

            <Alert severity="info" sx={{ mb: 2, fontSize: '0.85rem' }}>
              Appwrite handles drag & drop product images and video uploads. Get these from your Appwrite Console project settings.
            </Alert>

            <TextField
              margin="dense"
              label="Appwrite Endpoint"
              fullWidth
              size="small"
              value={awEndpoint}
              onChange={(e) => setAwEndpoint(e.target.value)}
              placeholder="https://cloud.appwrite.io/v1"
            />
            <TextField
              margin="dense"
              label="Appwrite Project ID"
              fullWidth
              size="small"
              value={awProjectId}
              onChange={(e) => setAwProjectId(e.target.value)}
              placeholder="64a98..."
            />
            <TextField
              margin="dense"
              label="Storage Bucket ID"
              fullWidth
              size="small"
              value={awBucketId}
              onChange={(e) => setAwBucketId(e.target.value)}
              placeholder="marketplace-media"
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button color="error" size="small" onClick={handleResetAppwrite}>
                Clear Keys
              </Button>
              <Button variant="contained" onClick={handleSaveAppwrite}>
                Save & Apply Appwrite Keys
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigModal;
