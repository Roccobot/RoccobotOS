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
