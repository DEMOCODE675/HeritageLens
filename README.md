# HeritageLens

> **Discover heritage. Explore locally. Experience more.**

HeritageLens is an AI-powered tourism and local discovery platform that helps travelers find cultural landmarks, restaurants, hotels, attractions, and authentic local products in one place. It combines interactive maps, location-based recommendations, camera-assisted heritage recognition, and a community marketplace designed to connect visitors with local sellers.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Material UI](https://img.shields.io/badge/Material%20UI-9-007FFF?logo=mui&logoColor=white)](https://mui.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Authentication%20%26%20Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Why HeritageLens?

Travelers often need several different tools to plan a visit, identify landmarks, find nearby services, and discover local products. HeritageLens brings those experiences together in a single, responsive application:

- Explore nearby places with an interactive map.
- Discover restaurants, hotels, attractions, and other points of interest.
- Scan monuments, heritage sites, and sights with the AI-powered camera experience.
- View a scanned landmark on the map and continue exploring nearby places.
- Browse a local marketplace for cultural products and handmade goods.
- Allow authenticated sellers to publish products with images, videos, and store locations.
- Navigate from a marketplace listing directly to the seller's location.

## Core features

### Tourist advisor

The advisor uses the user's location, or a selected place, to show useful nearby recommendations. Results can be explored in a list and on an interactive map.

### Heritage and sight scanner

The scanner uses the device camera and Google Gemini vision capabilities to help identify monuments, heritage locations, and other points of interest. Identified locations can be highlighted on the map.

### Local marketplace

Authenticated users can browse local products and sellers, open product details, and view a seller's store location. Sellers can add product information, media, coordinates, and location details.

### Authentication and storage

Firebase provides authentication and marketplace data services. Appwrite Cloud Storage is used for product images and videos.

### Location-aware experience

The application supports browser geolocation, place search, map markers, selected locations, and visual indicators for scanned landmarks and seller stores.

## Screenshots

### Nearby places and hotels

<img width="1896" height="1047" alt="live_loc_places_hotels" src="https://github.com/user-attachments/assets/1f7d497a-13f1-45a2-a334-bda64570a4af" />

### Local marketplace

<img width="1867" height="1067" alt="card_marketPlace" src="https://github.com/user-attachments/assets/b10537dd-5d87-49c7-bd96-46668481dc7f" />

### Marketplace product details

<img width="1872" height="1066" alt="card-inpage_market_Places" src="https://github.com/user-attachments/assets/f3dd5897-2fe0-401f-bf45-96d240e56cdd" />

### Add a product

<img width="1865" height="1076" alt="card_upload_prd" src="https://github.com/user-attachments/assets/012ef7fc-b13e-4947-88c8-4fde988d628c" />

## Technology stack

- **Frontend:** React 19 and Create React App
- **UI:** Material UI, Emotion, and responsive layouts
- **Maps:** React Leaflet, Google Maps integration, and map styling
- **AI:** Google Gemini vision capabilities
- **Authentication and database:** Firebase
- **Media storage:** Appwrite Cloud Storage
- **Location and discovery APIs:** Foursquare, Geoapify, and Travel Advisor
- **Server support:** Express proxy configuration

## Getting started

### Prerequisites

- Node.js 18 or newer
- npm or Bun
- API credentials for the services you want to enable
- A browser with location and camera permissions for the full experience

### Installation

```bash
git clone https://github.com/DEMOCODE675/HeritageLens.git
cd HeritageLens
npm install
```

### Configure environment variables

Create a local environment file from the example:

```bash
cp .env.example .env
```

Add the credentials for Firebase, Appwrite, Gemini, and any enabled discovery APIs. Never commit `.env` or expose private credentials in source control.

The available variables are documented in [`.env.example`](.env.example), including:

- `REACT_APP_GEMINI_API_KEY`
- `REACT_APP_FIREBASE_*`
- `REACT_APP_APPWRITE_*`
- `REACT_APP_FOURSQUARE_API_KEY`
- `REACT_APP_GEOAPIFY_API_KEY`
- `REACT_APP_TRAVEL_ADVISOR_API_KEY`

### Run the application

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available scripts

| Command | Description |
| --- | --- |
| `npm start` | Starts the development server |
| `npm test` | Runs the test runner |
| `npm run build` | Creates an optimized production build |

## Project structure

```text
src/
├── api/                  # External API clients
├── components/
│   ├── Auth/             # Authentication UI
│   ├── Header/           # Navigation and search
│   ├── Lists/            # Nearby place results
│   ├── Map/              # Interactive map
│   ├── Marketplace/      # Products and seller workflows
│   ├── PlaceDetails/     # Place information
│   └── Scanner/          # AI heritage and sight scanner
├── config/               # Firebase and Appwrite configuration
├── App.js                # Main application and navigation state
└── index.js              # Application entry point
```

## Privacy and security

- Keep all API keys in environment variables.
- Use restricted API keys with only the permissions required by each service.
- Do not commit Firebase service-account files, Appwrite secrets, or production credentials.
- Request camera and location permissions only when the related feature needs them.
- Review third-party service terms before deploying the application publicly.

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make focused changes and test them locally.
4. Commit your changes with a clear message.
5. Open a pull request describing the change.

Please avoid committing secrets, generated build output, or unrelated formatting changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

HeritageLens is built with React, Material UI, Firebase, Appwrite, Google Gemini, mapping tools, and location discovery services.
