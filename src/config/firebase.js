import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';

// Retrieve configuration from environment or localStorage runtime override
export const getFirebaseConfig = () => {
  const saved = localStorage.getItem('tourist_firebase_config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved Firebase config', e);
    }
  }

  return {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || '',
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.REACT_APP_FIREBASE_APP_ID || '',
  };
};

export const isFirebaseConfigured = () => {
  const config = getFirebaseConfig();
  return Boolean(config.apiKey && config.projectId);
};

// Safe Firebase App and Services initialization
let app = null;
let auth = null;
let db = null;

const initFirebase = () => {
  const config = getFirebaseConfig();
  if (!config.apiKey || !config.projectId) {
    return { app: null, auth: null, db: null };
  }

  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
    return { app, auth, db };
  } catch (error) {
    console.warn('Firebase initialization error, using local mock storage:', error);
    return { app: null, auth: null, db: null };
  }
};

const services = initFirebase();
auth = services.auth;
db = services.db;

// Re-initialize if user saves keys in UI
export const reloadFirebaseWithConfig = (newConfig) => {
  if (newConfig) {
    localStorage.setItem('tourist_firebase_config', JSON.stringify(newConfig));
  } else {
    localStorage.removeItem('tourist_firebase_config');
  }
  window.location.reload();
};

// Local storage keys for fallback demo mode
const LOCAL_USERS_KEY = 'tourist_local_users';
const LOCAL_CURRENT_USER_KEY = 'tourist_current_user';
const LOCAL_PRODUCTS_KEY = 'tourist_local_marketplace_products';
const LOCAL_FAVORITES_KEY = 'tourist_local_favorites';

// Sample starting products for local stores
const INITIAL_DEMO_PRODUCTS = [
  {
    id: 'prod_1',
    title: 'Handmade Kashmiri Pashmina Shawl',
    price: 45,
    currency: 'USD',
    category: 'Textiles & Wearables',
    shopName: 'Heritage Silk & Loom',
    sellerPhone: '+1 (555) 234-5678',
    sellerName: 'Zahid Khan',
    sellerUid: 'demo_seller_1',
    locationName: 'Old Market Bazaar, Craft Alley',
    lat: 40.7128,
    lng: -74.0060,
    mediaUrl: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image',
    description: 'Authentic pure wool pashmina hand-spun with traditional floral motifs. Directly from local Kashmiri weavers.',
    createdAt: new Date().toISOString(),
    likesCount: 14,
  },
  {
    id: 'prod_2',
    title: 'Artisan Terracotta Blue Pottery Vase',
    price: 28,
    currency: 'USD',
    category: 'Antiques & Pottery',
    shopName: 'Earth & Clay Studio',
    sellerPhone: '+1 (555) 876-5432',
    sellerName: 'Maya Devi',
    sellerUid: 'demo_seller_2',
    locationName: 'Potters Quarter, Main Square',
    lat: 40.7180,
    lng: -74.0020,
    mediaUrl: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image',
    description: 'Hand-thrown blue glazed ceramic vase painted with organic cobalt pigments by third-generation potters.',
    createdAt: new Date().toISOString(),
    likesCount: 22,
  },
  {
    id: 'prod_3',
    title: 'Organic Cardamom & Mountain Saffron Box',
    price: 35,
    currency: 'USD',
    category: 'Local Foods & Spices',
    shopName: 'Spice Route Merchants',
    sellerPhone: '+1 (555) 345-9876',
    sellerName: 'Aarav Patel',
    sellerUid: 'demo_seller_3',
    locationName: 'Old Spice Market, Stall 42',
    lat: 40.7090,
    lng: -74.0110,
    mediaUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image',
    description: 'Sun-dried premium green cardamom pods and grade-A mountain saffron harvested this season. Rich aroma and vibrant golden hue.',
    createdAt: new Date().toISOString(),
    likesCount: 31,
  },
  {
    id: 'prod_4',
    title: 'Handcrafted Brass Elephant Figurine',
    price: 52,
    currency: 'USD',
    category: 'Handicrafts & Art',
    shopName: 'Royal Brass & Metalcraft',
    sellerPhone: '+1 (555) 456-1122',
    sellerName: 'Vikram Singh',
    sellerUid: 'demo_seller_4',
    locationName: 'Jewelry & Metalsmith Street',
    lat: 40.7150,
    lng: -74.0080,
    mediaUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image',
    description: 'Lost-wax casting method brass decorative elephant with intricate jali lattice work. Heavy and polished with antique patina.',
    createdAt: new Date().toISOString(),
    likesCount: 19,
  },
];

// Initialize local products if missing
const getStoredLocalProducts = () => {
  try {
    const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(INITIAL_DEMO_PRODUCTS));
      return INITIAL_DEMO_PRODUCTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_DEMO_PRODUCTS;
  }
};

// -----------------------------------------------------------------------------
// Authentication Functions
// -----------------------------------------------------------------------------

