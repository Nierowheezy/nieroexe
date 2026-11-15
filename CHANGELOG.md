# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2026-11-12

### Added
- **Real-time Lagos Weather Integration** — Live weather sync from Open-Meteo API for Lagos, Nigeria (6.5244, 3.3792)
  - 3D world atmosphere strictly mirrors actual Lagos conditions (rain, overcast, sunny)
  - Hourly forecast dropdown with morning, afternoon, evening, night predictions
  - Auto-refresh every 5 minutes with manual refresh button
  - Live West Africa Time (WAT) clock in header
- **Cinematic Drone Tour** — Auto-flying showcase camera that visits all 12 project landmarks
- **Autonomous Auto-Drive Mode** — Vehicle automatically cruises between all projects (toggle with Z key)
- **Time-Trial Racing System** — Checkpoint circuit with lap timing, personal bests, and boost pads
- **6 Collectible Tech Tokens** — Hidden tokens representing core engineering skills (TypeScript, React/Three.js, Node.js, PostgreSQL/Redis, Docker/AWS, WebSockets)
- **Achievement System** — 8 unlockable achievements (Speed Demon, Drift Master, Master Explorer, Tech Collector, etc.)
- **5 World Themes** — Complete palette swaps: Obsidian Twilight, Sahara Sunset, Emerald Aurora, Deep Oceanic, Synthwave Noir
- **4 Drivable Vehicle Models** — Dune Buggy, Cyber Roadster, Lunar Explorer, Turbo Cruiser with unique physics
- **Custom Vehicle Paint Colors** — 8 color options with live preview
- **Procedural Low-Poly World** — Terrain with roads, river, bridge, mountains (no external 3D assets)
- **Full Portfolio Modal** — 6 tabs: About, Projects (12), Experience (8), Skills (6 categories), Resume, Contact
- **Mobile Touch Controls** — Full on-screen controls for touch devices
- **Web Audio Synthesis** — Procedural engine, wind, nitro, brake, and UI sounds (zero audio files)
- **Collapsible UI** — Header bar, minimap radar, bottom dock all hideable for cinema mode

### Changed
- Removed external AI dependencies
- Updated build configuration for standard Vite deployment
- Improved vehicle physics with suspension lean and Ackermann-style steering
- Enhanced collision detection with obstacle pushback
- Optimized Three.js rendering with software WebGL detection

### Fixed
- Nitro boost charge/drain smoothing
- Camera orbit panning during driving
- Token collection detection radius
- Weather state synchronization with 3D world

## [2.1.0] - 2026-10-15

### Added
- Initial 3D world with procedural terrain
- 12 thematic project landmarks (globe, kiosk, terminal, vault, switch, monolith, tower, gateway, badge)
- Basic vehicle physics (buggy model)
- Portfolio data from resume
- Basic HUD with speedometer and token counter

## [2.0.0] - 2026-09-01

### Added
- Project conception and architecture
- Three.js + React + TypeScript setup
- Core game engine loop
- Basic camera controller

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 2.2.0 | 2026-11-12 | Weather sync, drone tour, auto-drive, racing, tokens, achievements, themes |
| 2.1.0 | 2026-10-15 | Landmarks, vehicle physics, portfolio modal |
| 2.0.0 | 2026-09-01 | Initial architecture |