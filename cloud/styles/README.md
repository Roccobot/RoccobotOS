# 🔐 Gestione degli stili

Il Worker permette al solo account GitHub con ID `10722164` (Roccobot) di aggiungere file CSS in `Roccobot/RoccobotOS`, repository ID `1389294896`, sul ramo `main`. Il codice è predisposto per Cloudflare Workers, già usato nell'infrastruttura del progetto. La sua presenza nel repository non attiva il servizio: servono una GitHub App, un namespace KV, due segreti e una pubblicazione esplicita.

## 🧭 Accesso e sessione

La pagina pubblica `styles/admin/manage.html` su GitHub Pages indirizza alla stessa pagina sul dominio HTTPS del Worker. Il Worker serve soltanto le quattro risorse della gestione, tramite il binding `ASSETS`; API e pagina condividono la stessa origine. Questa scelta evita la dipendenza dai cookie di terze parti tra `github.io` e `workers.dev`. Le richieste API da Pages o da altre origini sono rifiutate, senza abilitare CORS.

L'accesso usa il flusso web della **GitHub App**, con `state` casuale, cookie di collegamento e PKCE `S256`. Il codice autorizzativo viene scambiato sul server, specificando anche il repository ID. Il Worker verifica l'ID immutabile dell'account, l'ID e il proprietario del repository e il permesso di scrittura. Il solo parametro `login=Roccobot` nella schermata GitHub non dà alcuna autorizzazione. Il flusso e il significato di `repository_id` sono descritti nella [documentazione GitHub](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app).

Il browser riceve soltanto un identificatore casuale nel cookie `__Host-styles_session`, con `HttpOnly`, `Secure`, `SameSite=Lax` e durata massima di un'ora. In KV la chiave della sessione è l'hash dell'identificatore; il contenuto è cifrato con AES-GCM e la chiave `SESSION_KEY`. Token GitHub e verificatore PKCE restano sul server. Non viene conservato il refresh token: alla scadenza si ripete l'accesso. Ogni caricamento verifica nuovamente l'identità tramite GitHub.

Le scritture richiedono l'header `Origin` uguale all'origine HTTPS configurata e il token CSRF associato alla sessione, letto da `/auth/session`. Le risposte non includono dettagli di errori esterni, token o segreti e hanno `Cache-Control: no-store`.