export const registerUser = async ({ email, password, displayName, role = 'seller', phone = '', shopName = '' }) => {
  if (isFirebaseConfigured() && auth && db) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName });

    // Store extended profile in Firestore 'users' collection
    const userDocRef = doc(db, 'users', user.uid);
    const profile = {
      uid: user.uid,
      email: user.email,
      displayName,
      role,
      phone,
      shopName,
      createdAt: serverTimestamp(),
    };
    await setDoc(userDocRef, profile, { merge: true });
    return { ...profile, user };
  }

  // Fallback local mock user registration
  const users = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const newUser = {
    uid: 'user_' + Date.now(),
    email,
    displayName: displayName || email.split('@')[0],
    role,
    phone,
    shopName,
    createdAt: new Date().toISOString(),
  };

  users.push({ ...newUser, password });
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(newUser));

  // Dispatch auth event for local listeners
  window.dispatchEvent(new Event('tourist_auth_changed'));
  return newUser;
};

export const loginUser = async (email, password) => {
  if (isFirebaseConfigured() && auth) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Get profile from Firestore
    let profile = null;
    if (db) {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          profile = snap.data();
        }
      } catch (err) {
        console.warn('Could not fetch user profile from Firestore:', err);
      }
    }
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email,
      ...(profile || {}),
    };
  }

  // Fallback local mock user login
  const users = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
  const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!found) {
    throw new Error('Invalid email or password.');
  }

  const { password: _, ...cleanUser } = found;
  localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(cleanUser));
  window.dispatchEvent(new Event('tourist_auth_changed'));
  return cleanUser;
};

export const logoutUser = async () => {
  if (isFirebaseConfigured() && auth) {
    await signOut(auth);
  }
  localStorage.removeItem(LOCAL_CURRENT_USER_KEY);
  window.dispatchEvent(new Event('tourist_auth_changed'));
};

export const getCurrentUser = () => {
  if (isFirebaseConfigured() && auth && auth.currentUser) {
    return {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      displayName: auth.currentUser.displayName || auth.currentUser.email,
    };
  }
  try {
    const raw = localStorage.getItem(LOCAL_CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const getUserProfile = async (uid) => {
  if (!uid) return null;
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        return snap.data();
      }
    } catch (err) {
      console.warn('Error fetching profile from Firestore:', err);
    }
  }

  // Check local users
  const users = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
  const found = users.find((u) => u.uid === uid);
  if (found) {
    const { password: _, ...clean } = found;
    return clean;
  }

  // Fallback current user if matches
  const current = getCurrentUser();
  if (current && current.uid === uid) {
    return current;
  }
  return null;
};

export const updateUserProfile = async (uid, updates) => {
  if (!uid) return null;
  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'users', uid), updates, { merge: true });
    } catch (err) {
      console.warn('Error saving profile to Firestore:', err);
    }
  }

  // Update in local store
  const users = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
  const idx = users.findIndex((u) => u.uid === uid);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updates };
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  }

  const current = getCurrentUser();
  if (current && current.uid === uid) {
    const merged = { ...current, ...updates };
    localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(merged));
    window.dispatchEvent(new Event('tourist_auth_changed'));
    return merged;
  }
  return updates;
};

export const subscribeToAuth = (callback) => {
  if (isFirebaseConfigured() && auth) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let profile = await getUserProfile(firebaseUser.uid);
        callback({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email,
          role: profile?.role || 'seller',
          phone: profile?.phone || '',
          shopName: profile?.shopName || '',
          ...(profile || {}),
        });
      } else {
        callback(null);
      }
    });
  }

  // Fallback listener for local auth
  const handleLocalChange = () => {
    callback(getCurrentUser());
  };
  window.addEventListener('tourist_auth_changed', handleLocalChange);
  // initial call
  callback(getCurrentUser());

  return () => {
    window.removeEventListener('tourist_auth_changed', handleLocalChange);
  };
};

// -----------------------------------------------------------------------------
// Marketplace Firestore Operations
// -----------------------------------------------------------------------------

export const fetchMarketplaceProducts = async () => {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, 'marketplace_products'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const items = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (items.length > 0) {
        return items;
      }
    } catch (error) {
      console.warn('Firestore fetch failed, falling back to local list:', error);
    }
  }

  return getStoredLocalProducts();
};

export const createMarketplaceProduct = async (productData) => {
  const newProduct = {
    ...productData,
    createdAt: new Date().toISOString(),
    likesCount: 0,
  };

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = await addDoc(collection(db, 'marketplace_products'), {
        ...newProduct,
        serverCreatedAt: serverTimestamp(),
      });
      return { id: docRef.id, ...newProduct };
    } catch (err) {
      console.warn('Could not save product to Firestore, saving locally:', err);
    }
  }

  // Save to local storage
  const products = getStoredLocalProducts();
  const created = {
    id: 'prod_' + Date.now(),
    ...newProduct,
  };
  products.unshift(created);
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
  return created;
};

export const getFavorites = () => {
  try {
    const raw = localStorage.getItem(LOCAL_FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const toggleFavorite = (productId) => {
  const favs = getFavorites();
  const exists = favs.includes(productId);
  let updated;
  if (exists) {
    updated = favs.filter((id) => id !== productId);
  } else {
    updated = [...favs, productId];
  }
  localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(updated));
  return updated;
};
