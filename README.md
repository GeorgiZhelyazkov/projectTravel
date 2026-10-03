# Sofia Navigator (projectTravel)

> An offline-first mobile app for navigating Sofia's public transport — find the best route between any two stops, get step-by-step instructions, and see it on a map.

Built with **React Native**, **Expo** and **TypeScript**. Developed as a diploma project at the Technical University of Sofia (Faculty of Computer Systems and Technologies).

---

## Features

- **Route planning** between any two stops in Sofia, optimized for the fewest transfers
- **Step-by-step instructions** – which line to take, where to transfer, where to get off
- **Interactive map** with the route drawn on top and stop markers
- **Timetables** for every line and direction, including full-day schedules (weekday/weekend)
- **Stop details** showing which lines serve each stop
- **Favorites** and **recent routes** for quick access, stored locally on the device
- **Light / dark theme** and other settings (e.g. route recalculation, clearing saved data)
- **Offline route search** – all transport data ships with the app as local JSON files, so no server or account is needed to plan a trip

---

## Coverage

The bundled dataset covers **2,892 stops** and **140 lines**:

| Type    | Lines |
|---------|-------|
| Bus     | 108   |
| Tram    | 18    |
| Trolley | 10    |
| Metro   | 4     |

---

## Tech Stack

| Area          | Technology |
|---------------|------------|
| Framework     | React Native 0.79, React 19, Expo SDK 53 |
| Language      | TypeScript |
| Navigation    | Expo Router (file-based routing) + React Navigation (stack, tabs, drawer) |
| Maps          | `react-native-maps` |
| UI            | `react-native-paper`, `@expo/vector-icons`, `expo-symbols` |
| Local storage | `@react-native-async-storage/async-storage` |
| Location      | `expo-location` |
| Tooling       | ESLint, ts-node |

---

## How It Works

1. **Data** – Stops, lines, directions, trips and stop times live in `assets/data/` as JSON files.
2. **Precomputation** – `scripts/generatePrecomputedData.ts` builds an enhanced adjacency graph and a nearby-stops index (`assets/data/precomputed/precomputed.json`) so searches stay fast on-device.
3. **Route search** – A priority-queue-based graph search (in `app/route.tsx`) explores the network, penalizing transfers and using nearby stops as walking connections, so reasonable routes are found even when no direct line exists.
4. **Caching** – Computed routes are cached locally with AsyncStorage and can be recalculated from Settings.
5. **Map rendering** – Routes are drawn on the map with `react-native-maps`. Transit segments use road geometry from the public [OSRM](https://project-osrm.org/) demo server when a connection is available, and fall back to straight lines between stops otherwise. Walking segments are always drawn as direct lines.

---

## Project Structure

```
projectTravel/
├── app/                     # Screens & routes (Expo Router)
│   ├── (tabs)/              # Tab navigation (home, explore)
│   ├── map/                 # Line maps & user location
│   ├── stops/[stopId].tsx   # Stop details
│   ├── timetables/          # Line timetables (by line & direction)
│   ├── route.tsx            # Route-finding logic & instructions
│   ├── routeMap.tsx         # Route visualization on the map
│   ├── favorites.tsx        # Saved routes
│   ├── recent.tsx           # Recently used routes
│   ├── settings.tsx         # Theme & data settings
│   └── utils/storage.ts     # AsyncStorage helpers
├── assets/
│   ├── data/                # stops, routes, directions, trips, stop_times (JSON)
│   │   └── precomputed/     # Generated graph data
│   ├── fonts/
│   └── images/
├── components/              # Reusable UI components
├── constants/               # Theme colors
├── context/                 # Theme context
├── hooks/                   # Custom hooks
└── scripts/
    └── generatePrecomputedData.ts
```
---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended) and npm
- [Expo Go](https://expo.dev/go) on your phone, or an Android emulator / iOS simulator

---

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/projectTravel.git
cd projectTravel

# Install dependencies
npm install

# Start the development server
npx expo start
```

Then scan the QR code with Expo Go, or press `a` (Android) / `i` (iOS) / `w` (web) in the terminal.

---

### Available Scripts

| Command                 | Description |
|-------------------------|-------------|
| `npm start`             | Start the Expo dev server |
| `npm run android`       | Run on an Android device/emulator |
| `npm run ios`           | Run on an iOS device/simulator |
| `npm run web`           | Run in the browser |
| `npm run generate-data` | Regenerate the precomputed graph data |
| `npm run lint`          | Lint the codebase |

> **Note:** If you modify the files in `assets/data/`, run `npm run generate-data` to rebuild the precomputed data.

---

## Permissions

The app requests **location access** (optional) to show your position and nearby stops on the map.

---

## Roadmap

- Real-time vehicle positions and arrival predictions
- User accounts with cloud sync of favorites
- Integration with external traffic and time-estimate APIs
- Fully offline map geometry for route drawing
- Further route-search optimizations

---

## Author

**Georgi Zhelyazkov** – Technical University of Sofia, Faculty of Computer Systems and Technologies, 2025
