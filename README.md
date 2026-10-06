# Nymaa — Godot 4 Top-Down City

Godot 4.x rewrite of the original GTA-style top-down blockout.

## Gameplay

- top-down city blockout
- 13 simple building colliders
- 4 roads
- walkable player
- drivable arcade car
- enter / exit with E
- touch joystick on phones and tablets
- touch action button
- interpolated top-down camera
- Compatibility renderer for lightweight Web/WebGL deployment

## Local

Open the project in Godot 4.6.x and run Main.tscn.

## Controls

Desktop:
- WASD / arrow keys — move
- E — enter / exit car

Mobile:
- left joystick — walk / drive
- right E button — enter / exit

## GitHub Pages

Pushing to main runs a GitHub Actions Web export with Godot 4.6.3 and deploys the generated build to GitHub Pages.

The Web preset is single-threaded. Godot documents single-threaded Web export as the broadly compatible option because threaded builds require cross-origin isolation headers.
