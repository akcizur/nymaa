import { defineConfig } from 'vite';

function realScaleWorld() {
  return {
    name: 'nymaa-real-scale-world',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/src/main.js')) return null;

      // The imported human is visually too large against the original blockout.
      // Keep the gameplay collision radius intact while fitting the visible model
      // to a slightly smaller human reference and increasing the placeholder
      // architecture to believable proportions.
      let next = code.replace(
        'const PLAYER_HEIGHT = 1.80;',
        'const PLAYER_HEIGHT = 1.65;'
      );

      next = next.replace(
        /const BUILDINGS = \[(.*?)\n\];/s,
        (match, entries) => `const BUILDINGS = [${entries}\n].map(([x, z, w, h, d, color]) => [x, z, w * 1.35, h * 1.50, d * 1.35, color]);`
      );

      return { code: next, map: null };
    },
  };
}

export default defineConfig({
  base: '/nymaa/',
  plugins: [realScaleWorld()],
});
