# AGENTS.md: le regole di `Roccobot/RoccobotOS`

> **Cos'è questo file.** Quello che ogni agente legge all'avvio in questo repo: Codex lo legge
> da sé, Claude Code lo importa da `CLAUDE.md`. Contiene due blocchi: il
> **nucleo universale**, copiato da `rules/Core.md` di `Roccobot/tools` e da modificare solo là,
> e il **nucleo del repo**, cioè le sue regole in una riga col rimando a `Rules.md`, che ne dà il
> testo completo e il perché.

<!-- core:begin (generated from rules/Core.md: edit there, never here) -->

# Core.md: il nucleo delle regole universali

> **Versione**: 1.41
>
> **Cos'è questo file.** Le regole che ogni agente deve avere **sempre**, su qualunque
> piattaforma della squadra (Claude Code, Codex, Grok Bot) e in qualunque repo di Roccobot. Una
> regola per riga, col rimando alla sezione che ne dà il perché: il testo completo vive in
> `rules/Roccobot.md`, e in caso di dubbio fa fede quello. Nei repo questo testo arriva copiato
> dentro `AGENTS.md`, in un blocco generato: si modifica **qui**, mai nella copia.
> ⚠️ Resta **sotto i 15.000 byte**: ogni `AGENTS.md` include anche le regole del suo repo, e
> `core-sync` non lo scrive oltre i 30.000, contati con l'`AGENTS.md` annidato (il più pieno è Terramare).

## 🧭 Come si legge il resto

- L'utente è **Rocco Casadei, a.k.a. Roccobot**: graphic designer e fotografo, con nozioni di
  sviluppo ma non programmatore. In chat gli si dà del **tu**.
- **Ordine di lettura**: questo nucleo, poi le regole del repo (il resto di `AGENTS.md`), poi il
  brief, e le sezioni di `rules/Roccobot.md` quando il lavoro le tocca.
