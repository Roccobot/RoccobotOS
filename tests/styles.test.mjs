import test from 'node:test';
import assert from 'node:assert/strict';
import { readMetadata, validateUpload } from '../styles-core.mjs';

const valid = '/*\n#NAME: RoccobotOS Paper\n#VERSION: 1.40\n#NOTE: A paper palette.\n#COMMENT: Light and dark colours.\n*/\nbody { color: #303735; }';

test('reads Aomidori metadata without executing CSS', () => {
  assert.deepEqual(readMetadata(valid), { name: 'RoccobotOS Paper', version: '1.40', note: 'A paper palette.', comment: 'Light and dark colours.' });
});

test('accepts a new CSS file and preserves its source', () => {
  assert.equal(validateUpload('Paper.css', valid).content, valid);
});

test('rejects paths, missing metadata, oversized input and remote resources', () => {
  for (const name of ['../Paper.css', 'a/b.css', 'a.html', '.hidden.css']) assert.throws(() => validateUpload(name, valid));
  for (const content of ['body{}', valid + '@import "https://example.org/a.css";', valid + 'a{background:url(https://example.org/pixel)}', valid + '\\75rl(x)', valid + '/*'.repeat(140000)]) {
    assert.throws(() => validateUpload('Paper.css', content));
  }
});

test('rejects image-set resources whose URLs are written as strings', () => {
  for (const image of ['image-set("https://example.org/pixel.png" 1x)', '-webkit-image-set("https://example.org/pixel.png" 1x)', 'image("https://example.org/pixel.png")']) {
    assert.throws(() => validateUpload('Paper.css', valid + `body { background: ${image}; }`));
  }
});
