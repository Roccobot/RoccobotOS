/* Read shared theme metadata without interpreting the stylesheet. */
export function readMetadata(source) {
  const header = /^\uFEFF?\s*\/\*([\s\S]*?)\*\//.exec(source)?.[1];
  if (!header) throw new Error('Manca l\'intestazione dello stile.');
  const result = {};
  for (const [key, field] of [['NAME', 'name'], ['VERSION', 'version'], ['NOTE', 'note'], ['COMMENT', 'comment']]) {
    const matches = [...header.matchAll(new RegExp(`^#${key}:\\s*(.+)$`, 'gm'))];
    if (matches.length !== 1 || matches[0][1].trim().length > 200) throw new Error(`Intestazione non valida: #${key}.`);
    result[field] = matches[0][1].trim();
  }
  if (!/^\d+\.\d{1,2}$/.test(result.version)) throw new Error('Usa una versione nel formato 1.40.');
  return result;
}

/* Order the catalogue: the default Roccobot MD style first, then by name and file. */
const PINNED_STYLE = 'RoccobotMD.css';
export function compareStyles(a, b) {
  return (b.file === PINNED_STYLE) - (a.file === PINNED_STYLE) || a.name.localeCompare(b.name, 'it') || a.file.localeCompare(b.file);
}

/* Accept self-contained styles and restrict uploads to a single directory. */
export function validateUpload(filename, content) {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}\.css$/.test(filename)) throw new Error('Il nome deve terminare in .css e contenere solo lettere, numeri, trattini o underscore.');
  if (typeof content !== 'string' || new TextEncoder().encode(content).length > 262144) throw new Error('Il limite per ogni stile è 256 KiB.');
  const metadata = readMetadata(content);
  const decoded = content.replace(/\\([\da-f]{1,6})\s?/gi, (_, hex) => String.fromCodePoint(Math.min(parseInt(hex, 16), 0x10ffff))).replace(/\\(.)/gs, '$1');
  const css = decoded.replace(/\/\*[\s\S]*?\*\//g, '');
  if (/@import\b|\b(?:url|image|(?:-webkit-)?image-set)\s*\(|expression\s*\(|-moz-binding|\bbehavior\s*:/i.test(css)) throw new Error('Lo stile deve essere autonomo: importa nel file le regole e rimuovi le risorse esterne.');
  let quote = '', comment = false, escaped = false;
  const stack = [];
  for (let i = 0; i < content.length; i++) {
    const c = content[i], next = content[i + 1];
    if (comment) { if (c === '*' && next === '/') { comment = false; i++; } continue; }
    if (quote) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === quote) quote = '';
      continue;
    }
    if (c === '/' && next === '*') { comment = true; i++; }
    else if (c === '"' || c === "'") quote = c;
    else if ('{(['.includes(c)) stack.push(c);
    else if ('})]'.includes(c) && stack.pop() !== { '}': '{', ')': '(', ']': '[' }[c]) throw new Error('Il CSS contiene parentesi non bilanciate.');
  }
  if (quote || comment || stack.length) throw new Error('Il CSS contiene un blocco, un commento o una stringa non chiusi.');
  return { filename, content, ...metadata };
}
