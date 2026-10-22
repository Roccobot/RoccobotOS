import { copyFile, mkdir } from 'node:fs/promises';
const target = new URL('../cloud/styles/public/', import.meta.url);
await mkdir(target, { recursive: true });
for (const name of ['manage.html', 'manage.mjs', 'manager.css']) await copyFile(new URL(`../Styles/admin/${name}`, import.meta.url), new URL(name, target));
await copyFile(new URL('../styles-core.mjs', import.meta.url), new URL('styles-core.mjs', target));
console.log('Risorse della pagina di gestione preparate.');
