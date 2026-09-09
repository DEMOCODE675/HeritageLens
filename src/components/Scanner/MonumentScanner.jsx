import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Paper,
  CircularProgress,
  Divider,
  Alert,
  Tooltip,
  Snackbar,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import FlipCameraIosIcon from '@mui/icons-material/FlipCameraIos';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import MapIcon from '@mui/icons-material/Map';
import ShareIcon from '@mui/icons-material/Share';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PlaceIcon from '@mui/icons-material/Place';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import RestaurantIcon from '@mui/icons-material/Restaurant';

import {
  analyzeLandmarkWithGemini,
  PRESET_LANDMARKS,
  hasGeminiKey,
} from '../../api/geminiVisionApi';

const MonumentScanner = ({ onBack, onViewLocationOnMap }) => {
  // Stages: 'camera' -> 'review' -> 'analyzing' -> 'info'
  const [stage, setStage] = useState('camera');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) | 'user' (front)
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Images and Results
  const [capturedImage, setCapturedImage] = useState(null);
  const [analyzingProgress, setAnalyzingProgress] = useState(0);
  const [scanResult, setScanResult] = useState(null);

  // Audio Speech Guide
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechRef = useRef(null);

  // Copy snackbar
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // DOM Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize and stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async (mode = facingMode) => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your current browser or environment. You can upload a photo or choose a landmark sample below.');
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Camera access was blocked or unavailable on this device. You can upload a photo or click any landmark sample below to test.');
      setCameraActive(false);
    }
  }, [facingMode, stopCamera]);

  // Start camera when entering 'camera' stage
  useEffect(() => {
    if (stage === 'camera') {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [stage, facingMode, startCamera, stopCamera]);

  // Stop speech synthesis when unmounting or leaving 'info'
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Toggle front / back camera
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture current frame from live camera
  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (facingMode === 'user') {
      // Mirror front camera
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    stopCamera();
    setStage('review');
  };

  // Handle uploaded image file from device gallery / files
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        setCapturedImage(dataUrl);
        stopCamera();
        setStage('review');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle selecting a preset famous landmark
  const handleSelectPreset = (preset) => {
    setCapturedImage(preset.imageUrl);
    stopCamera();
    setStage('review');
  };

  // Cross Mark action: discard and retake photo
  const handleRetakePhoto = () => {
    setCapturedImage(null);
    setScanResult(null);
    setStage('camera');
  };

  // Correct Tick Mark action: confirm and proceed to AI analysis
  const handleConfirmAndAnalyze = async () => {
    if (!capturedImage) return;

    setStage('analyzing');
    setAnalyzingProgress(15);

    const progressTimer = setInterval(() => {
      setAnalyzingProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 15;
      });
    }, 300);

    try {
      // Check if image matches one of preset landmarks
      const matchedPreset = PRESET_LANDMARKS.find((p) => p.imageUrl === capturedImage);

      let result;
      if (matchedPreset && !hasGeminiKey()) {
        await new Promise((r) => setTimeout(r, 1000));
        result = {
          ...matchedPreset,
          isAiAnalyzed: false,
          aiModel: 'Heritage Vision Knowledge Base',
          confidence: '98%',
          detectedAt: new Date().toLocaleTimeString(),
        };
      } else {
        result = await analyzeLandmarkWithGemini(capturedImage);
      }

      clearInterval(progressTimer);
      setAnalyzingProgress(100);
      setScanResult(result);
      setStage('info');
    } catch (err) {
      clearInterval(progressTimer);
      console.error('Analysis failed:', err);
      // Fallback
      setScanResult(PRESET_LANDMARKS[0]);
      setStage('info');
    }
  };

  // Audio Tour Guide Speech Synthesis
  const handleToggleAudioGuide = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSnackbarMessage('Audio guide speech is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!scanResult) return;

    window.speechSynthesis.cancel();
    const narrationText = `Now exploring ${scanResult.title}, located in ${scanResult.location}. Built around ${scanResult.builtYearOrEra}. ${scanResult.history} Regarding its cultural significance, ${scanResult.culture}`;

    const utterance = new SpeechSynthesisUtterance(narrationText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Share or copy information
  const handleShare = () => {
    if (!scanResult) return;
    const shareText = `🏛️ Landmark: ${scanResult.title}\n📍 Location: ${scanResult.location}\n⏳ Era: ${scanResult.builtYearOrEra}\n\n${scanResult.history.slice(0, 200)}...`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setSnackbarMessage('Landmark facts and history copied to clipboard!');
    } else {
      setSnackbarMessage('Landmark information ready to share.');
    }
  };

  // Direct move to map
  const handleViewOnMap = () => {
    if (!scanResult) return;
    const coords = scanResult.coordinates || { lat: 28.6562, lng: 77.2410 };
    if (onViewLocationOnMap) {
      onViewLocationOnMap(coords, scanResult);
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 1.5, sm: 3 }, minHeight: '85vh' }}>
      {/* Top Header Navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
        >
          Back to Guide
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            icon={<AutoAwesomeIcon sx={{ fontSize: '16px !important', color: '#f59e0b' }} />}
            label={hasGeminiKey() ? 'Gemini 2.5 Flash Vision Enabled' : 'Heritage Vision Engine'}
            color="primary"
            variant="outlined"
            size="small"
            sx={{ fontWeight: 600, fontSize: '0.78rem' }}
          />
        </Box>
      </Box>

      {/* Hidden canvas for taking snapshot */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* ------------------------------------------------------------- */}
      {/* STAGE 1: LIVE CAMERA VIEW & SCANNER FINDER                    */}
      {/* ------------------------------------------------------------- */}
      {stage === 'camera' && (
        <Card
          elevation={4}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: '#0f172a',
            color: '#fff',
            position: 'relative',
          }}
        >
          {/* Viewfinder Title Banner */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'rgba(15, 23, 42, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CameraAltIcon sx={{ color: '#38bdf8' }} /> Tourist Landmark & Heritage Cam
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Point at any monument, statue, fort, heritage sight, cafe, or hotel to reveal its full history and facts
              </Typography>
            </Box>

            {/* Switch Camera (Front / Back) button */}
            <Tooltip title={`Switch to ${facingMode === 'environment' ? 'Front (Selfie)' : 'Back (Landmark)'} Camera`}>
              <IconButton
                onClick={handleToggleFacingMode}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.12)',
                  color: '#fff',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                }}
              >
                <FlipCameraIosIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Camera Video Stream or Fallback Container */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              minHeight: { xs: 340, sm: 460 },
              maxHeight: 520,
              bgcolor: '#020617',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: cameraActive ? 'block' : 'none',
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
              }}
            />

            {/* Viewfinder Target Framing Overlay */}
            {cameraActive && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: { xs: 20, sm: 40 },
                  border: '2px dashed rgba(56, 189, 248, 0.65)',
                  borderRadius: 3,
                  pointerEvents: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  p: 2,
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.35)',
                }}
              >
                {/* Corner Accents */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box sx={{ width: 24, height: 24, borderTop: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8' }} />
                  <Box sx={{ width: 24, height: 24, borderTop: '3px solid #38bdf8', borderRight: '3px solid #38bdf8' }} />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    textAlign: 'center',
                    bgcolor: 'rgba(15, 23, 42, 0.75)',
                    color: '#38bdf8',
                    py: 0.5,
                    px: 1.5,
                    borderRadius: 2,
                    alignSelf: 'center',
                    fontWeight: 700,
                    letterSpacing: 0.5,
                  }}
                >
                  {facingMode === 'environment' ? '📷 BACK CAM: FRAME LANDMARK OR MONUMENT' : '🤳 FRONT CAM ACTIVE'}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box sx={{ width: 24, height: 24, borderBottom: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8' }} />
                  <Box sx={{ width: 24, height: 24, borderBottom: '3px solid #38bdf8', borderRight: '3px solid #38bdf8' }} />
                </Box>
              </Box>
            )}

            {/* Camera Error / Fallback UI */}
            {cameraError && (
              <Box sx={{ p: 3, textAlign: 'center', maxWidth: 480 }}>
                <Alert severity="info" sx={{ mb: 2, bgcolor: '#1e293b', color: '#e2e8f0' }}>
                  {cameraError}
                </Alert>
                <Button
                  variant="contained"
                  startIcon={<PhotoLibraryIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ textTransform: 'none', bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' } }}
                >
                  Upload Photo From Device
                </Button>
              </Box>
            )}
          </Box>

          {/* Bottom Action Controls */}
          <Box
            sx={{
              p: 2.5,
              bgcolor: 'rgba(15, 23, 42, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              gap: 2,
              borderTop: '1px solid rgba(255,255,255,0.1)',
              flexWrap: 'wrap',
            }}
          >
            {/* Upload File button */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<PhotoLibraryIcon />}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                color: '#e2e8f0',
                borderColor: 'rgba(255,255,255,0.25)',
                textTransform: 'none',
              }}
            >
              Upload Photo
            </Button>

            {/* Primary Capture Button */}
            <Tooltip title="Click to Capture Photo">
              <Button
                variant="contained"
                onClick={handleCapturePhoto}
                disabled={!cameraActive}
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  bgcolor: '#ffffff',
                  color: '#0f172a',
                  border: '5px solid #38bdf8',
                  boxShadow: '0 0 20px rgba(56, 189, 248, 0.6)',
                  '&:hover': {
                    bgcolor: '#f1f5f9',
                    transform: 'scale(1.05)',
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                  },
                }}
              >
                <CameraAltIcon sx={{ fontSize: 32 }} />
              </Button>
            </Tooltip>

            {/* Camera facing switcher */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<FlipCameraIosIcon />}
              onClick={handleToggleFacingMode}
              sx={{
                color: '#e2e8f0',
                borderColor: 'rgba(255,255,255,0.25)',
                textTransform: 'none',
              }}
            >
              {facingMode === 'environment' ? 'Front Cam' : 'Back Cam'}
            </Button>
          </Box>

          {/* Preset Sample Landmarks bar for quick testing without webcam */}
          <Box sx={{ p: 2, bgcolor: '#020617', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1, fontWeight: 700 }}>
              TEST INSTANTLY WITH SAMPLE LANDMARKS:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5 }}>
              {PRESET_LANDMARKS.map((preset) => (
                <Chip
                  key={preset.id}
                  label={preset.title}
                  clickable
                  onClick={() => handleSelectPreset(preset)}
                  sx={{
                    bgcolor: '#1e293b',
                    color: '#e2e8f0',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    border: '1px solid rgba(255,255,255,0.15)',
                    '&:hover': { bgcolor: '#334155', borderColor: '#38bdf8' },
                  }}
                />
              ))}
            </Box>
          </Box>
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STAGE 2: CONFIRMATION REVIEW (TICK AND CROSS MARKS)           */}
      {/* ------------------------------------------------------------- */}
      {stage === 'review' && (
        <Card
          elevation={5}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: '#0f172a',
            color: '#fff',
            maxWidth: 680,
            mx: 'auto',
          }}
        >
          <Box sx={{ p: 2, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#f8fafc' }}>
              Confirm Captured Photo
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Click <strong>Correct Tick (✓)</strong> to discover full history and facts, or <strong>Cross (✕)</strong> to retake.
            </Typography>
          </Box>

          {/* Image Preview */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: { xs: 320, sm: 420 },
              bgcolor: '#020617',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {capturedImage && (
              <img
                src={capturedImage}
                alt="Captured sight"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            )}
          </Box>

          {/* Action Row: Cross Mark (❌) and Correct Tick Mark (✅) - Clean small icons */}
          <Box
            sx={{
              py: 2,
              px: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              bgcolor: 'rgba(15, 23, 42, 0.98)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {/* 1. Cross Mark: Retake Photo (Small icon, no text) */}
            <Tooltip title="Retake Photo">
              <IconButton
                onClick={handleRetakePhoto}
                aria-label="Retake photo"
                size="medium"
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: '#ef4444',
                  color: '#fff',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                  '&:hover': {
                    bgcolor: '#dc2626',
                    transform: 'scale(1.08)',
                  },
                  transition: 'all 0.15s ease',
                }}
              >
                <CancelIcon sx={{ fontSize: 24 }} />
              </IconButton>
            </Tooltip>

            {/* 2. Correct Tick Mark: Confirm & Next Step (Small icon, no text) */}
            <Tooltip title="Confirm & Get History">
              <IconButton
                onClick={handleConfirmAndAnalyze}
                aria-label="Confirm photo"
                size="medium"
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: '#10b981',
                  color: '#fff',
                  boxShadow: '0 2px 10px rgba(16, 185, 129, 0.45)',
                  '&:hover': {
                    bgcolor: '#059669',
                    transform: 'scale(1.08)',
                  },
                  transition: 'all 0.15s ease',
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 24 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STAGE 3: ANALYZING PROGRESS ANIMATION                         */}
      {/* ------------------------------------------------------------- */}
      {stage === 'analyzing' && (
        <Card
          elevation={4}
          sx={{
            borderRadius: 3,
            p: 5,
            maxWidth: 500,
            mx: 'auto',
            textAlign: 'center',
            bgcolor: '#ffffff',
          }}
        >
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
            <CircularProgress size={80} thickness={4} color="primary" />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AutoAwesomeIcon color="primary" sx={{ fontSize: 32 }} />
            </Box>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#0f172a' }}>
            Identifying Sight...
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
            Scanning architectural masonry, cultural ornaments, historical archives, and heritage landmarks...
          </Typography>

          <Chip
            label={`${analyzingProgress}% Complete`}
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        </Card>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STAGE 4: COMPREHENSIVE INFORMATION PAGE                       */}
      {/* ------------------------------------------------------------- */}
      {stage === 'info' && scanResult && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Main Landmark Dossier Card */}
          <Card elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            {/* Hero Image & Overlay */}
            <Box sx={{ position: 'relative', height: { xs: 260, sm: 380 }, bgcolor: '#0f172a' }}>
              <CardMedia
                component="img"
                image={scanResult.imageUrl || capturedImage}
                alt={scanResult.title}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.4) 50%, rgba(15,23,42,0.1) 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  p: { xs: 2, sm: 3 },
                  color: '#fff',
                }}
              >
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                  <Chip
                    label={scanResult.category}
                    sx={{ bgcolor: '#0284c7', color: '#fff', fontWeight: 700, fontSize: '0.75rem' }}
                  />
                  {scanResult.builtYearOrEra && (
                    <Chip
                      label={`Era: ${scanResult.builtYearOrEra}`}
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, fontSize: '0.75rem' }}
                    />
                  )}
                  <Chip
                    label={scanResult.aiModel || 'AI Vision'}
                    icon={<AutoAwesomeIcon sx={{ fontSize: '14px !important', color: '#fbbf24' }} />}
                    sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: '#fbbf24', fontWeight: 600, fontSize: '0.75rem' }}
                  />
                </Box>

                <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2, textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                  {scanResult.title}
                </Typography>

                <Typography
                  variant="subtitle1"
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#93c5fd', mt: 0.5 }}
                >
                  <PlaceIcon fontSize="small" /> {scanResult.location}
                </Typography>
              </Box>
            </Box>

            {/* Quick Interactive Action Bar */}
            <Box
              sx={{
                p: 2,
                bgcolor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {/* Audio Guide Speech Button */}
                <Button
                  variant={isSpeaking ? 'contained' : 'outlined'}
                  color={isSpeaking ? 'error' : 'primary'}
                  startIcon={isSpeaking ? <VolumeOffIcon /> : <VolumeUpIcon />}
                  onClick={handleToggleAudioGuide}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  {isSpeaking ? 'Stop Audio Guide' : 'Listen to Audio Guide'}
                </Button>

                {/* Move to Map */}
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<MapIcon />}
                  onClick={handleViewOnMap}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Locate on Map
                </Button>

                {/* Share info */}
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<ShareIcon />}
                  onClick={handleShare}
                  sx={{ textTransform: 'none', borderColor: '#cbd5e1' }}
                >
                  Share
                </Button>
              </Box>

              {/* Scan Another Sight button */}
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                  }
                  setIsSpeaking(false);
                  setStage('camera');
                }}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  bgcolor: '#0f172a',
                  '&:hover': { bgcolor: '#1e293b' },
                }}
              >
                Scan Another Sight
              </Button>
            </Box>

            {/* Content Sections */}
            <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
              {/* Founder / Architect Info */}
              {scanResult.architectOrFounder && (
                <Box sx={{ mb: 3, p: 2, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#166534', mb: 0.3 }}>
                    FOUNDER / ARCHITECTURAL PATRON
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600 }}>
                    {scanResult.architectOrFounder}
                  </Typography>
                </Box>
              )}

              {/* Section 1: Historical Background */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, color: '#0f172a', mb: 1.5 }}
                >
                  <HistoryEduIcon color="primary" /> Historical Origins & Dynasty Chronicle
                </Typography>
                <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.75, textAlign: 'justify' }}>
                  {scanResult.history}
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Section 2: Culture & Heritage */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, color: '#0f172a', mb: 1.5 }}
                >
                  <AccountBalanceIcon sx={{ color: '#8b5cf6' }} /> Cultural Significance & Living Heritage
                </Typography>
                <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.75, textAlign: 'justify' }}>
                  {scanResult.culture}
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Section 3: Key Architectural Highlights & Masonry */}
              {scanResult.architecturalHighlights && scanResult.architecturalHighlights.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, color: '#0f172a', mb: 2 }}
                  >
                    🏛️ Architectural Craftsmanship & Design
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    {scanResult.architecturalHighlights.map((item, index) => (
                      <Paper
                        key={index}
                        elevation={0}
                        sx={{
                          p: 2,
                          bgcolor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: 2,
                        }}
                      >
                        <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
                          • {item}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Section 4: Fascinating Historical Facts */}
              {scanResult.facts && scanResult.facts.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, color: '#0f172a', mb: 2 }}
                  >
                    <LightbulbIcon sx={{ color: '#f59e0b' }} /> Essential Heritage Facts & Secrets
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {scanResult.facts.map((fact, index) => (
                      <Paper
                        key={index}
                        elevation={0}
                        sx={{
                          p: 2,
                          bgcolor: '#fffbeb',
                          border: '1px solid #fef3c7',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1.5,
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ color: '#b45309', fontWeight: 800 }}>
                          #{index + 1}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#451a03', lineHeight: 1.6 }}>
                          {fact}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Cafe / Dining / Hotel Specialties if present */}
              {scanResult.specialties && (
                <Box sx={{ mb: 4, p: 2.5, bgcolor: '#fdf2f8', borderRadius: 2, border: '1px solid #fbcfe8' }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 800, color: '#9d174d', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                  >
                    <RestaurantIcon /> Signature Cafe & Hospitality Highlights
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#831843', lineHeight: 1.6 }}>
                    {scanResult.specialties}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              {/* Section 5: Visitor Guide & Tips */}
              {scanResult.visitorTips && scanResult.visitorTips.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}
                  >
                    🧭 Tips for Tourists & Visitors
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {scanResult.visitorTips.map((tip, index) => (
                      <Typography key={index} variant="body2" sx={{ color: '#475569', display: 'flex', gap: 1 }}>
                        <span style={{ color: '#0284c7', fontWeight: 800 }}>✔</span> {tip}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Snackbar notification */}
      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={4000}
        onClose={() => setSnackbarMessage('')}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default MonumentScanner;
