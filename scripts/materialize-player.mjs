import fs from 'node:fs/promises';

const input = new URL('../public/assets/player/demo-avatar.glb.b64', import.meta.url);
const output = new URL('../public/assets/player/demo-avatar.glb', import.meta.url);

const base64 = (await fs.readFile(input, 'utf8')).replace(/\s/g, '');
const binary = Buffer.from(base64, 'base64');

await fs.writeFile(output, binary);
console.log(`Player GLB materialized: ${output.pathname} (${binary.length} bytes)`);
