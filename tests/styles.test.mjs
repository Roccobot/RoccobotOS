import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { compareStyles, readMetadata } from '../styles-core.mjs';

const valid = '/*\n#NAME: RoccobotOS Paper\n#VERSION: 1.40\n#NOTE: A paper palette.\n#COMMENT: Light and dark colours.\n*/\nbody { color: #303735; }';

test('reads Aomidori metadata without executing CSS', () => {
  assert.deepEqual(readMetadata(valid), { name: 'RoccobotOS Paper', version: '1.40', note: 'A paper palette.', comment: 'Light and dark colours.' });
});

test('reads the Roccobot MD header and version 0.9', () => {
  const classic = '/*\n#NAME: Roccobot MD\n#VERSION: 0.9\n#NOTE: Default style.\n#COMMENT: Light and dark colours.\n*/\nbody { color: #303735; }';
  assert.equal(readMetadata(classic).version, '0.9');
});

test('the catalogue keeps Roccobot MD first, then orders by name', () => {
  const styles = [{ file: 'Zzz.css', name: 'Zzz' }, { file: 'Aaa.css', name: 'Aaa' }, { file: 'RoccobotMD.css', name: 'Roccobot MD' }];
  assert.deepEqual(styles.sort(compareStyles).map(style => style.file), ['RoccobotMD.css', 'Aaa.css', 'Zzz.css']);
});

test('styles/index.json lists exactly the CSS files of styles/, with their own metadata', async () => {
  const folder = new URL('../styles/', import.meta.url);
  const files = (await readdir(folder)).filter(name => name.endsWith('.css')).sort();
  const catalogue = JSON.parse(await readFile(new URL('index.json', folder), 'utf8')).styles;
  assert.deepEqual(catalogue.map(style => style.file).sort(), files);
  for (const style of catalogue) assert.deepEqual({ ...style }, { file: style.file, ...readMetadata(await readFile(new URL(style.file, folder), 'utf8')) });
});
