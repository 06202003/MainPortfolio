# Master AI Prompt: "Beyond The Door" — Yehezkiel's Midnight Archive

> **Usage Instructions:** 
> Copy and paste this prompt into an AI Coding Assistant (e.g., Claude 3.5 Sonnet, ChatGPT, Cursor, Gemini) to generate the complete code for this interactive 3D portfolio project step-by-step.

---

## 🎯 Role & System Mission

You are an expert **Senior Creative Web Developer** and **Three.js / WebGL Architect**. 
Your goal is to build a high-performance, visually stunning, two-tier portfolio web application for **Yehezkiel** (Developer, Data Analyst, Researcher).

### Core Concept:
The website consists of two seamlessly integrated tiers:
1. **Tier 1: Minimalist HTML/CSS Portfolio (Landing Page)** — A clean, ultra-fast, professional portfolio.
2. **Tier 2: "Beyond The Door" 3D Midnight Archive** — A hidden, immersive Japanese rainy night alley built in Three.js, accessible only via a mysterious door in the navbar.

---

## 🏗️ Technical Stack & Project Structure

### Recommended Stack:
- **Core:** Vanilla HTML5, CSS3, JavaScript (ES6+ Modules) or Vite + Vanilla JS
- **3D Engine:** Three.js (WebGL) + OrbitControls / PointerLockControls
- **Animation:** GSAP (GreenSock) for camera transitions & UI micro-interactions
- **3D Formats:** GLTF / GLB with Draco compression + WebP textures
- **Audio:** Web Audio API / HTML5 Audio (Lo-fi background track & rain ambience)
- **Deployment:** Netlify static hosting compatible

### Target Directory Architecture:
```
/
├── index.html                  # Core entry point (Tier 1 Portfolio + 3D Canvas)
├── css/
│   ├── main.css                # Base & Tier 1 Portfolio styles
│   ├── transition.css          # Portal transition & overlay animations
│   └── modal.css               # Interactive modal & HUD UI overlay styles
├── js/
│   ├── app.js                  # Main app initialization & event routing
│   ├── ui/
│   │   ├── navbarDoor.js       # Secret door state, tooltips, and click handling
│   │   └── modalManager.js     # Interactive content overlays & easter egg HUDs
│   ├── transition/
│   │   └── portalTransition.js # GSAP camera zoom, blur, and 2D-to-3D transition
│   └── three/
│       ├── sceneManager.js     # Three.js Scene, Camera, Renderer, & Post-processing
│       ├── lighting.js         # Street lanterns, neon lights, reflections & fog
│       ├── weather.js          # Rain particle system & puddle shaders
│       ├── controls.js         # WASD + Mouse pointer lock & Mobile virtual joystick
│       ├── loader.js           # Lazy-loading manager with Draco GLTF support
│       ├── interactions.js     # Raycasting, hover outlines, & object click handlers
│       └── worldObjects.js     # Locations setup (Ramen Shop, Train, Arcade, etc.)
└── assets/
    ├── models/                 # Draco-compressed .glb models
    ├── textures/               # WebP textures (asphalt, wetness, neon)
    └── audio/                  # Rain loop, lo-fi track, door open sound
```

---

## 🚪 Tier 1: HTML Portfolio & Secret Door Entry Point

### Landing Page Requirements:
- Clean, minimalist aesthetic with dark-mode elegance, refined typography (Inter / Outfit font), and generous whitespace.
- Sections: `About`, `Skills`, `Experience`, `Projects`, `Research / Publications`, `Contact`.
- Fast initial page load: **ZERO 3D assets or Three.js bundles loaded initially.**

### Mysterious Navbar Door:
- **Location:** Top-left of the main navigation bar (`🚪` icon or SVG custom wooden door icon).
- **Idle State:** Subtle glow animation (`box-shadow` or CSS keyframe pulse).
- **Hover State:** Tooltip popup: *"Open another world"* or *"Enter my hidden archive"*.
- **Click Action:** Triggers `portalTransition.js`.

### Portal Transition Logic:
1. **Phase 1 (0.0s - 0.8s):** Door icon unlatches, soft wooden creak sound plays, page background darkens with radial vignette.
2. **Phase 2 (0.8s - 1.8s):** GSAP camera zoom into door icon, canvas overlay applies CSS `blur()` and `fade-to-black`.
3. **Phase 3 (1.8s+):** Lazy-loads Three.js module & 3D assets via `loader.js` (with a stylized minimalist progress bar if needed). Once ready, fades into the 3D scene at **Location 1 (Entrance Door)**.

---

## 🌃 Tier 2: 3D Midnight Alley Blueprint

### Atmosphere & Environment Settings:
- **Setting:** Japanese-inspired narrow midnight alley (Tokyo lo-fi night aesthetic).
- **Mood:** Calm, mysterious, cinematic, rainy, cozy.
- **Lighting Palette:**
  - Warm Orange (`#ff7700`) lantern glow.
  - Electric Blue (`#00f0ff`) & Neon Purple (`#b000ff`) accent lights.
  - Dark Midnight Navy (`#050814`) background sky & fog.
