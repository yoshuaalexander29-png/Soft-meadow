# Wild Meadow (React + Three.js)

An interactive 3D fantasy meadow encounter built with **React**, **TypeScript**, **Vite**, and **Three.js**.

This project was rewritten from the original Dynamic/vanilla WebGL build into a modern, component-driven React application while fully preserving the core features, cinematic choreography, and visual identity.

## Features

- **Interactive 3D Meadow Scene:**
  - Procedural terrain elevation with low-poly hills and distant mountain ranges.
  - Procedural stylized trees with multi-layered foliage crowns.
  - 4,500 instanced grass blades with subtle ambient wind sway.
  - Clustered meadow flower patches and contact shadows.
  - Dynamic sun directional lighting with soft shadow mapping and hemisphere fill lighting.
- **Hero Characters & Weapon (CC0 GLB Assets):**
  - **Forest Wanderer:** Quaternius `Characters_Lis.glb` with idle animation.
  - **Silverland Knight:** Quaternius `Knight_Male.glb` with idle animation.
  - **Golden Sword Prop:** Quaternius `Sword_Gold.glb`.
- **Cinematic Camera Choreography:**
  - 5 sequential camera shots spanning a 20-second timeline with smooth ease-in-out interpolation.
  - Dynamic narrative captions that transition as the sequence unfolds.
  - Manual camera shot switching (`Next shot ↗`).
  - Interactive pointer drag orbit controls (yaw & pitch).
  - Playback control (`Restart`, `Pause` / `Resume`).
- **Responsive Atmospheric HUD:**
  - Frosted glass brand plate with serif typography and gold accents.
  - Asset loading status toast with smooth fade-out upon completion.
  - Graceful asset error recovery banner.

## Tech Stack

- **React 19**
- **TypeScript**
- **Vite**
- **Three.js (with GLTFLoader)**
- **Tailwind CSS**

## Getting Started

To run the development server locally:

```bash
npm install
npm run dev
```

To build for production:

```bash
npm run build
```

To run TypeScript verification:

```bash
npm run lint
```

## Asset Provenance & Attribution

- External character and weapon models are created by **Quaternius** under the **CC0 1.0 Universal** public domain dedication. See `ASSET_MANIFEST.md` for complete details.
