# Nymaa — GTA-style Top-Down Game

A small Three.js blockout focused on the core loop:

- top-down city
- walkable player
- drivable car
- building AABB collisions
- enter / exit vehicle
- desktop keyboard controls
- touch joystick controls for phones and tablets
- mobile renderer optimizations
- automatic GitHub Pages build and deployment

## Development

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm run preview
```

GitHub Actions builds `dist/` on every push to `main` and deploys it to GitHub Pages.

## Controls

Desktop: WASD / arrows to move or drive, E to enter/exit.

Touch: drag the left joystick to move/drive. The contextual ENTER/EXIT button appears when available.