- **Weather Effects:**
  - Dynamic GPU particle rain system falling gently.
  - Wet asphalt ground plane with low roughness & specular reflectivity.
  - Atmospheric height fog (`Three.FogExp2`) for depth.

### Player Controls & Camera System:
- **Desktop:** WASD / Arrow Keys movement + Mouse PointerLock or Smooth Orbit Controls bounded within alley constraints.
- **Mobile:** On-screen virtual joystick (left side) + Touch swipe camera look (right side).
- **Navigation HUD:** Permanent "Return to Web Portfolio" door button in top corner.

---

## 📍 Interactive Locations Matrix

| Location ID | 3D Props / Scene Setup | Target Portfolio Content | Interactive Action & UI Overlay |
| :--- | :--- | :--- | :--- |
| **Loc 1: Portal Door** | Mysterious wooden door behind player, stone path entrance | **Welcome / Return Portal** | Click door behind to transition back to 2D portfolio landing page. |
| **Loc 2: Ramen Shop** | Wooden counter, illuminated menu board, laptop, steam particles | **About Me** | Click laptop / profile card to view Yehezkiel's bio: *Developer, Data Analyst, Researcher — Building things through curiosity.* |
| **Loc 3: Train Station** | Train carriage, station signboards, platform clock | **Experience Timeline** | Click carriage doors / signboards to view career timeline (2021: Started Coding, 2022: Laravel, 2025: AI Research). |
| **Loc 4: Arcade Room** | Retro arcade cabinets with flickering screens | **Projects Showcase** | Click arcade cabinet screens to launch interactive project cards (*AI Feedback System*, *Data Analytics Platform*). |
| **Loc 5: Library / Bookshelf** | Wooden bookshelf, desk lamp, glowing leather-bound books | **Research & Thesis** | Click glowing books to read summaries (*AI Education*, *Synthetic Data*, *Machine Learning*, *Data Analytics*). |
| **Loc 6: Rooftop Terrace** | Rooftop edge, rainy city skyline view, glowing neon sign | **Contact & Socials** | Click neon billboard to open contact card with direct links to Email, LinkedIn, and GitHub. |

---

## 🎁 Hidden Easter Eggs

1. **Stray Alley Cat:**
   - **Prop:** Small low-poly cat sitting near vending machine.
   - **Trigger:** Raycast click.
   - **Effect:** Plays subtle *Meow* audio + Toast notification: *"Achievement Unlocked: Curious Explorer"*.
2. **Japanese Vending Machine:**
   - **Prop:** Illuminated drink vending machine with interactive buttons (`Coffee`, `Tea`, `Mystery`).
   - **Trigger:** Click `Mystery` button.
   - **Effect:** Dispenses glowing can + unlocks special secret note modal.
3. **Lo-Fi Alley Radio:**
   - **Prop:** Vintage boombox sitting on a wooden crate.
   - **Trigger:** Click radio to toggle audio.
   - **Effect:** Play / Pause ambient lo-fi music track with custom UI volume slider in HUD.

---

## ⚡ Performance & Optimization Guidelines

1. **Lazy Loading Execution:**
   - Three.js library and GLTF assets MUST NOT load on `DOMContentLoaded`.
   - Only import Three.js dynamically when the navbar door is clicked:
     ```js
     const { initThreeWorld } = await import('./three/sceneManager.js');
     ```
2. **Asset Optimization:**
   - Compress all `.gltf`/`.glb` models using **Draco** mesh compression.
   - Compress all texture images to `.webp` format (max size 1024x1024 / 2048x2048 for ground).
3. **Memory Management (CRITICAL):**
   - Dispose of geometries, materials, and textures when returning to Tier 1 portfolio to prevent memory leaks.
4. **FPS & Rendering:**
   - Implement `requestAnimationFrame` loop with delta time capping (target 60 FPS).
   - Use low polygon counts for non-essential street props.

---

## 🚀 Step-by-Step Implementation Roadmap for AI Agent

When generating code, execute in this order:

- [ ] **Phase 1: Tier 1 Portfolio Base** — Build semantic `index.html` and `main.css` for clean 2D portfolio with top-left navbar door.
- [ ] **Phase 2: Transition & Lazy Loader** — Build `portalTransition.js` with GSAP camera zoom, dark vignette, and dynamic JS module import.
- [ ] **Phase 3: Core Three.js Setup** — Build `sceneManager.js`, `lighting.js`, `weather.js` (rain particles + wet asphalt shader).
- [ ] **Phase 4: Scene Geometry & Procedural Props** — Construct the alley structure, Ramen shop, Train station, Arcade cabinets, Library desk, and Rooftop.
- [ ] **Phase 5: Camera Controls & Raycasting** — Implement pointer lock / joystick controls and hover highlight shaders (`interactions.js`).
- [ ] **Phase 6: Content Modals & HUD** — Build responsive glassmorphism modal overlays for portfolio content (About, Timeline, Projects, Research, Contact).
- [ ] **Phase 7: Easter Eggs & Audio** — Add Cat meow, Vending machine mystery, and Lo-fi radio Web Audio player.
- [ ] **Phase 8: Polish & Netlify Audit** — Verify lazy loading, test mobile responsive touch, and run memory cleanup check.