**Limite KV**: Cloudflare KV ha consistenza eventuale. La creazione o la cancellazione di una sessione può richiedere 60 secondi o più per essere visibile in altre sedi della rete. Dopo l'uscita il cookie viene cancellato subito dal browser, ma una copia precedentemente sottratta potrebbe restare accettata in altre sedi fino alla propagazione della cancellazione, comunque non oltre la scadenza controllata dal server. Lo stesso limite può causare un rifiuto temporaneo subito dopo l'accesso. La [documentazione KV](https://developers.cloudflare.com/kv/concepts/how-kv-works/) descrive queste garanzie; un requisito di revoca immediata richiederebbe uno stato con consistenza forte.

## ⚙️ Preparazione

1. Crea una **GitHub App privata**, nel profilo Roccobot, con URL iniziale sul dominio HTTPS scelto per il Worker e callback esatta `https://HOST_DEL_WORKER/auth/callback`. Disattiva webhook e flusso dispositivo se non necessari. Mantieni attiva la scadenza dei token utente.
2. Concedi solo `Repository permissions > Contents: Read and write`. `Metadata: Read-only` è il permesso obbligatorio di GitHub. Non concedere permessi organizzazione o account aggiuntivi.
3. Installa l'app su Roccobot, scegli `Only select repositories` e seleziona **solo RoccobotOS**. Il codice usa sempre un repository e un ramo fissi; la selezione nell'installazione limita anche il potere del token all'origine.
4. Crea un namespace KV dedicato e collega il binding `SESSIONS`.
5. Copia `wrangler.toml.example` in `cloud/styles/wrangler.toml`, sostituisci dominio, client ID e ID del namespace. `PUBLIC_BASE_URL` deve contenere la sola origine HTTPS, senza percorso né barra finale.
6. Imposta nel Worker i segreti `GITHUB_CLIENT_SECRET` e `SESSION_KEY`. Quest'ultimo deve essere un valore casuale crittografico di **32 byte, codificato in base64**. Non inserirli in file versionati o nella pagina. La rotazione di `SESSION_KEY` rende inutilizzabili le sessioni e gli accessi in corso.
7. Dalla radice del repository prepara i file pubblici della gestione:

   ```sh
   node scripts/package-styles-admin.mjs
   ```

   Lo script copia solo `manage.html`, `manage.mjs`, `manager.css` e `styles-core.mjs` in `cloud/styles/public`. Questa cartella generata viene esclusa da Git. Non usare la radice del repository come cartella degli asset.
8. Esegui i test e una verifica del pacchetto prima della pubblicazione:

   ```sh
   node --test cloud/styles/worker-test.mjs tests/styles.test.mjs
   ```

9. Quando la pubblicazione del Worker è autorizzata, pubblica con la configurazione preparata. Solo dopo aver verificato login, upload e uscita sul servizio reale, imposta in `styles/admin/config.json` il campo pubblico `apiBase` con l'origine HTTPS del Worker.

`run_worker_first = true` fa passare anche gli asset dai controlli del Worker; `html_handling = 'none'` mantiene l'indirizzo `/manage.html` senza riscriverlo. Configurazione e binding sono documentati da [Cloudflare](https://developers.cloudflare.com/workers/static-assets/binding/) e dalla pagina sulla [gestione dei percorsi HTML](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/). Con segreti o binding mancanti il Worker risponde `503`, anche per la pagina.

## 📡 Contratto API

| Metodo e percorso | Risultato |
| --- | --- |
| `GET /auth/login` | Avvia GitHub; ritorno fisso a `/manage.html`. |
| `GET /auth/callback` | Verifica accesso, crea sessione e reindirizza alla gestione. |
| `GET /auth/session` | `{user:{login},csrf}` oppure `401`. |
| `POST /auth/logout` | Richiede cookie, `Origin` e `X-CSRF-Token`; cancella sessione e cookie, risponde `{ok:true}`. |
| `POST /styles` | JSON `{filename,content}`, cookie, `Origin` e `X-CSRF-Token`; risponde `201` con `{style,commit,url}`. |
| `GET /config.json` | Configurazione pubblica `{apiBase}` dell'origine del Worker. |

Gli errori hanno forma `{error}`. I principali codici sono `400` per input non valido, `401` per sessione assente o scaduta, `403` per identità, origine o CSRF rifiutati, `409` per nome esistente o conflitto, `413` per dimensione eccessiva, `415` per formato della richiesta, `502` per un errore esterno e `503` per servizio non configurato.

## 💾 Scrittura e concorrenza

`styles-core.mjs` è la fonte comune della validazione: nome semplice terminante in `.css`, limite di 256 KiB UTF-8, intestazione con `#NAME`, `#VERSION`, `#NOTE` e `#COMMENT`, parentesi bilanciate e assenza di risorse esterne o costrutti CSS eseguibili. Il corpo JSON viene letto con un limite anche quando manca `Content-Length`. Il controllo server è quello decisivo.

Il Worker legge il commit corrente e la cartella `styles`, rifiuta un nome già presente (anche con differenze fra maiuscole e minuscole), quindi costruisce **un commit unico** contenente CSS e `styles/index.json`. Se il catalogo manca, lo ricostruisce dalle intestazioni dei CSS già presenti; un catalogo presente ma incoerente viene rifiutato. Gli altri file rimangono nel tree di base.

L'aggiornamento del ramo usa `force:false`. Se un altro commit modifica il ramo, GitHub rifiuta l'avanzamento non lineare: il Worker rilegge l'ultima versione e riprova, al massimo tre volte, conservando le modifiche concorrenti. Dopo tre conflitti risponde `409`. Se il file diventa presente durante il tentativo, il salvataggio viene rifiutato. Le proprietà del riferimento sono documentate da [GitHub](https://docs.github.com/en/rest/git/refs#update-a-reference).

I test Node sono offline: esercitano il Worker reale e sostituiscono soltanto le chiamate GitHub e KV. Non verificano una vera installazione GitHub App, la propagazione KV, le regole del ramo o un deploy Cloudflare. Eventuali protezioni del ramo che impediscono il commit diretto vanno risolte nella configurazione autorizzata del repository, senza forzare il ramo dal Worker.
