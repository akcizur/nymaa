import { defineConfig } from 'vite';

function realScaleWorld() {
  return {
    name: 'nymaa-real-scale-world',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/src/main.js')) return null;

      let next = code
        .replace('const PLAYER_HEIGHT = 1.80;', 'const PLAYER_HEIGHT = 1.72;')
        .replace('const WALK_SPEED = 5.00;', 'const WALK_SPEED = 1.60;')
        .replace('const RUN_SPEED = 7.20;', 'const RUN_SPEED = 4.80;')
        .replace('const WALK_ANIM_SPEED = 5.00;', 'const WALK_ANIM_SPEED = 1.60;')
        .replace('const RUN_ANIM_SPEED = 7.20;', 'const RUN_ANIM_SPEED = 4.80;');

      next = next.replace(
        /const BUILDINGS = \[(.*?)\n\];/s,
        (match, entries) => `const BUILDINGS = [${entries}\n].map(([x, z, w, h, d, color]) => [x, z, w * 2.0, h * 1.65, d * 2.0, color]);`
      );

      return { code: next, map: null };
    },
  };
}

export default defineConfig({
  base: '/nymaa/',
  plugins: [realScaleWorld()],
});
