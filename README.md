# NIERO.EXE — Interactive 3D World Portfolio

An interactive low-poly 3D world portfolio for **Olabode Olaniyi David (NIERO.EXE)**, Full Stack Software Engineer. Drive a customizable vehicle through a stylized world to discover projects, experience, and skills.

## 🎮 Features

- **Explorable 3D World** — Drive through a procedural low-poly landscape with terrain, roads, rivers, and bridges
- **12 Unique Thematic Landmarks** — Each project represented as a distinct 3D object (globe, kiosk, terminal, vault, tower, gateway, trophy, etc.)
- **4 Drivable Vehicle Models** — Dune Buggy, Cyber Roadster, Lunar Explorer, Turbo Cruiser
- **5 World Themes** — Obsidian Twilight, Sahara Sunset, Emerald Aurora, Deep Oceanic, Synthwave Noir
- **Real Lagos Weather Sync** — 3D world atmosphere mirrors actual Lagos, Nigeria weather (via Open-Meteo)
- **Time-Trial Racing** — Checkpoint circuit with lap timing and leaderboards
- **Cinematic Drone Tour** — Auto-flying showcase through all projects
- **Auto-Drive Mode** — Autonomous cruise between all landmarks
- **6 Collectible Tech Tokens** — TypeScript, React/Three.js, Node.js, PostgreSQL/Redis, Docker/AWS, WebSockets
- **Achievement System** — Speed Demon, Drift Master, Master Explorer, Tech Collector, and more
- **Full Portfolio Modal** — About, Projects, Experience, Skills, Resume (PDF), Contact
- **Mobile Touch Controls** — Full on-screen controls for mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **3D Engine**: Three.js (r187) with custom game loop
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion (`motion`)
- **Icons**: Lucide React
- **Audio**: Web Audio API (procedural synthesis)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+

### Installation

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm run dev
```

### Build for Production

```bash
npm run build
```

Output goes to `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 🎮 Controls

| Key | Action |
|-----|--------|
| `W` / `↑` | Accelerate |
| `S` / `↓` | Brake / Reverse |
| `A` / `←` | Steer Left |
| `D` / `→` | Steer Right |
| `Space` | Handbrake |
| `Shift` / `N` | Nitro Boost |
| `Z` | Toggle Auto-Drive |
| `R` | Reset Vehicle |
| `E` | Interact with Landmark |
| `H` | Toggle Header Bar |
| Mouse Drag | Orbit Camera |
| Scroll | Zoom Camera |

### Mobile
On-screen touch controls appear automatically on touch devices.

## 🌍 Live Weather Integration

The portfolio fetches real-time weather from **Open-Meteo** for Lagos, Nigeria (coordinates: 6.5244, 3.3792). The 3D world's atmosphere (sky, lighting, rain particles) strictly reflects actual conditions. Updates every 5 minutes.

## 📦 Project Structure

```
src/
├── game/                 # Core 3D engine systems
│   ├── engine.ts         # Main orchestrator
│   ├── vehicle.ts        # Vehicle physics & models
│   ├── terrain.ts        # Procedural terrain & heightmap
│   ├── landmarks.ts      # Project landmarks & tokens
│   ├── camera.ts         # Chase camera & cinematic modes
│   ├── weather.ts        # Dynamic weather system
│   ├── race.ts           # Time-trial racing
│   ├── tour.ts           # Cinematic drone tour
│   ├── autodrive.ts      # Autonomous driving
│   ├── audio.ts          # Web Audio synthesis
│   ├── environment.ts    # Trees, rocks, ambient details
│   ├── nitroParticles.ts # Nitro particle effects
│   └── constants.ts      # Palette, configs, themes
├── components/           # React UI components
│   ├── HUD.tsx           # Main HUD overlay
│   ├── ProjectModal.tsx  # Project detail view
│   ├── PortfolioModal.tsx# Full portfolio tabs
│   ├── CustomizerModal.tsx# Vehicle & theme customizer
│   ├── Minimap.tsx       # Radar minimap
│   └── ...               # Other UI components
├── data/
│   └── portfolioData.ts  # Projects, experience, skills, tokens
├── services/
│   └── lagosWeather.ts   # Open-Meteo weather integration
├── App.tsx               # Main app component
└── main.tsx              # Entry point
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy

The `vercel.json` handles SPA routing and asset caching.

### Other Static Hosts

The build output in `dist/` is a standard static site. Deploy to Netlify, Cloudflare Pages, GitHub Pages, etc.

## 📄 License

MIT License — feel free to use as inspiration for your own portfolio!

---

**Built with ❤️ by Olabode Olaniyi David**  
📍 Lagos, Nigeria • [GitHub](https://github.com/nierowheezy) • [LinkedIn](https://www.linkedin.com/in/olabode-olaniyi-david)