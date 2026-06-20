
# WAVESHAPE — Modern Music Player

![WAVESHAPE](https://img.shields.io/badge/version-2.0.0-brightgreen) ![React](https://img.shields.io/badge/React-19-blue) ![Vite](https://img.shields.io/badge/Vite-8-purple) ![License](https://img.shields.io/badge/license-MIT-green)

A feature-rich, dark-themed music player built with **React 19** and **Vite 8**, featuring real-time audio visualization, Web Audio API equalizer, decentralized music streaming via [Audius](https://audius.co), and a responsive design that works seamlessly on both desktop and mobile.

**Live Demo:** [https://good12834.github.io/music-app](https://good12834.github.io/music-app)

---

## Table of Contents

- [Screenshots](#screenshots)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Screenshots

| Discover View | Player Sidebar | Settings Panel |
|---|---|---|
| Browse trending tracks from the Audius decentralized catalog | Full-featured player with visualization, controls, and queue | Audio equalizer, playback speed, themes, and more |

| Radio View | Library View | Queue View |
|---|---|---|
| Genre-based radio stations streaming live from Audius | Browse, search, sort, and manage your track library | See upcoming tracks and queue statistics |

---

## Features

### Core Player
- **High-quality audio playback** using the HTML5 `<audio>` element with Web Audio API integration
- **Play/Pause, Next/Previous** track navigation
- **Shuffle** and **Repeat** modes (repeat one, repeat all, no repeat)
- **Progress seek** with click-to-seek on the progress bar
- **Volume control** with percentage display
- **Sleep timer** (15m, 30m, 60m) with cancel option

### Audio Visualization
- **Real-time frequency analyzer** using Web Audio API's `AnalyserNode`
- **Canvas-based bar visualizer** with BPM-synced animation
- **Track art canvas** with reactive frequency rings that pulse to the music
- Smooth fallback animation when no audio is playing

###  Audio Effects & Controls
- **3-band Equalizer** (Bass, Mid, Treble) with ±12 dB range
- **Playback speed** control (0.5× up to 2×)
- **Crossfade** between tracks (0–12 seconds)
- **Playback history** tracking with play counts

###  Radio Mode
- **8 genre-based stations**: Electronic, Hip-Hop, Ambient, Rock, R&B, Pop, Latin, Experimental
- **Live streaming** from the Audius decentralized network
- **Autoplay** on tune-in (toggleable)
- Edge case handling: graceful loading states, empty track lists, and fallback when Audius API is unavailable

###  Library Management
- **Tabbed views**: All Tracks, Playlists, Liked, Recently Played, Top Played
- **Search** across titles, artists, albums, and genres
- **Sort** by title, artist, duration, plays, or recency (ascending/descending)
- **Grid & List** layout options
- **Batch selection** with queue and playlist operations
- **Genre filtering** with chip buttons
- **Library export** to JSON
- **Playlist creation** and management
- **Track liking/unliking** with heart button

### Queue System
- **Real-time queue** display with current/upcoming/past track indicators
- **Track removal** from queue (with hover-reveal delete button)
- **Clear queue** with confirmation step
- **Queue statistics**: total tracks, remaining time, genre, BPM
- **"Add All"** to queue from Discover view
- **Mini queue preview** in the player sidebar

### Audius Integration
- **Trending tracks** feed from the Audius decentralized music catalog
- **Search** the entire Audius catalog with debounced input
- **Genre-based browsing** with 7 genre filter options
- **Image fallback** with automatic 503 error detection and server unavailable mode
- **Track thumbnail** component with built-in error handling

###  Themes & UI
- **4 dark themes**: Dark, Midnight, Warm Dark, Deep Space
- **Responsive design** with dedicated desktop, tablet, and mobile layouts
- **Mobile bottom player** bar with fixed positioning
- **Mobile drawer menu** with navigation and quick actions
- **Desktop collapsible sidebar** (72px collapsed vs 300px expanded)
- **Fullscreen mode** toggle
- **Toast notifications** for success/error/info messages
- **Glass morphism** effects with backdrop blur
- **Keyboard shortcuts** overlay in Settings

###  Accessibility
- `focus-visible` outlines on interactive elements
- Touch-friendly minimum 44px targets on mobile
- Semantic color contrast with selection styling
- Custom scrollbar styling
- Tooltip support via `data-tooltip` attributes

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **React 19** | UI framework with hooks and functional components |
| **Vite 8** | Build tool and development server with HMR |
| **Web Audio API** | Audio processing, visualization, equalizer |
| **Audius API** | Decentralized music streaming and discovery |
| **Tailwind CSS 4** | Utility-first CSS framework (installed, used minimally) |
| **Lucide React** | Icon library for UI elements |
| **GitHub Pages** | Deployment and hosting |
| **gh-pages** | Automated deployment tool |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- A modern web browser with Web Audio API support (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone https://github.com/good12834/music-app.git
cd music-app

# Navigate to the frontend directory
cd frontend/my-vue-app

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173/music-app/`.

### Build for Production

```bash
npm run build
```

The production build will be output to the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## Project Structure

```
frontend/my-vue-app/
├── index.html                  # Entry HTML file
├── package.json                # Dependencies and scripts
├── vite.config.js              # Vite configuration with Audius proxy
├── public/
│   └── vite.svg                # Favicon
└── src/
    ├── main.jsx                # React app entry point
    ├── App.jsx                 # Root component with routing and layout
    ├── index.css               # Global styles, themes, animations, responsive
    ├── data.jsx                # Static track data, playlists, utility functions
    ├── usePlayer.js            # Core player hook (audio, queue, state management)
    ├── Player.jsx              # Player sidebar (desktop) and bottom bar (mobile)
    ├── Library.jsx             # Library view with search, sort, grid/list, playlists
    ├── Queue.jsx               # Queue view with track list and statistics
    ├── Settings.jsx            # Settings panel (EQ, speed, themes, shortcuts, about)
    ├── Radio.jsx               # Radio mode with genre stations and live streaming
    ├── TrackArt.jsx            # Canvas-based album art with frequency visualization
    ├── Visualizer.jsx          # Canvas-based frequency bar visualizer
    ├── audius.js               # Audius API helper (stream URLs, image fallback, error detection)
    └── getTrendingTracks.jsx   # Trending tracks and search API functions
```

---

## Core Components

### `App.jsx` — Root Component

The main application shell with:

- **Grid layout**: Collapsible player sidebar (left) + main content area (right)
- **Navigation**: Top bar with logo, search (desktop), nav tabs (Discover, Library, Queue), radio/settings/fullscreen buttons
- **Now-playing indicator**: Shows current track info with play/pause status
- **Mobile-specific**: Drawer menu, search overlay, bottom player padding
- **Toast notifications**: Fixed-position notification system with auto-dismiss
- **Keyboard shortcuts**: Global event listener for media keys and navigation

### `usePlayer.js` — Player Hook

The central state management hook providing:

- **Audio lifecycle**: Creates Audio element and Web Audio context, manages source/analyser/gain nodes
- **Equalizer chain**: Bass (lowshelf), Mid (peaking), Treble (highshelf) filters
- **Playback control**: Play, pause, seek, next, previous
- **Queue management**: Add, remove, clear, shuffle
- **Analytics**: Play history, play counts, most played, recently played
- **Shuffle algorithm**: Fisher-Yates shuffle with separate shuffle queue tracking

### `Player.jsx` — Player UI

Desktop sidebar with:

- **Track art** with animated canvas visualization
- **Track info** with expandable details (year, label, bitrate)
- **Progress bar** with seek capability
- **Transport controls**: Shuffle, Previous, Play/Pause, Next, Repeat
- **Effects panel**: Playback speed presets, crossfade slider
- **Mini queue preview**: First 6 upcoming tracks
- **Volume slider** with percentage
- **Sleep timer**: 15m/30m/60m + cancel

Mobile bottom bar with compact controls and queue popup.

### `TrackArt.jsx` — Canvas Art

Canvas-based album art component:

- **Async image loading** with crossorigin for Audius artwork
- **Fallback visualizer**: Animated frequency rings when no image is available
- **Frequency overlay**: Subtle rings over album art when playing
- **Error handling**: Detects 503 errors and falls back to animated display

### `Visualizer.jsx` — Frequency Bars

Canvas-based frequency bar visualizer:

- **48 animated bars** mapping to audio frequency data
- **BPM-synced animation** speed
- **Real FFT data** from AnalyserNode when audio is playing
- **Smooth fallback** sine-wave animation when idle
- **Gradient bars** with color fading

### `Library.jsx` — Library Manager

Comprehensive library view:

- **5 views**: All tracks, Playlists, Liked, Recent, Top Played
- **Search** with real-time filtering
- **Sort controls** with direction toggle
- **Genre filter chips**
- **Grid and List** layout toggle
- **Batch selection** with queue/playlist operations
- **Playlist view** with expandable track lists
- **Export** library to JSON

### `Queue.jsx` — Queue Manager

Dedicated queue view:

- **Sequential track list** with visual indicators for current/past/upcoming
- **Remove tracks** with hover-reveal delete button
- **Clear queue** with confirmation (2.5s timeout)
- **Statistics panel**: Total time, track count, genre, BPM
- **Empty state** messaging

### `Settings.jsx` — Settings Panel

Full settings modal with 4 tabs:

- **Audio**: 3-band equalizer with vertical sliders, playback speed presets, crossfade slider
- **Appearance**: 4 color themes with live preview and application
- **Keyboard Shortcuts**: Complete list of all shortcuts
- **About**: App info, version, tech stack tags

### `Radio.jsx` — Radio Mode

Genre-based radio experience:

- **8 stations** with distinct icons and colors
- **Live track loading** from Audius by genre
- **Autoplay toggle** for tuning behavior
- **Desktop layout**: Station sidebar + track list
- **Mobile layout**: Full-screen with back navigation
- **Loading states** with spinner
- **Live indicator** with animated waveform bars

### `audius.js` — Audius API

Low-level Audius integration:

- `getStreamUrl()` — Builds stream URL from track ID
- `fetchTrackById()` — Fetches single track metadata
- `searchAudiusTracks()` — Search the Audius catalog
- `fetchTrendingTracks()` — Get trending tracks
- `normalizeAudiusTrack()` — Normalize API response to internal format
- `getImageWithFallback()` — URL with 503 fallback detection
- `markUrlAsFailed()` — Track failed URLs and trigger server unavailable mode
- `isServerUnavailable()` — Check server status

### `getTrendingTracks.jsx` — Trending API

Higher-level trending and search:

- `getTrendingTracks()` — Fetch trending with proxy fallback and local fallback
- `searchTracks()` — Full-text search across Audius catalog

### `data.jsx` — Static Data

- **TRACKS**: 8 static demo tracks with real Audius track IDs for streaming
- **PLAYLISTS**: 3 curated playlists with color themes
- **formatTime()**: Format seconds to "m:ss" display
- **normalizeAudius()**: Utility to normalize Audius API responses

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Space` | Play / Pause |
| `←` | Previous track |
| `→` | Next track |
| `Ctrl/Cmd + D` | Switch to Discover tab |
| `Ctrl/Cmd + L` | Switch to Library tab |
| `Ctrl/Cmd + Q` | Switch to Queue tab |
| `Ctrl/Cmd + S` | Toggle Settings panel |
| `Ctrl/Cmd + F` | Toggle Fullscreen |

---

## API Reference

### Audius API Endpoints

The app communicates with the Audius decentralized music network:

| Endpoint | Purpose | Proxy Path |
|---|---|---|
| `GET /v1/tracks/trending` | Fetch trending tracks | `/audius/tracks/trending` |
| `GET /v1/tracks/search` | Search tracks by query | Direct call |
| `GET /v1/tracks/:id/stream` | Get audio stream URL | Direct URL construction |
| `GET /v1/tracks/:id` | Get track metadata | Direct call |

The Vite dev server proxies `/audius/*` requests to `https://discoveryprovider.audius.co/v1/` for trending tracks to avoid CORS issues. Search and streaming use direct API calls.

### Error Handling

The app implements robust error handling for Audius API calls:

1. **Trending tracks**: Tries proxy → direct API → static fallback tracks
2. **Image loading**: Detects 503 errors → marks URL as failed → returns SVG placeholder → auto-resets after 30s with threshold of 3 consecutive failures
3. **Audio streaming**: Falls back gracefully when a track has no `trackId`
4. **Search**: Returns empty array on any fetch failure

---

## Deployment

The app is configured for GitHub Pages deployment:

```bash
# Build the project
npm run build

# Deploy to GitHub Pages
npm run deploy
```

This uses the `gh-pages` package to publish the `dist/` directory to the `gh-pages` branch.

### Configuration Notes

- **`base` path** in `vite.config.js` is set to `/music-app/` to match the GitHub Pages repository path
- **`homepage`** in `package.json` is set to `https://good12834.github.io/music-app`

---

## Edge Cases & Error Handling

The application handles numerous edge cases:

| Scenario | Handling |
|---|---|
| Audius API unavailable | Falls back to local proxy → direct API → static tracks |
| Image 503 errors | Detects consecutive failures, enters fallback mode, auto-recovers |
| Empty queue | Shows "Queue is empty" message with disabled controls |
| Single track in queue | Prevents removal of last track |
| Missing track metadata | Defaults to "Unknown Title", "Unknown Artist" |
| Web Audio API unavailable | Catches errors gracefully, continues with basic audio |
| Crossfade edge cases | Fade-in on track change, avoids volume conflict |
| Mobile detection | Responsive layouts with media query listeners |
| No search results | Shows "No results on Audius" message |
| Playlist edge cases | Overflow gradient for long playlists, expand/collapse |
| Sleep timer | Visual indicator when active, cancel option |
| Fullscreen errors | `.catch(() => {})` on request/exit calls |

---

## Performance

- **Canvas rendering**: Uses `requestAnimationFrame` with proper cleanup on unmount
- **FFT data**: Uses typed `Uint8Array` for efficient frequency data processing
- **Debounced search**: 400ms debounce on Audius search to reduce API calls
- **ResizeObserver**: Efficient canvas resize handling
- **Conditional rendering**: Minimizes re-renders with proper `useEffect` dependencies
- **Image caching**: Normal `<img>` elements leverage browser caching for Audius artwork

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Use functional components with hooks (no class components)
- Follow the existing dark theme design language
- Handle loading, empty, and error states for every component
- Test on both desktop and mobile viewports
- Keep the color palette consistent with existing themes

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Audius](https://audius.co) for the decentralized music streaming API
- [Lucide](https://lucide.dev) for the beautiful open-source icons
- [Vite](https://vitejs.dev) for the fast build tooling
- [React](https://reactjs.org) for the UI framework

---

**Built with using React, Vite, Web Audio API, and the Audius decentralized music network.**
