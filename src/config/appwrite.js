import { Client, Storage, ID } from 'appwrite';

export const getAppwriteConfig = () => {
  const saved = localStorage.getItem('tourist_appwrite_config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.projectId && parsed.bucketId) {
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved Appwrite config', e);
    }
  }

  return {
    endpoint: process.env.REACT_APP_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
    projectId: process.env.REACT_APP_APPWRITE_PROJECT_ID || '',
    bucketId: process.env.REACT_APP_APPWRITE_BUCKET_ID || '',
  };
};

export const isAppwriteConfigured = () => {
  const config = getAppwriteConfig();
  return Boolean(config.projectId && config.bucketId);
};

export const reloadAppwriteWithConfig = (newConfig) => {
  if (newConfig) {
    localStorage.setItem('tourist_appwrite_config', JSON.stringify(newConfig));
  } else {
    localStorage.removeItem('tourist_appwrite_config');
  }
  window.location.reload();
};

/**
 * Uploads an image or video file.
 * Uses Appwrite Storage if configured; otherwise gracefully converts to Base64
 * for instant local testing and preview.
 */
export const uploadMediaFile = async (file, onProgress) => {
  const isVideo = file.type.startsWith('video/');
  const mediaType = isVideo ? 'video' : 'image';

  if (isAppwriteConfigured()) {
    try {
      const config = getAppwriteConfig();
      const client = new Client()
        .setEndpoint(config.endpoint)
        .setProject(config.projectId);

      const storage = new Storage(client);
      const uniqueId = ID.unique();

      const response = await storage.createFile(
        config.bucketId,
        uniqueId,
        file,
        undefined,
        onProgress ? (progress) => onProgress(Math.round((progress.loaded / progress.total) * 100)) : undefined
      );

      const fileView = storage.getFileView(config.bucketId, response.$id);
      const fileUrl = typeof fileView === 'string' ? fileView : fileView.href;

      return {
        url: fileUrl,
        fileId: response.$id,
        mediaType,
        isAppwrite: true,
      };
    } catch (error) {
      console.warn('Appwrite upload failed, falling back to local file reader:', error);
    }
  }

  // Graceful fallback: convert to base64 Data URL so user can test upload immediately
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        url: reader.result,
        fileId: 'local_' + Date.now(),
        mediaType,
        isAppwrite: false,
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};
