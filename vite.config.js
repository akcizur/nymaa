import { defineConfig } from 'vite';

function realScaleWorld() {
  return {
    name: 'nymaa-real-scale-world',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/src/main.js')) return null;

      // Keep the character at human scale. The previous visual problem was
      // primarily the camera being too close, which made a correctly sized
      // human fill most of the mobile viewport.
      let next = code.replace(
        'const PLAYER_HEIGHT = 1.80;',
        'const PLAYER_HEIGHT = 1.65;'
      );

      next = next.replace(
        /const BUILDINGS = \[(.*?)\n\];/s,
        (match, entries) => `const BUILDINGS = [${entries}\n].map(([x, z, w, h, d, color]) => [x, z, w * 1.35, h * 1.50, d * 1.35, color]);`
      );

      // Mobile third-person framing: move the camera back so the player has
      // believable scale relative to streets and buildings.
      next = next.replace('const dist = 13.0;', 'const dist = 23.0;');

      return { code: next, map: null };
    },
  };
}

export default defineConfig({
  base: '/nymaa/',
  plugins: [realScaleWorld()],
});
