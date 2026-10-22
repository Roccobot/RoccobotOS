/* Keep the selector in a shadow tree so experimental styles cannot restyle its controls. */
const activeLink = document.querySelector('link[data-site-style]');
const triggers = [...document.querySelectorAll('[data-style-picker]')];
if (activeLink && triggers.length) initialize();

async function initialize() {
  const rootURL = new URL('./Styles/', import.meta.url);
  const host = document.createElement('roccobot-style-picker');
  const shadow = host.attachShadow({ mode: 'open' });
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = new URL('./style-switcher.css', import.meta.url).href;
  shadow.append(css);
  const make = (tag, text, attributes = {}) => {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, value);
    return el;
  };
  const dialog = make('dialog', '', { 'aria-labelledby': 'style-title', 'aria-describedby': 'style-help' });
  const header = make('header');
  const title = make('h2', 'Aspetto', { id: 'style-title' });
  const close = make('button', '×', { type: 'button', 'aria-label': 'Chiudi il selettore' });
  header.append(title, close);
  const hint = make('p', 'Scegli uno stile e guarda la pagina cambiare.', { id: 'style-help' });
  const list = make('div', '', { role: 'listbox', 'aria-label': 'Stili disponibili', tabindex: '0' });
  const status = make('p', '', { role: 'status', 'aria-live': 'polite', class: 'status' });
  const footer = make('footer');
  footer.append(make('span', '↑ ↓ Anteprima · Invio Chiudi · Esc Annulla'));
  dialog.append(header, hint, list, status, footer);
  shadow.append(dialog);
  document.body.append(host);

  let catalog, catalogLoad, current = activeLink, selected = -1, initial = -1, sequence = 0, pending;
  let returnFocus;
  const options = [];
  const colorScheme = () => { host.dataset.theme = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); };
  colorScheme();
  new MutationObserver(colorScheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', colorScheme);

  function paint(index) {
    for (let i = 0; i < options.length; i++) options[i].setAttribute('aria-selected', String(i === index));
    if (options[index]) {
      list.setAttribute('aria-activedescendant', options[index].id);
      options[index].scrollIntoView({ block: 'nearest' });
    }
  }

  function cancelPending() {
    sequence++;
    if (pending) { pending.remove(); pending = undefined; }
    list.removeAttribute('aria-busy');
  }

  function apply(index) {
    cancelPending();
    if (!catalog?.[index]) return;
    selected = index;
    paint(index);
    const url = new URL(catalog[index].file, rootURL).href;
    if (current.href === url) { status.textContent = `${catalog[index].name} ${catalog[index].version}`; return; }
    const request = sequence;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.media = 'not all';
    link.href = url;
    pending = link;
    list.setAttribute('aria-busy', 'true');
    status.textContent = 'Caricamento...';
    const finish = success => {
      if (request !== sequence) return;
      clearTimeout(timeout);
      pending = undefined;
      list.removeAttribute('aria-busy');
      if (success) {
        link.media = 'all';
        link.dataset.siteStyle = '';
        current.remove();
        current = link;
        status.textContent = `${catalog[index].name} ${catalog[index].version}`;
      } else {
        link.remove();
        selected = catalog.findIndex(item => new URL(item.file, rootURL).href === current.href);
        paint(selected);
        status.textContent = 'Lo stile non si carica. La pagina conserva quello precedente.';
      }
    };
    const timeout = setTimeout(() => finish(false), 10000);
    link.addEventListener('load', () => finish(true), { once: true });
    link.addEventListener('error', () => finish(false), { once: true });
    current.after(link);
  }

  function dismiss(cancel = false) {
    if (cancel) apply(initial);
    dialog.close();
    for (const trigger of triggers) trigger.setAttribute('aria-expanded', 'false');
    returnFocus?.focus({ preventScroll: true });
  }

  async function open(event) {
    returnFocus = event.currentTarget;
    if (!dialog.open) dialog.showModal();
    for (const trigger of triggers) trigger.setAttribute('aria-expanded', 'true');
    list.focus();
    if (!catalog) {
      status.textContent = 'Caricamento degli stili...';
      try {
        if (!catalogLoad) catalogLoad = (async () => {
          const response = await fetch(new URL('index.json', rootURL));
          if (!response.ok) throw new Error('catalog');
          const data = await response.json();
          if (!Array.isArray(data.styles)) throw new Error('catalog');
          catalog = data.styles.filter(item => /^[A-Za-z0-9][A-Za-z0-9_-]*\.css$/.test(item.file) && typeof item.name === 'string' && typeof item.version === 'string');
          if (!catalog.length) throw new Error('catalog');
          for (const [index, item] of catalog.entries()) {
            const option = make('div', '', { role: 'option', id: `style-${index}`, 'aria-selected': 'false' });
            const swatch = make('span', '', { class: 'swatch', 'aria-hidden': 'true' });
            const text = make('span');
            text.append(make('strong', item.name));
            option.append(swatch, text, make('span', item.version, { class: 'version' }));
            option.addEventListener('click', () => apply(index));
            list.append(option);
            options.push(option);
          }
        })();
        await catalogLoad;
      } catch {
        catalog = undefined;
        catalogLoad = undefined;
        status.textContent = 'Elenco non disponibile. Chiudi e riprova.';
        return;
      }
    }
    if (!dialog.open) return;
    selected = catalog.findIndex(item => new URL(item.file, rootURL).href === current.href);
    initial = selected;
    paint(selected);
    status.textContent = '';
  }

  for (const trigger of triggers) {
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', open);
  }
  close.addEventListener('click', () => dismiss());
  dialog.addEventListener('cancel', event => { event.preventDefault(); dismiss(true); });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dismiss(); } });
  list.addEventListener('keydown', event => {
    if (!catalog) return;
    let index;
    if (event.key === 'ArrowDown') index = (selected + 1) % catalog.length;
    else if (event.key === 'ArrowUp') index = (selected - 1 + catalog.length) % catalog.length;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = catalog.length - 1;
    else if (event.key === 'Enter') { event.preventDefault(); dismiss(); return; }
    if (index !== undefined) { event.preventDefault(); apply(index); }
  });
}
