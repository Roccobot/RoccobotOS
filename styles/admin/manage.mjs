import { validateUpload } from './styles-core.mjs';

const byId = id => document.getElementById(id);
const status = byId('status');
const queue = [];
let csrf, publishing = false;

async function api(path, options = {}) {
  const response = await fetch(path, { credentials: 'same-origin', ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Il servizio non risponde. Riprova.');
  return data;
}

async function start() {
  try {
    const config = await api('./config.json');
    if (!config.apiBase) {
      byId('identity').textContent = 'Il caricamento con GitHub deve ancora essere attivato.';
      status.textContent = 'Il selettore degli stili è già disponibile. Il servizio di accesso richiede la configurazione della GitHub App.';
      return;
    }
    const service = new URL(config.apiBase);
    if (service.protocol !== 'https:' || service.username || service.password || service.pathname !== '/') throw new Error('Indirizzo del servizio non valido.');
    if (service.origin !== location.origin) { location.replace(new URL('/manage.html', service)); return; }
    byId('login').href = '/auth/login';
    try {
      const session = await api('/auth/session');
      csrf = session.csrf;
      byId('identity').textContent = `Accesso come ${session.user.login}`;
      byId('logout').hidden = false;
      byId('upload').hidden = false;
    } catch {
      byId('identity').textContent = 'Accedi con il tuo account GitHub per aggiungere uno stile.';
      byId('login').hidden = false;
    }
    const reason = new URL(location.href).searchParams.get('error');
    if (reason) status.textContent = 'Accesso non riuscito. Verifica di usare l\'account Roccobot e riprova.';
  } catch (error) { byId('identity').textContent = 'Accesso non disponibile.'; status.textContent = error.message; }
}

function render() {
  byId('queue').replaceChildren();
  for (const item of queue) {
    const li = document.createElement('li');
    li.textContent = item.filename;
    const detail = document.createElement('small');
    detail.textContent = item.result || `${item.name} ${item.version}`;
    li.append(detail);
    byId('queue').append(li);
  }
  byId('publish').disabled = publishing || !queue.some(item => !item.done);
}

async function add(files) {
  if (publishing) return;
  for (const file of files) {
    try {
      if (file.size > 262144) throw new Error('Il limite per ogni stile è 256 KiB.');
      if (queue.some(item => item.filename === file.name)) throw new Error('Questo nome è già nella lista.');
      const item = validateUpload(file.name, await file.text());
      queue.push(item);
      status.textContent = '';
    } catch (error) { status.textContent = `${file.name}: ${error.message}`; }
  }
  render();
}

byId('files').addEventListener('change', event => add(event.target.files));
byId('drop').addEventListener('keydown', event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); byId('files').click(); } });
for (const type of ['dragenter', 'dragover']) byId('drop').addEventListener(type, event => { event.preventDefault(); byId('drop').classList.add('drag'); });
for (const type of ['dragleave', 'drop']) byId('drop').addEventListener(type, event => { event.preventDefault(); byId('drop').classList.remove('drag'); });
byId('drop').addEventListener('drop', event => add(event.dataTransfer.files));
byId('publish').addEventListener('click', async () => {
  publishing = true;
  render();
  for (const item of queue.filter(item => !item.done)) {
    item.result = 'Caricamento...'; render();
    try {
      await api('/styles', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify({ filename: item.filename, content: item.content }) });
      item.done = true; item.result = 'Aggiunto alla raccolta.';
    } catch (error) { item.result = error.message; }
    render();
  }
  publishing = false;
  render();
  status.textContent = queue.every(item => item.done) ? 'Stili salvati. Dopo la pubblicazione di GitHub Pages saranno disponibili nel selettore.' : 'Alcuni file non sono stati aggiunti. Controlla i messaggi nella lista.';
});
byId('logout').addEventListener('click', async () => {
  try { await api('/auth/logout', { method: 'POST', headers: { 'X-CSRF-Token': csrf } }); location.reload(); }
  catch (error) { status.textContent = error.message; }
});
start();
