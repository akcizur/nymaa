# Nymaa — Unreal Engine 5 Top-Down

Minimal UE5 C++ blockout of a GTA-style top-down city.

## Included

- procedural 100 m city blockout
- 13 simple buildings
- 4 roads
- player pawn with capsule collision
- drivable arcade car
- enter / exit with E
- top-down follow camera
- keyboard WASD / arrows
- touch joystick + touch enter/exit
- no external art assets

## Open

1. Install Unreal Engine 5.6.
2. Clone the repository.
3. Right-click Nymaa.uproject and generate project files.
4. Open Nymaa.uproject.
5. Build Development Editor.
6. Play.

The map is generated entirely from C++ when the game starts.

## Controls

Desktop:
- W / S or Up / Down — move / throttle
- A / D or Left / Right — strafe / steer
- E — enter / exit car

Mobile:
- left side touch drag — move / drive
- bottom-right action zone — enter / exit

## Browser

This is a native Unreal Engine project, not a Vite/web build. GitHub Pages cannot run the Unreal runtime directly. A future browser version would use Pixel Streaming or a separate web implementation.
