import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { compareStyles, readMetadata } from '../styles-core.mjs';

const directory = new URL('../styles/', import.meta.url);
const files = (await readdir(directory)).filter(name => /^[A-Za-z0-9][A-Za-z0-9_-]*\.css$/.test(name)).sort();
const styles = await Promise.all(files.map(async file => ({ file, ...readMetadata(await readFile(new URL(file, directory), 'utf8')) })));
styles.sort(compareStyles);
await writeFile(new URL('index.json', directory), JSON.stringify({ styles }, null, 2) + '\n');
console.log(`Catalogo aggiornato: ${styles.length} stili in ${fileURLToPath(directory)}.`);