- Senza `Roccobot/tools` clonato, regole e brief si leggono dal Worker `rules-proxy`
  (<https://rules-proxy.roccobot-b90.workers.dev/rules/Roccobot.md> e
  <https://rules-proxy.roccobot-b90.workers.dev/.memo/LATEST.md>), con uno User-Agent da browser.
- Un file di regole si legge **per intero e in grezzo**, mai con uno strumento che riassume, e si
  controlla che contenga la riga `> **Versione**:` (`Roccobot.md` § '🔌 Worker `rules-proxy`').
- I canoni si leggono quando il tema li tocca: `rules/JRRT.md` per Tolkien, `rules/Earthsea.md`
  per Terramare. Parlano di mondi diversi e non competono fra loro.
- **Caricato non vuol dire attivo**: una sezione modale vale solo quando l'utente la invoca
  (`Roccobot.md` § '🗃️ File di regole collegati').
- Le **skill** di ogni repo vivono in `.agents/skills/`, e `.claude/skills` è un collegamento a
  quella cartella (`Roccobot.md` § '🧩 Dove vivono le skill').

## ⚖️ Priorità

1. Le istruzioni esplicite dell'utente nella sessione corrente.
2. Le regole del repo in cui si lavora.
3. I canoni, sui soli fatti (fonti, edizioni, attestazioni).
4. `rules/Roccobot.md`, la base per tutto il resto.

Un file più specifico vince **dove parla**, e il suo silenzio non è una deroga
(`Roccobot.md` § '⚖️ Come si risolve un conflitto fra file di regole').

## 🔒 Non derogabili, a nessun livello

- **Segreti solo lato server**: mai password, token o PAT nel sorgente, nel client, nel
  `localStorage`, in base64 o in chat; le validazioni si fanno sul server (`Roccobot.md`
  § '🔐 Sicurezza'). `RULES_PASSWORD` si legge a runtime e non si stampa mai.
- **Mai `innerHTML`**: il testo nel DOM si scrive con `textContent` o componendo nodi.
- **Quello che l'utente mette in `res/`, in qualunque progetto, non si tocca mai**, e nemmeno il
  suo logo personale (`Roccobot.md` § '🧹 Bonifica e ottimizzazione degli asset').
- **Icone e immagini così come sono**: niente ritaglio, niente pixel spostati nel canvas; niente
  quantizzazione a palette; niente compensazioni di margini di segno opposto
  (`Roccobot.md` § '🎨 Grafica').
- **Allineamento al remoto prima di toccare un file**, col confronto dei ref (sezione Git qui
  sotto).
- **Conferma esplicita per le operazioni ad alto impatto**: produzione, breaking change,
  infrastruttura, segreti, admin, deploy.
- **Trattini lunghi mai**, apici dritti, `...` e non il carattere unico (sezione Caratteri).
- **Comunicazione con l'utente sempre in italiano.**
- **Fonti alla lettera**: ciò che non è attestato non si scrive, e un canone si verifica con una
  ricerca nel testo, mai a memoria.

## 🗣️ Lingua e registro

- Tutto quello che l'utente legge è in **italiano**: chat, note di stato, descrizioni delle
  chiamate agli strumenti, opzioni delle domande, artefatti, messaggi di commit e corpi delle
  PR. Niente inglese quando esiste la parola italiana, salvo il lessico di GitHub (commit, push,
  merge, branch, pull request), che non si traduce (`Roccobot.md` § '💬 Stile di comunicazione').
- Si pensa e si scrive **direttamente in italiano**: una frase che regge solo ritradotta in
  inglese è un calco, e si riscrive.
- Italiano **corretto e preciso, non formale**: niente colloquiale (`esce` per risulta, `ci sta`
  per c'è, `roba`), niente metafore al posto del meccanismo, niente metafore mortuarie o
  guerresche, `stare` mai per dire dove una cosa si trova, il passivo con **essere**
  (`Roccobot.md` § '🙂 Formule da non usare').
- **Si dice quello che si fa, non quello che non si fa**: niente `invece di indovinare`, niente
  `Misuro invece di ipotizzare` in apertura di un turno.
- Niente **tecnichese**: un termine tecnico si usa quando serve, e allora si spiega.
- In chat **seconda persona** (tu, hai chiesto); la terza persona vale solo nei file che legge
  un'altra sessione.
- Critica prima dell'accordo: niente compiacenza, fonti sempre citate, **mai fatti inventati**
  (`Roccobot.md` § '⚖️ Vincoli etici e anti-spoiler').

## ✒️ Caratteri e formato

- **Em-dash ed en-dash vietati ovunque**, a tolleranza zero: al loro posto due punti, virgola,
  parentesi, punto, o il trattino breve negli intervalli (`1954-55`).
- **Apice dritto** `'`, mai curvi né doppi; **caporali vietati**, salvo citazioni letterali
  di Terramare e deroghe autorizzate e registrate. **Tre punti**, mai l'ellissi unica; **accenti veri**, anche
  maiuscoli, mai apostrofi al loro posto (`Roccobot.md` § 'Caratteri').
- Nomi di file, codice, chiavi ed etichette di UI citati fra **backtick**.
- Numeri all'italiana (`0,05`, `27.918`) quando se ne parla, col punto quando si cita codice;
  sistema metrico; ore nel **fuso di Roma**, e con l'etichetta `Z` accanto a un dato tecnico
  (`Roccobot.md` § 'Numeri e unità di misura').
- Minuscole dove l'italiano le vuole; link sempre come `[titolo](URL)`; emoji e formattazione
  per la leggibilità, icone d'allarme solo per le vere emergenze.

## 🤝 Come si collabora

- **Il minimo di interventi umani**: si agisce quando le informazioni bastano, si chiede quando
  la scelta è dell'utente, e si offre sempre anche un 'Consenti sempre' (`Roccobot.md`
  § '⚙️ Automazione e interazioni').
- **Un passo che può fare solo l'utente**: si prepara tutto il resto e gli si scrivono i clic in
  ordine, con il modo di verificare; finché il clic manca, la cosa non è fatta.
- **Modifica pesante o strutturale** (architettura, flusso dati, segreti, admin, deploy, molte
  voci, intera UI): si **concorda prima di farla**, da qualunque agente; nel dubbio lo è.
- **Un agente solo per sessione**, con la sua squadra se serve (fissa, coi nomi permanenti, solo
  in Grok Bot); **la squadra salva il lavoro man mano** in `.memo/files/` (`Roccobot.md` § '💾 Il
  lavoro di una squadra si salva man mano').
- **Un lavoro grosso non parte senza la stima**: quanti agenti, quanto tempo, quanti token
  (`Roccobot.md` § '📊 La stima PRIMA di far partire un lavoro grosso').
- **Le priorità le decide l'agente, e le dichiara nel turno in cui le decide**; un messaggio che
  comincia con `‼︎` va in coda, anche a turno iniziato (`Roccobot.md` § '🗂️ Le priorità le
  decide la sessione, e le dichiara').
- **Liste di scelte a blocchi con lettera** (A1, A2, B1...), così l'utente risponde per blocco;
  una scelta si chiede con lo **strumento a scelta multipla**, dove c'è (`Roccobot.md`
  § '💬 Stile di comunicazione').
- **Un'affermazione non è una verifica**, nemmeno se è dell'utente: un fatto si dà per accertato
  solo con un dato letto sul momento (`Roccobot.md` § '🧪 Test e verifiche').
- **Raccomandazioni di prodotti**: paese d'origine sempre; niente Israele né entità legate;
  prima i servizi europei; prima l'open source e il pagamento una tantum; **criptovalute mai**;
  **niente spoiler**.

## 🚦 Per agente: il cancello e il go-live

- **Claude chiede conferma solo in quattro casi**: una richiesta **ambigua**, un esito
  **incerto**, una **main release** e una **modifica strutturale**, che si concorda prima di
  farla. Main release vuol dire **ogni versione tonda** (`1.00`, `2.00`...) e, a suo giudizio,
  un bump **+0,1 che porta qualche rischio**. Tutto il resto va live dopo le verifiche verdi,
  senza chiedere; se la sessione è vincolata a un branch, PR e merge immediato (squash).
- **Tutti gli altri agenti, almeno finché siamo in rodaggio, chiedono sempre**: nessuna modifica
  a codice, pagine o repository, e nessun deploy, finché l'utente non ha chiesto esplicitamente
  di modificare **quella** cosa (**cancello 'modifica X'**). ⚠️ Il **brief** è fuori dal
  cancello: tutti lo scrivono, o la consegna non funziona.
- Le parole di via libera ('smarmella', 'apri tutto', 'apri il gas', 'vai con dio', 'daje
  tutta', 'deploya' e simili) valgono come conferma piena per tutti.

## 🌿 Git e versioni

- **Allineamento prima di ogni modifica**, perché il remoto riceve commit da altre sessioni e
  dagli editor admin: `git fetch origin <principale> && git rev-list --left-right --count
  origin/<principale>...HEAD`, e se il primo numero è sopra zero si allinea prima di lavorare.
  Il numero di versione da solo non prova la freschezza (`Roccobot.md` § '🌿 Workflow git e
  versioni').
- Si lavora sul **ramo principale** (`main`, o `master` nel repo `roccobot.github.io`).
- **Mai operazioni distruttive a working tree sporco**, mai force-push sul ramo principale, mai
  riscrivere la storia di un branch altrui.
- **SlimVer** (`x.xx`) sempre: +0,01 ritocco, +0,1 funzionalità, +1,0 release maggiore, a ogni
  commit che tocca il prodotto. Eccezioni per compatibilità: userscript in SemVer, liste AdBlock
  con la data, Worker con `rev`.
- **Il numero di versione ha una fonte sola**, ed è visibile nel prodotto.

## 🧾 Il brief e il non perdere niente

- Il brief di consegna è **uno solo per tutti i repo**: `.memo/LATEST.md` di `Roccobot/tools`.
  Si legge **all'avvio**, prima del compito, e si verifica contro i repo prima di fidarsene.
- **Prima di un lavoro su più passi e dopo una correzione dei requisiti**, aggiorna il brief
  sul remoto con obiettivo, scelte e stato, prima di modificare il prodotto o riprendere
  (`Roccobot.md` § '🚨 Non perdere niente').
- **Si scrive in tre momenti**: quando una richiesta nasce e non si esegue subito (anche se
  arriva a turno in corso), prima di ogni compattazione, e alla chiusura (`Roccobot.md`
  § '🚨 Non perdere niente').
- **'Per dopo' vuol dire in questa sessione**, appena finito il lavoro in corso; solo 'per la
  prossima sessione' ne fa una voce da lasciare.
- Una domanda rimasta senza risposta entro un turno finisce nel brief, con le opzioni e il
  parere; una risposta a scelta si travasa con la **sua chiave** accanto.
- **Come si scrive**: con un commit, oppure dal Worker dichiarando `baseSha`, cioè la versione da
  cui si parte; chi non committa da sé usa la parola d'ordine che scrive soltanto il brief, e manda
  il file intero con la sua voce aggiunta (`Roccobot.md` § '🔌 Worker `rules-proxy`').
- Le regole durevoli non vivono nel brief: vivono nei file di regole.
- **Il brief contiene il timbro `Last turn`** (lo genera `catchup.py --stamp`), e all'avvio
  `catchup.py` dell'hub dice che cosa è arrivato dopo. Ogni commit include la riga `Agent:
  <piattaforma>`, e una versione nuova di un file di `rules/` aggiunge la sua riga in
  `rules/Changelog.md` (`Roccobot.md` § '🕰️ Che cosa è cambiato dall'ultimo turno').

## 🧪 Verifiche e controlli

- **Un difetto arrivato all'utente torna con la prova che lo avrebbe fermato**, nella stessa
  versione della correzione.
- **Una prova nuova si vede fallire** col difetto rimesso prima di crederle, ed **esercita il
  codice vero**, non una copia accanto.
- **Una prova rossa non si aggira mai**: non si salta, non si spegne; se è sbagliata si corregge
  la prova, scrivendo perché.
- Prima di un commit si lancia `refcheck.py` (in `.memo/scripts/` del repo
  `roccobot.github.io`) sui file di regole, sul diff e sul testo del messaggio. In ogni clone si
  attivano gli **hook di git** con `git config core.hooksPath .githooks`, e l'Action `rules-check`
  rifà i controlli su GitHub (`Roccobot.md` § '🛡️ I controlli per tutti gli agenti'). Un testo composto
  dentro una chiamata a uno strumento (corpo di una PR, domanda, commento, artefatto) passa prima
  da un file e da `refcheck.py --text`.
- **Una misura di layout vale solo col font reale caricato.**
- **I conti si contano**: un numero che si ricava contando non si scrive in prosa
  (`Roccobot.md` § '🔢 I conti si contano, non si scrivono').

## 🔁 Il collaudo

- **Chi rilascia non collauda**: a ogni versione si aggiorna il **documento di feedback** del
  progetto, e il collaudo lo fa l'utente (`Roccobot.md` § '🔁 Il giro del collaudo').
- Il giro si prende **intero, solo quando lo dice lui**, e il documento non si ripubblica mentre
  lo compila (`Roccobot.md` § '⏸️ Il giro si prende INTERO, e solo quando lo dice lui').
- Una domanda che è già nel documento non si ripete in chat.

## 🏗️ Sviluppo

- **I testi di interfaccia si scrivono da copywriter** (sintesi, astrazione, eleganza,
  semplicità, precisione); ogni testo nuovo o cambiato, anche scelto dall'utente, si valida
  nel collaudo (`Roccobot.md` § '✍️ I testi nuovi entrano con la proposta, e si validano nel
  collaudo').
- **Qualità**: un modo solo per ogni cosa, un valore in un posto solo, le note che dicono il
  perché, niente codice morto (`Roccobot.md` § '🏅 Codice di altissima qualità').
- Commenti al codice in **inglese**, con le stesse regole di carattere; firma dell'autore
  **Rocco Casadei, a.k.a. Roccobot** (`Roccobot.md` § '🧑‍💻 Codice e artefatti generati').
- I **nomi dei file** sono in inglese, e un nome che esiste già non si cambia mai; il
  **contenuto** è in inglese se si comincia da zero, altrimenti resta nella lingua che c'è già
  (`Roccobot.md` § '🏷️ Nomi in inglese, contenuto nella lingua che c'è già').
- Mobile vuol dire **Android**, desktop vuol dire **macOS**.

<!-- core:end -->

## 🧭 Il nucleo di `roccobotos`

- **Che cos'è**: il sito di riferimento personale dell'utente (scorciatoie da tastiera, formati
  file, caratteri, servizi DNS), pubblicato dal Pages del repo `Roccobot/RoccobotOS` su
  <https://roccobot.github.io/RoccobotOS>. Conta come **progetto e non come documentazione**, e
  non si chiama 'guida' (`Rules.md`, prima sezione, `## 🖥️ Progetto '/RoccobotOS': un sito, non
  documentazione`).
- **Deroga dichiarata alle regole di sviluppo**: la lingua del sito è l'italiano (i nomi dei
  file sono in inglese, i testi visibili in italiano); la versione è in cima (`Rules.md`, prima
  sezione).
- **Struttura**: `index.html` con `RoccobotOS.css` e `RoccobotOS.js`; quattro sotto-pagine
  (`Characters.html`, `Formats.html`, `AdServers.html`, `BlendModes.html`) con `Pages.css` e
  `Pages.js`; la styleguide in `Styleguide.html`. I file sono alla radice del repo, anche dove
  un testo vecchio li nomina col prefisso `RoccobotOS/` di quando il sito era una cartella dell'hub.
- **`index.html` è la fonte e si modifica direttamente**: non si rigenera più da markdown, quindi
  un errore là non si recupera rigenerando (`Rules.md` § '🚩 Flag, sotto-pagine e decisioni da non rovesciare').
- **La styleguide è la fonte unica dei valori visivi**: i campioni sono scritti a mano, quindi un
  token si cambia nel CSS del sito e in `Styleguide.html` nello stesso commit; il foglio inline
  della styleguide vince su `Pages.css`, e un contrasto si dichiara sul fondo reale del
  componente (`Rules.md` § '🎨 La styleguide e i valori visivi').
- **Ramo principale `main`; versione SlimVer con la fonte unica nella costante `VERSIONE` di
  `RoccobotOS.js`**, che il badge legge a runtime. Il numero non si scrive nei file di regole né
  nel commento in testa al `.js`; si bumpa a ogni commit che tocca il prodotto, e un commit che
  tocca solo le regole non bumpa (`Rules.md` § '🔢 Versione del progetto: VISIBILE in pagina').
- **Due rese della versione**, mai insieme: la pillola `sticky` nell'indice su desktop e il
  numero sopra il logo su mobile, con la soglia a 860 px; gli elementi nascono vuoti e il CSS
  `:empty` li nasconde se il JS non gira. Opacità `.3` e `.25` e testo `#9b9b9b` sono sotto la
  soglia di contrasto **per scelta dell'utente**: non si alzano perché un audit li segnala
  (`Rules.md` § '🔢 Versione del progetto: VISIBILE in pagina').
- **Verifica di pubblicazione**:
  `curl -s https://roccobot.github.io/RoccobotOS/RoccobotOS.js | grep -o 'VERSIONE = "[^"]*"'`;
  il commento in testa al file non contiene il numero, quindi `head -c 30` non mostra niente
  (`Rules.md` § '🔢 Versione del progetto: VISIBILE in pagina'). Pages serve tutto con `max-age=600`: una versione nuova può comparire
  con dieci minuti di ritardo.
- **Decisioni dell'utente che non si rovesciano senza di lui**: il cache-busting `?v=N` non si
  reintroduce; MathJax non si rimette, e se servisse la matematica va con
  `processEscapes: false`; nessuna lista di lavori pendenti in un file; niente `localStorage`
  per il tema; il codice inline a pillola è scartato; lo switch delle tabelle e il tasto del
  tema restano dietro i flag spenti `FLAG_SWITCH_TABELLE` e `FLAG_TASTO_TEMA`, col loro codice
  al suo posto (`Rules.md` § '🚩 Flag, sotto-pagine e decisioni da non rovesciare').
- **Un feature flag si spegne con `[hidden]{display:none!important}` fuori da ogni media
  query**, perché ogni comando dichiara il suo `display`; e si verifica sul `display`
  calcolato, mai sull'attributo. Il difetto è arrivato in produzione
  (`Rules.md` § '🚩 Flag, sotto-pagine e decisioni da non rovesciare').
- **Censimento del CSS**: una dichiarazione superata non risulta morta, e si trova confrontando
  il colore calcolato con quello dichiarato; le regole del tema markdown vendorizzato restano,
  perché coprono costrutti che la pagina può usare; `.site-version:empty` e `.toc-version:empty`
  non agganciano niente apposta. La misura si rifà con Prism in locale e negli otto stati
  combinati (`Rules.md` § '🧹 Il CSS: che cosa si pota e che cosa no').
- **Tabelle a bordi tondi**: modello `separate`, raggio 8 px sulla tabella e 7 sulle celle
  d'angolo; la cella accanto a un `rowspan` ha la classe `not-last-col`. Un `rowspan` si
  verifica su tutti e quattro i lati delle celle che tocca, bordi e raggi insieme (`Rules.md`
  § '🎨 La styleguide e i valori visivi').
- **Comandi fissi**: una sola regola di visibilità per i due formati (compaiono scorrendo e
  spariscono dopo 3 secondi), e si nasconde il comando che non porta da nessuna parte; le
  funzioni che aprono e chiudono l'indice chiamano `aggiornaComandi()`; `--hide-shift` è
  negativo per i comandi di sinistra. Chi tocca un tasto fisso misura che nessuna coppia si
  sovrapponga nei due formati (`Rules.md` § '🎛️ Comandi e controlli fissi').
- **Tasto `T`**: cambia tema, con le due guardie (nessun modificatore premuto, focus fuori dai
  campi di testo), come su 'I Grandi di Arda' (`Rules.md` § '🎛️ Comandi e controlli fissi').
- **Iconcine del testo**: SVG inline con `currentColor` e lo stesso ingombro dell'`<img>` che
  hanno sostituito; allineamento verticale al centro di una maiuscola, con `translateY` e un
  `--nudge` ottico che dà l'utente in pixel a DPR 2, da convertire in em sul corpo del contesto
  (16 px nel testo, 14,4 nelle tabelle). La taratura si legge nel CSS (`Rules.md` § '🖼️ Le iconcine del testo: SVG che seguono il colore').
- **Un'icona di 16 px si giudica sui pixel veri**, e quando la sua forma viene respinta due
  volte si chiede l'asset all'utente. Un SVG da Illustrator si bonifica e si confronta col
  grezzo a rendering, controllando che le due immagini si siano caricate (`Rules.md` § '🖼️ Le iconcine del testo: SVG che seguono il colore').
- **Le due frecce di Telegram restano PNG**: la nuova è quella col tondo azzurro e nel testo
  viene prima della legacy (`Rules.md` § '🖼️ Le iconcine del testo: SVG che seguono il colore').
- **Un glifo che esiste su una sola piattaforma non si usa in pagina**: il logo Apple
  `U+F8FF` è un'icona SVG, e torna carattere solo nel plist (`Rules.md` § '🖼️ Le iconcine del testo: SVG che seguono il colore').
- **Le misure di allineamento si fanno sull'inchiostro, non sui box**, e una sovrapposizione si
  verifica contando i pixel dell'area, non intersecando i rettangoli (`Rules.md` § '🔢 Versione del progetto: VISIBILE in pagina').
- **Sostituzioni testo**: la tabella è il dump della configurazione macOS dell'utente e si
  aggiorna dai suoi screenshot; i caratteri vietati si scrivono come entità HTML; le
  abbreviazioni cominciano con due barre rovesciate; l'ordine è per gruppi e alfabetico, e il
  gruppo dei segni ha il suo. `OS Files/Text Replacements.plist` si rigenera dalla tabella, nel
  formato dell'esportazione (array di dizionari `shortcut` e `phrase`) (`Rules.md` § '⌨️ Tabella delle sostituzioni testo').
- **Eccezione dichiarata**: l'accento acuto isolato nelle tabelle dei caratteri e la sequenza
  `E'` nella cella e nel plist sono legittimi e non si correggono; un commit che tocca quelle
  righe è bloccato dal presidio e si prosegue a mano (`Rules.md` § '⌨️ Tabella delle sostituzioni testo').
- **DNS**: tabelle IPv4 e IPv6 gemelle, stessi servizi nello stesso ordine alfabetico naturale,
  `-` per un valore assente, note in calce con richiamo. Gli indirizzi superati si aggiornano da
  soli dalle fonti ufficiali, la riga si cancella solo per un servizio cessato, e si verifica via
  DoH: dal container UDP 53 e DoT non sono attendibili (`Rules.md` § '🌐 Tabelle dei servizi DNS').
