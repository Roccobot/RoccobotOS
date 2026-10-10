# Rules.md: RoccobotOS

> **Cos'è questo file.** Le regole del **sito** RoccobotOS
> (<https://roccobot.github.io/RoccobotOS>), cioè il testo completo delle regole di questo
> repo; le regole trasversali vivono nell'hub, il repo `roccobot.github.io`.
> Vale per **tutti gli agenti**: il nucleo, cioè ogni regola in una riga, vive in `AGENTS.md`,
> e questo file ne dà il perché. Dal 2026-10-10 nessun agente lo carica da sé, Claude Code
> compreso: si legge per intero prima di lavorare su una cosa di cui parla.
> ⚠️ **Fino al 2026-09-27 questo testo era il `CLAUDE.md` del repo**: una nota che nomina il
> `CLAUDE.md` di RoccobotOS per una di queste sezioni parla di questo file. I file del sito sono
> alla **radice** del repo: il prefisso `RoccobotOS/` che si trova in testi vecchi è di quando il
> sito era una cartella dell'hub.

## 🖥️ Progetto '/RoccobotOS': un sito, non documentazione

- **Cos'è.** Il sito di riferimento personale dell'utente: scorciatoie da tastiera, formati
  file, caratteri, servizi DNS e simili. Progetto a sé, distinto da 'I Grandi di Arda' e da
  'Roccobot ABP'.
- ⚠️⚠️ **Conta come PROGETTO, non come documentazione** (istruzione dell'utente: *un sito a
  tutti gli effetti, anche se a pagina singola*). Da questa qualifica dipende quali regole si
  applicano, e la prima è la **versione visibile** (§ '🔢 Versione del progetto: VISIBILE in
  pagina'). Perciò non si chiama 'guida', né in chat né nei file di regole.
- ⚠️ **Deroghe dichiarate alle regole di sviluppo** (`Roccobot.md` § '🏗️ Sviluppo software'):
  la **lingua del sito è l'italiano**, perché è un riferimento personale e non un prodotto per un
  pubblico anglofono; il numero di versione è in cima per scelta dell'utente.
- **Struttura.** `index.html` con `RoccobotOS.css` e `RoccobotOS.js`; quattro sotto-pagine
  (`Characters.html`, `Formats.html`, `AdServers.html`, `BlendModes.html`) con `Pages.css` e
  `Pages.js`; la styleguide in `Styleguide.html`.
  - ⚠️ **Nomi dei file in inglese, testi visibili in italiano**: sono due scelte indipendenti
    (`Roccobot.md` § '🏷️ Nomi in inglese, contenuto nella lingua che c'è già'). I vecchi
    indirizzi `Caratteri`, `Formati` e `Metodi di fusione` non rispondono più, quindi non si
    linkano.

### 🎨 La styleguide e i valori visivi

- ⚠️⚠️ **La STYLEGUIDE è la fonte unica dei valori visivi** (colori, tipografia, superfici,
  componenti): [`Styleguide.html`](Styleguide.html), pubblicata su
  <https://roccobot.github.io/RoccobotOS/Styleguide.html> perché la si possa dare a un altro
  agente. I numeri sono là e non si riscrivono qui.
  - **Ogni token è un campione disegnato sui due fondi veri del sito, affiancati**: il difetto
    storico del progetto è scegliere un colore guardando un tema solo, e questa forma lo rende
    impossibile. Il vecchio `Styleguide.md` non esiste più.
  - ⚠️ **I valori nei campioni sono scritti a mano, di proposito**: una pagina che deve far
    vedere un colore non lo prende da una fonte che può cambiare senza che se ne accorga. Quindi
    un token si cambia nel CSS del sito e in `Styleguide.html` **nello stesso commit**. La
    styleguide ha anche un **foglio inline che vince su `Pages.css`**: la sua tabella d'esempio
    si aggiorna insieme al sito, o mostra il componente diverso da com'è.
  - ⚠️ **Un contrasto si dichiara sul fondo REALE del componente**, non su quello della pagina:
    il codice inline `#bc4a61` vale 4,60:1 sul suo grigio `#f7f8f8`, non 4,89:1 sul fondo
    `#feffff`. Un numero sbagliato ma sopra la soglia AA non lo segnala nessuno.
- **Codice inline a pillola: scartato dall'utente.** Il riquadro pieno rosa col testo bianco, in
  un paragrafo denso, trasforma i molti `<code>` in una collana di etichette che pesa più del
  testo. Resta il rosa sul grigio, la forma leggera.
- ⚠️⚠️ **Le tabelle a COLONNE RIPETUTE hanno la colonna stretta in grigio** (regola generale
  dell'utente): quando una tabella ripete lo stesso gruppo di colonne, la colonna stretta di ogni
  coppia (il glifo, la sigla) prende il fondo grigio, che separa le coppie senza un bordo, a otto
  colonne rumoroso.
  - ⚠️ **Le classi sono due**, `narrow-cols-odd` e `narrow-cols-even`, perché la colonna stretta è
    la prima nelle tabelle dei tasti e la seconda in quelle dei caratteri e delle sostituzioni:
    un solo `nth-child` colorerebbe la colonna sbagliata in metà delle tabelle. Vivono in
    `RoccobotOS.css` e in `Pages.css`, perché le due famiglie di pagine non condividono il foglio.
- ⚠️⚠️ **Angoli stondati di 8 px: non è una riga di CSS.** Col modello `collapse` un
  `border-radius` sulla tabella non agisce, perché la cornice la disegnano le celle. Serve il
  modello `separate`, la cornice sulla tabella, i soli tratti interni sulle celle e il raggio
  sulle quattro celle d'angolo.
  - **Il raggio delle celle è 7 px, non 8**: la cornice è fuori, e con lo stesso raggio si
    vedrebbe un filo di fondo fra bordo e cella.
  - ⚠️ **Serve `width:fit-content` con `max-width:100%`**: le tabelle della pagina principale sono
    `display:block` per poter scorrere, quindi il blocco è largo il 100% e le celle no, e senza
    quel valore la cornice arriva a fondo pagina con le celle a metà.
  - ⚠️ **Una cella con `rowspan="2"` che arriva in fondo non è nell'ultima riga**, e le regole
    d'angolo la mancano: c'è una regola scritta sulla forma
    (`tbody tr:nth-last-child(2) td[rowspan="2"]`), non sul caso che l'ha fatta nascere.
  - ⚠️⚠️ **Nella riga accorciata da una cella unita, l'ultima cella scritta non è l'ultima
    colonna**: `td:last-child` le toglie il bordo destro e le dà l'angolo tondo. Il rimedio è la
    classe `not-last-col` nel markup, non un selettore: `:last-child` guarda i fratelli
    **scritti**, e il CSS non conta le colonne. Bordo e raggio vengono dalla stessa causa e si
    correggono insieme.
  - ⚠️ **La specificità si conta**: la regola d'angolo `tbody tr:last-child td:last-child` batte un
    selettore che aggiunge la sola classe nuova. Il primo tentativo perdeva lì, e la misura diceva
    ancora `7px` mentre il CSS sembrava giusto.
  - ⚠️ **Un `rowspan` si verifica su tutti e quattro i lati** delle celle che tocca e di quelle
    accanto, **bordi e raggi insieme**: uno screenshot della tabella intera non mostra un tratto
    di bordo mancante.
  - **Il separatore verticale delle intestazioni ha il grigio delle altre celle**, non il `#555`
    dell'export (l'utente lo trovava troppo netto). La dichiarazione si è corretta dov'era, nel
    blocco minificato, e non sovrascritta: vedi le dichiarazioni superate, qui sotto.
  - **8 px è il raggio del progetto**, anche per il riquadro dell'indice laterale. Sul cassetto a
    schermo intero degli smartphone resta 0, di proposito: il pannello è incollato ai tre lati, e
    un angolo tondo mostrerebbe la pagina sotto.
- ⚠️ **Il LOGO in testata è SVG inline**, e `RoccobotOS.svg` non esiste più: un `<img>` non si
  ricolora, e in tema scuro cambia colore la sola parte grigia della scritta, il marchio verde no.
  Le due parti hanno le classi `.logo-word` e `.logo-mark`, i colori sono in `RoccobotOS.css`. Gli `id`
  dell'export si sono tolti, perché inline avrebbero potuto collidere con quelli della pagina.

### 🧹 Il CSS: che cosa si pota e che cosa no

- ⚠️⚠️ **Una dichiarazione SUPERATA non è una regola morta, e il censimento del CSS morto non la
  vede**: il censimento conta gli elementi che un selettore aggancia, e una regola agganciata ma
  sovrascritta più in basso risulta viva. Resta lì pronta a ingannare chi modifica la riga
  sbagliata. Si tolgono le sole dichiarazioni superate, tenendo le altre proprietà della stessa
  regola.
  - **Come si trova**: leggendo per ogni livello il valore **calcolato** e confrontandolo con
    quello dichiarato, non con `querySelectorAll`. Un valore dichiarato che non compare mai nel
    calcolato è superato.
  - **Come si prova la potatura**: colore, corpo, bordo e riempimento misurati prima e dopo, nei
    due temi.
- ⚠️ **Quando si ricolora un elemento al buio si controllano tutte le proprietà di colore, bordo
  compreso**: il filo sotto l'h2 è rimasto quasi bianco nel tema scuro per giorni, perché l'elenco
  che ricolorava i bordi comprendeva h1, h4, h5 e h6 ma non h2, e le prove guardavano il testo.
- ⚠️⚠️ **Il CSS morto NON si pota tutto, e la parte rimasta è una scelta.** Si tolgono le regole
  **impossibili**: residui di funzioni tolte, il tema dei token di Prism e le righe numerate
  (nessun blocco di codice usa un linguaggio che Prism colori), le regole di tocbot che la sua
  configurazione non accende (`positionFixedSelector` è `null`, non c'è un `.toc`). Restano le
  regole del **tema markdown vendorizzato** (`blockquote`, `dl`, `figure`, `details`, `kbd`, liste
  di spunta, note a piè di pagina, `h5`, `h6`, liste annidate): coprono costrutti che la pagina può
  usare domani, e senza di loro la prima citazione uscirebbe senza stile.
  - ⚠️ **Come si rifà la misura**: la cartella servita su HTTP locale con **Prism scaricato in
    locale** (il browser di prova non ha rete, e senza Prism `div.code-toolbar` e
    `pre[class*=language-]` sembrano morte); i selettori estratti dal CSSOM e provati in **otto
    stati combinati** (desktop e mobile, per chiaro e scuro, più schede e indice aperto), accesi
    **col clic** e non scrivendo l'attributo, o `td[data-label]` non esiste. Le schede si accendono
    solo col flag `FLAG_SWITCH_TABELLE` rimesso a `true` per la durata della misura. Un attributo
    per volta dà falsi positivi: le regole `[data-theme=dark][data-tables=cards]` risultano morte.
  - **Non si toccano** `.site-version:empty` e `.toc-version:empty`: non agganciano niente
    **apposta**, perché sono la rete per quando il JS non gira.
- **Le ancore invisibili dell'export (`<a class="anchor">`) sono tolte** e non si ricreano.
  ⚠️ Restano le **ancore fatte a mano** (`<a id="ScorciatoieApp"></a>` e simili, comprese
  `CloudStorage` e `NotaFTop`, che oggi nessuno punta): sono segnaposto voluti, e i link
  dell'indice ci passano.

### 🚩 Flag, sotto-pagine e decisioni da non rovesciare

- ⚠️⚠️ **Un feature flag non si spegne con il solo attributo `hidden`, e il difetto è arrivato in
  produzione.** `hidden` nasconde con una regola del foglio del **browser**, e ogni comando fisso
  dichiara il suo `display` (`inline-flex` o `grid`) in una regola **d'autore**, che vince. Serve
  `[hidden]{display:none!important}` sui comandi, **fuori** da ogni media query, perché il flag li
  spegne in tutti i formati.
  - ⚠️⚠️ **Un comando spento si verifica sul `display` calcolato, mai sull'attributo**: la prova
    che non l'ha visto leggeva la proprietà `hidden`, che era `true` come atteso. Vale come regola
    del progetto: le prove guardano il risultato, non l'intenzione.
- ⚠️ **Due funzioni sono dietro un flag spento, col loro codice al suo posto**:
  - **il pulsante del tema** (`FLAG_TASTO_TEMA`): con l'indice aperto copriva il pannello. Il tema
    segue il **sistema**, l'utente non lo commuta quasi mai, e resta il tasto `T`: sparisce il
    bottone, non la funzione;
  - **lo switch fra tabelle standard e schede** (`FLAG_SWITCH_TABELLE`, in `RoccobotOS.js`):
    l'utente non l'ha mai usato. Codice e CSS delle schede restano, perché rifarli costerebbe
    caro; per riaverlo basta il flag a `true`.
- ⚠️ **L'anello attorno a un titolo dopo un salto dall'indice lo causa tocbot**, che mette
  `tabindex="-1"` sul titolo di arrivo e gli dà il fuoco: si toglie con `outline:none` sui titoli.
  Non costa accessibilità: il fuoco resta dov'è per il lettore di schermo, e col Tab su un titolo
  non ci si arriva.
- **Le sotto-pagine hanno un FAB 'indietro' in alto a sinistra**, verso `index.html`: lo crea
  `Pages.js` con `createElement`, così la fonte è una sola invece di quattro pagine.
- **Le sotto-pagine seguono il tema del sistema** (`prefers-color-scheme`) e si commutano col tasto
  `T`, senza memorizzare nulla: niente `localStorage` per il tema (scelta dell'utente), quindi il
  tema scelto nella pagina principale non le raggiunge.
- ⚠️⚠️ **MathJax NON c'è più, e non va rimesso alla leggera.** Si mangiava una barra rovesciata
  (`\\alt` diventava `\alt`) per il suo `processEscapes`, che vale `true` di serie. In pagina non
  c'è nessuna formula, quindi scaricava 1,3 MB a ogni visita per non fare niente: toglierlo ha
  risolto il difetto e tolto codice morto.
  - **Come si è trovato**, perché il metodo vale oltre il caso: il difetto non si riproduceva in
    sviluppo, dove gli script dai CDN si inizializzano in modo diverso. Si isola con una pagina di
    prova temporanea che carica gli script **a scelta** col querystring e stampa i **codepoint**
    del testo letto dal DOM; la pagina si cancella a caso chiuso.
  - ⚠️ **Se servisse la matematica**: lo script torna con `tex: { processEscapes: false }`, o il
    difetto torna identico. E si controlla che resti l'avvio di Prism (`Prism.highlightAll`), che
    conviveva con la configurazione di MathJax nella stessa riga.
- ⚠️⚠️ **Il cache-busting (`?v=N`) NON esiste più, e non si reintroduce** (decisione dell'utente,
  su una misura). Pages serve tutto con `cache-control: max-age=600` più ETag, HTML compreso,
  quindi una copia in cache vive al massimo 10 minuti. Il `?v=N` comprava solo la coerenza dentro
  quella finestra, al prezzo di una contabilità manuale che aveva già prodotto un bump
  dimenticato. Una versione nuova può comparire in pagina con 10 minuti di ritardo, ed è
  accettato.
- ⚠️⚠️ **`index.html` NON si rigenera più da markdown: si modifica direttamente** (istruzione
  dell'utente: la pagina è diventata troppo complessa per un export). Quindi **è** la fonte, e un
  errore là non si recupera rigenerando: prima di toccarla vale l'allineamento al remoto.
- ⚠️ **Nessuna lista di lavori pendenti in un file**: `Da fare.txt` è stato eliminato
  dall'utente e non si ricrea. Un lavoro pendente si porta all'utente o nel brief, perché un file
  che nessuno rilegge invecchia.

### 🖼️ Le iconcine del testo: SVG che seguono il colore

**Com'è fatto.** Le icone dentro il testo sono **SVG inline** in `index.html`, con
`fill="currentColor"` e classe `icon-png-svg`, quindi seguono il colore del testo nei due temi.
Prima erano PNG neri, quasi invisibili al buio. Le sole raster sono le frecce di Telegram.

- **La sostituzione è invisibile nel layout** (vincolo dell'utente): ogni SVG ha gli stessi
  `width` e `height` dell'`<img>` che ha sostituito, e un `viewBox` con le proporzioni del PNG
  originale. Le frecce di Telegram sono fuori da questo conto, perché le misura il quadrato
  dell'asset. ⚠️ **L'ingombro non si tocca, la posizione verticale sì** (vedi l'allineamento
  verticale, più sotto).
  - **Per rimpicciolire un'icona senza muovere il layout** si allarga il `viewBox` in proporzione
    invece di ridurre `width`: il disegno si stringe e il testo attorno resta fermo.
- ⚠️ **Il LOGO APPLE è l'eccezione al vincolo dell'ingombro**: è più grande del 20%, perché
  accanto ai glifi della sua colonna si leggeva più piccolo di un'emoji. Non sostituisce un PNG ma
  il carattere `U+F8FF`, quindi il suo metro è ottico. L'altezza è in `em` e non in px, perché
  vive in una cella di tabella e scala col suo corpo.
  - **L'allineamento orizzontale va bene com'è** (decisione dell'utente, 2026-09-27). Il motivo
    per cui non esiste un allineamento 'al pixel': in quella colonna i glifi non condividono un
    bordo destro, perché la colonna è allineata a sinistra e ogni glifo ha la sua larghezza.
  - ⚠️ **Un glifo si misura sull'INCHIOSTRO**, con le metriche del canvas
    (`actualBoundingBoxRight`), non con `getBoundingClientRect`, che dà l'avanzamento del
    carattere con le spalle. Uno screenshot analizzato a pixel funziona ma è fragile (bordi della
    cella, antialiasing).
- **Un carattere che esiste su una sola piattaforma non si usa in pagina**: si sostituisce con
  un'icona. Per questo il logo Apple è un SVG e non il carattere `U+F8FF` dell'area privata
  Unicode, che fuori dai sistemi Apple è un quadratino vuoto (decisione dell'utente). Vale per
  qualunque glifo non universale, anche in una sostituzione nuova della tabella.
- **Non tutte le immagini del testo sono icone**: `extrachar.png` è una schermata, e resta PNG.
- ⚠️ **L'icona dell'area notifiche è eliminata e non si ricrea**: la voce 'Non disturbare' dice
  'clic sull'orologio di sistema', che nomina la cosa invece di disegnarla (scelta dell'utente).
- ⚠️ **`icona1.png`... `icona7.png` non esistono più**: non si cercano e non si ricreano (sono
  nella storia git). Le icone del testo si nominano per quello che sono, non per numero.
- **La ricarica del browser è sul modello di Chrome**: tracciato di Material Symbols, arco aperto
  con la punta triangolare, un po' più grande e più sottile delle altre, come ha chiesto l'utente.
  Il tracciato buono è **uno solo e continuo**; scartati un arco con la punta a squadra in un
  secondo path e la variante di Feather `rotate-cw`, che a 17 px si legge come una parentesi.
- ⚠️⚠️ **Le due frecce di Telegram sono PNG presi dalla UI dell'app** (`telegram_send_old.png` e
  `telegram_send_new.png`, forniti dall'utente). Nel testo la frase dice **'clic su [nuova] o
  [vecchia]'**, in quest'ordine: prima quella che si vede oggi nell'app, poi la legacy.
  - **Il PNG qui è la scelta giusta**: queste icone restano **identiche nei due temi**, quindi
    `currentColor` non serve, e il colore esatto è definito dall'asset. Scartato il ridisegno SVG a
    `#70aee7`, giudicato pessimo dall'utente.
  - ⚠️ **La nuova è quella col tondo azzurro** attorno all'aeroplanino; la legacy è la freccia verde
    acqua senza sfondo, e si mostra comunque. Quando l'ordine conta si chiede o si verifica: dai
    nomi dei file caricati non si deduce.
  - ⚠️ **Le due altezze in pagina sono diverse di proposito** (20 px la legacy, 16 la nuova), perché
    gli **inchiostri** misurino uguale: nella legacy l'inchiostro occupa 51 px su 64.
- ⚠️⚠️ **Quando il riscontro sull'aspetto di un'icona torna negativo due volte, non si fa un altro
  tentativo: si chiede l'asset all'utente**, che è graphic designer. È successo con le frecce di
  Telegram e con lo **slider diviso**, che in pagina è il **suo** disegno (due gocce con la punta in
  alto e la base arrotondata) e non si ridisegna: i tre tentativi scartati sbagliavano il margine
  attorno al disegno, e a 16 px si leggevano due triangoli stretti. Il **vuoto centrale** dello
  slider deve vedersi anche in piccolo.
- 🎨 **A 16 px la fedeltà letterale non paga**: occhio e maschera di livello sono in **negativo**
  come gli originali, con `fill-rule` `evenodd` e non con due forme sovrapposte, o il buco non è
  trasparente.
- ⚠️ **Un SVG da Illustrator si bonifica** come dice `Roccobot.md` § '🧹 Bonifica e ottimizzazione
  degli asset', con la verifica a rendering; qui in più il `fill` fisso si porta a `currentColor`,
  o l'icona non segue il tema. ⚠️⚠️ **Il confronto 'identici' può mentire**: la prima volta erano
  identici due segnaposto di immagine rotta, perché nessuna delle due si era caricata. Prima di
  fidarsi, si guarda che le immagini ci siano.
- ⚠️ **Un'icona di 16 px si giudica sui PIXEL VERI**: si rende alla misura reale e si ingrandisce
  lo screenshot di quel rendering, l'unico modo di vedere se un vuoto di 2 px sopravvive
  all'antialiasing.
- ⚠️⚠️ **ALLINEAMENTO VERTICALE: il riferimento è il centro di una MAIUSCOLA, senza overshoot**
  (criterio dell'utente: *una linea orizzontale immaginaria che taglia a metà un carattere
  maiuscolo, es. E, B, D*). Vale per ogni icona nuova, `<img>` o `<svg>`, e supera il centro della
  `o` minuscola.
  - **Perché serve**: i PNG originali erano sulla baseline, quindi ogni icona sedeva tanto più alta
    quanto più era grande; lo scarto dipendeva dalla dimensione.
  - **Come si ottiene**: `vertical-align:middle` allinea al centro della x-height, e da lì si alza
    l'icona di (cap-height meno x-height) / 2, che sul font di casa vale **0,094em** nel testo a
    16 px e **0,069em** nelle tabelle a 14,4 px. Si alza con `transform:translateY` negativo e non
    col margine (`Roccobot.md` § '🎨 Grafica'), così non si toccano i vicini né l'altezza della
    riga.
  - ⚠️⚠️ **Il valore teorico non basta: l'aggiustamento OTTICO lo dà l'utente**, perché dipende
    dalla forma del disegno. Nel CSS ogni icona ha un `--nudge`, che è la correzione **totale**
    rispetto al centro della x-height (regola più ottica), con accanto il commento che dice quanti
    pixel dell'utente vale.
  - ⚠️ **I pixel dell'utente sono a DPR 2**: uno suo vale 0,5 px CSS, cioè 0,03125em nel testo a
    16 px e 0,0347em nelle tabelle a 14,4 px. Il globo vive in una tabella: un divisore unico
    sbaglierebbe proprio lui.
  - **La taratura in vigore si legge nel CSS**, che è la fonte: se questo file e il CSS divergono
    vince il CSS. Mission Control è approvato senza spostamento; il logo Apple segue la sola regola
    generale, senza ottica.

### 🔢 Versione del progetto: VISIBILE in pagina

- ⚠️⚠️ **La versione è visibile, e valgono le regole di versione degli altri progetti**
  (`Roccobot.md` § '🌿 Workflow git e versioni') senza eccezioni, perché RoccobotOS conta come
  progetto (prima sezione).
- ⚠️ **Il numero corrente non si scrive nei file di regole**: si legge dalla costante `VERSIONE`
  di `RoccobotOS.js`, o con la sonda qui sotto. Un numero scritto qui mente al primo bump.
  - **Schema SlimVer** (`x.xx`). `2.30` succede a `2.2.3`, perché ogni `x.xx` segue ogni `x.y.z`.
    Per leggere i numeri vecchi: nato interno a due cifre (`2.0`, `2.1`), poi SemVer
    (`2.2.0`...`2.2.3`), poi SlimVer.
  - **I commit che toccano solo questo file di regole non bumpano.**
- **Il numero vive solo nella costante `VERSIONE` di `RoccobotOS.js`**, e il badge la legge a
  runtime. ⚠️ Il commento in testa al `.js` **non** contiene il numero, di proposito: sarebbe un
  secondo posto da tenere allineato.
  - ⚠️ **Gli elementi del numero nascono VUOTI in `index.html`** e il CSS li nasconde con `:empty`:
    se il JS non gira, non compare un badge senza numero, che sarebbe peggio dell'assenza.
- ⚠️⚠️ **DUE RESE ALTERNATIVE, una per formato** (mockup dell'utente), mai insieme: su **desktop**
  una **pillola** nell'angolo in alto a destra del riquadro dell'indice, sempre a schermo; su
  **mobile** il numero sopra il logo, che scorre via con la testata.
  - **La soglia è 860 px**, la stessa a cui l'indice sparisce, così le due rese non lasciano buchi:
    fra 601 e 860 px non c'è indice, e vale il numero sopra il logo.
  - ⚠️ **La pillola non può essere `absolute` dentro il riquadro**: il riquadro scorre, e lei
    scorrerebbe con le voci. È in una riga **`sticky` ad altezza zero**, che non occupa spazio e
    non sposta l'indice.
  - **Colori scelti dall'utente**: pillola bianco puro con testo `#9b9b9b` sul chiaro; al buio il
    fondo diventa il nero corrispondente e il **testo resta identico**, perché è il testo a dare
    l'identità. Il contrasto (2,8:1) è sotto soglia per scelta, con la deroga scritta qui sotto.
- 🎨 **La resa MOBILE, coi vincoli dell'utente**: visibile solo in cima, corpo leggermente più
  piccolo, in alto a sinistra sopra il logo e allineata al pixel col suo verde, solo il numero
  (niente pillola, sfondo o bordo), e deve uscire di scena scorrendo.
  - ⚠️⚠️ **'Fisso' voleva dire FERMO NEL DOCUMENTO, non incollato allo schermo**: scartato
    `position:fixed`, che lo teneva visibile per tutta la pagina. È `position:absolute` dentro
    `#markdown_content`: scorre col documento ed è fuori dal flusso, quindi non sposta nulla.
  - **`left:0; bottom:100%`** funziona perché il bordo sinistro di `#markdown_content` coincide con
    quello del logo e sopra il contenuto restano 24 px liberi, in tutti i formati: se una delle due
    cose cambia, la posizione va rifatta.
  - ⚠️ **L'allineamento col verde si verifica sull'INCHIOSTRO, non sui box**: si fotografa la
    striscia che comprende numero e logo, si cerca la prima colonna di inchiostro **pieno** di
    ciascuno ignorando l'antialiasing, e si confronta. Oggi è entro un pixel di dispositivo a ogni
    DPR. Scartato correggerlo con un `left` negativo, che peggiorerebbe gli altri DPR.
  - ⚠️⚠️ **L'opacità è `.3` sul chiaro e `.25` sullo scuro**, scelte dall'utente su mockup a
    confronto, e il contrasto axe-core **non passa** in nessuno dei due: è una deroga **voluta**,
    e il gate qui segnala senza vietare. ⚠️ **Non si alzano perché un audit le segnala.**
    - **Due valori** perché il fondo nero abbassa già la resa percepita; scartato `.4` uguale nei
      due temi. La deroga vale circa 1,6:1 sul chiaro e 2,2:1 sullo scuro, contro i 4,5:1 del
      criterio.
    - **Perché regge qui e non altrove**: il numero di versione non è contenuto da leggere per usare
      il sito. La stessa opacità su un testo della pagina sarebbe un difetto.
    - ⚠️ **Una deroga chiesta non si estende a quello che nessuno ha chiesto**: al primo giro
      l'opacità bassa era copiata dai toggle, e là il gate aveva ragione.
    - ⚠️ **Le varianti visive si mostrano, non si chiedono a parole**: si iniettano i valori a
      runtime nella pagina servita in locale, senza committare, col conto del contrasto accanto.
      Le due proposte a parole (0,2 e 0,15) sono state corrette entrambe guardando le immagini.
  - **`pointer-events:none`**: non è un comando, e il numero è appoggiato sopra il link del logo,
    di cui mangerebbe una parte cliccabile.
  - **Non si stampa** (`@media print`).
  - ⚠️ **Scartata la posizione in alto a destra**, accanto al vecchio tasto del tema: copriva la
    punta della foglia della mela del logo. **La prova da rifare quando si sposta qualcosa lì**:
    nascondere l'elemento, fotografare l'area che occupava allargata di 2 px, contare i pixel
    diversi dallo sfondo, e pretendere **0**. La sovrapposizione dei box non è quella
    dell'inchiostro, e sul box larghissimo e quasi vuoto del logo un test sui rettangoli dà falsi
    allarmi.
- **Sonda di pubblicazione**:
  `curl -s https://roccobot.github.io/RoccobotOS/RoccobotOS.js | grep -o 'VERSIONE = "[^"]*"'`.
  ⚠️ Non `head -c 30`: il commento in testa non contiene il numero, e chi usa quel comando crede che
  il deploy non sia passato.

### 🎛️ Comandi e controlli fissi

- **Quali sono.** Su smartphone **tre**: l'indice in basso a **sinistra**, inizio e fine pagina in
  basso a **destra**. Su desktop i soli due salti, in basso a destra. I tasti del tema e delle
  tabelle esistono nel codice ma sono spenti dai loro flag (prima sezione).
  - **Inizio e fine pagina sono a destra in entrambi i formati** (richiesta dell'utente): il
    criterio è la coerenza dei tasti di scorrimento fra i formati, preferita alla continuità con la
    disposizione di prima.
- ⚠️ **Una sola regola di visibilità per i due formati**: i comandi compaiono **mentre si scorre** e
  spariscono dopo **3 secondi** di quiete. Fra i formati cambia solo **quali** comandi esistono,
  non **quando** si vedono.
  - Ognuno in più si nasconde quando non porta da nessuna parte: 'in cima' se si è già in cima,
    'in fondo' se si è già in fondo, l'indice quando l'indice è aperto.
  - **All'apertura su smartphone non si vede nessun comando**, indice compreso: segue da 'appare
    allo scorrimento', come l'utente l'ha chiesto.
  - ⚠️ **Le funzioni che aprono e chiudono l'indice chiamano `aggiornaComandi()`**, o il pulsante
    resta sopra il pannello. Il primo scorrimento successivo rimette tutto a posto da solo, quindi
    una prova frettolosa non lo vede.
- ⚠️⚠️ **Tentativo scartato, perché il codice da solo non lo racconta**: un gruppo di sinistra
  (tema più indice) visibile a pagina **ferma**, l'opposto della destra, con un solo temporizzatore
  per i due lati. Il pannello dell'indice arriva in fondo allo schermo, e i due tasti in
  quell'angolo gliene coprivano la parte bassa: si è sacrificato il tasto del tema, e l'indice è
  passato alla regola di destra. Chi vuole riprovare la simmetria risolve prima quel difetto.
- ⚠️ **La dissolvenza segue il lato**: il JS scrive `translateX(var(--hide-shift))` e il valore lo
  dà il CSS, positivo per i tasti di destra e **negativo** per quelli di sinistra, o escono
  attraversando lo schermo. È una logica sola per tutti i tasti, invece di un ramo per lato.
- ⚠️ **La distanza dal fondo del tasto indice è scritta due volte**, nella media query e in una
  regola più in basso nel file, e vince la seconda: si cambiano tutte e due, o il tasto non si
  sposta.
- ⚠️ **L'evidenziazione del tocco si spegne a mano** (`-webkit-tap-highlight-color`) sui comandi
  fissi, sul link di salto, sulla griglia 'Indice' e sul FAB delle sotto-pagine: su Android il
  rettangolo del tocco ignora il `border-radius` e copre un comando tondo con un quadrato, e non è
  né un `outline` né un `background`. Resta sui link del testo, dove è un riscontro utile.
- **`⌘`/`Ctrl` + freccia su o giù** portano in cima e in fondo, con `preventDefault` sulla
  scorciatoia del browser (voluto). Il salto da tastiera è **istantaneo** e quello dei pulsanti
  **fluido**, come su 'I Grandi di Arda'.
- **Verifica da rifare se si tocca un tasto fisso**: misurare i comandi a metà pagina, dove sono
  tutti visibili, e controllare che nessuna coppia si sovrapponga, nei due formati.
- **Tasto `T`: cambia tema al volo**, come su 'I Grandi di Arda' (richiesta dell'utente). Tasto
  **nudo**, quindi vale dove c'è una tastiera.
  - ⚠️ **Due guardie obbligatorie**: si esce se è premuto un **modificatore** (o si rubano le
    scorciatoie del browser) e se il focus è in un **campo di testo** (o scrivere una 't'
    commuterebbe il tema).
  - Riusa la funzione del pulsante del tema, che esiste anche col pulsante spento, ed eredita il
    blocco di 1,5 secondi sul cambio di tema di sistema: senza, una preferenza di sistema che scatta
    subito dopo riporterebbe indietro il tema appena scelto.

### ⌨️ Tabella delle sostituzioni testo

**Com'è fatto.** La tabella sotto il titolo `Sostituzione testo` è il **dump delle sostituzioni
configurate dall'utente in macOS** (Impostazioni di sistema, Tastiera, Testo), non un contenuto
redazionale. Si aggiorna quando lui ne manda lo screenshot, e le righe si mettono **per gruppi e in
ordine alfabetico**, non nell'ordine del pannello (decisione dell'utente, 2026-09-27).

- **Tre coppie di colonne affiancate**, raggruppate per somiglianza: tasti e simboli di sistema,
  segni ed emoji, testo e nomi con diacritici. Dentro ciascun gruppo l'ordine è alfabetico.
  - **Il gruppo dei segni ha un ordine suo**: prima i simboli e le frecce, poi le emoji, col
    **cuore** come prima emoji; dentro le emoji di nuovo alfabetico (istruzione dell'utente).
  - ⚠️ **Chi rinomina un'abbreviazione sposta anche la riga** al suo posto alfabetico: la tabella
    resta plausibile a occhio anche con l'ordine rotto.
- ⚠️ **I caratteri vietati dalle regole si scrivono come ENTITÀ HTML**, non letterali: la
  sostituzione `\\-` produce il tratto lungo tre em, e `&#x2E3B;` lo rende in pagina senza mettere
  il carattere nel sorgente. La pagina resta fedele alla configurazione senza chiedere l'esenzione
  'tabella di caratteri'. Un glifo che esiste su una sola piattaforma diventa un'icona (vedi le
  iconcine).
- **Le abbreviazioni cominciano con DUE barre rovesciate letterali** (`\\cmd`, `\\esc`, `\\apple`),
  non con le parentesi angolari (scelta dell'utente). Il vantaggio è pratico: `<cmd>` in HTML va
  scritto con `&lt;` e `&gt;`, o il browser lo legge come un tag e lo cancella.
- **Il plist vive in `OS Files/Text Replacements.plist`** ed è scaricabile dalla pagina. ⚠️ La
  tabella è la fonte e il plist il prodotto: **si rigenera dalla tabella** a ogni modifica, mai a
  mano, o le due cose divergono in silenzio. Nel plist i caratteri vietati e quelli dell'area
  privata sono **riferimenti numerici** (`&#x2014;`, `&#xF8FF;`), che l'XML risolve nel glifo
  giusto.
  - ⚠️⚠️ **Il formato è quello dell'ESPORTAZIONE**: un array di dizionari con le chiavi `shortcut`
    e `phrase`. Scartata la forma `NSUserDictionaryReplacementItems` (`on`, `replace`, `with`),
    che è la copia nelle preferenze: il pannello la rifiuta in silenzio.
  - ⚠️ **Nel plist il logo Apple torna il carattere `U+F8FF`**, perché là serve alla tastiera:
    l'icona SVG è una scelta della pagina, non del sistema.
- ⚠️⚠️ **ECCEZIONE DICHIARATA, da non 'correggere'**: sono legittimi l'accento acuto isolato nelle
  **tabelle dei caratteri** (`Characters.html` e `index.html`), che ne documentano la scorciatoia,
  e la sequenza `E'` nella **cella** che dice come si digita `È` e nel campo `shortcut` del
  **plist**, dove è il testo che si batte perché macOS lo sostituisca. Correggerli romperebbe la
  sostituzione.
  - Un commit che tocca **quelle righe** viene bloccato dal presidio sul diff, e ha ragione: si
    guarda la riga e si prosegue a mano, senza allentare il controllo per tutti.
- ⚠️⚠️ **L'importazione è documentata da Apple ma è INAFFIDABILE**, e la pagina lo dice.
  - ✅ **Col formato giusto funziona**: l'utente ha importato il file su macOS 26.6, 63 voci in un
    colpo, senza errori. Il limite oltre il quale diventa imprevedibile è più in alto.
  - **Il `+` del puntatore non è una conferma**: dice che la finestra accetta un file, non che quel
    file è valido.
  - **Due cause silenziose**: struttura sbagliata del plist e XML non valido (`&` e `<` non scritti
    come entità). Nessuna delle due dà un avviso.
  - **Oltre le poche decine di voci non è questione di formato**: un centinaio passa quasi sempre,
    sull'ordine del migliaio l'esito è imprevedibile e a volte **azzera l'elenco**. Fonte: Adam
    Engst su TidBITS, 4 maggio 2026.
  - **Da terminale non si scrive**: le voci messe nel dominio globale spariscono all'apertura del
    pannello. L'archivio vero è `~/Library/KeyboardServices/TextReplacements.db`, sincronizzato da
    CloudKit, senza interfaccia pubblica.

### 🌐 Tabelle dei servizi DNS

- **Due tabelle gemelle** in fondo alla pagina (sezione `DNS`), una per gli IPv4 (con la colonna
  `TLS auth name`) e una per gli IPv6: **elencano sempre gli stessi servizi, nello stesso ordine**.
  Ordine **alfabetico naturale**, coi numeri letti come numeri (`Quad9` prima di `Quad101`). Un
  valore assente si scrive `-`, mai una cella vuota.
- **Note in calce con richiamo**: le avvertenze su un servizio vanno in una nota sotto le tabelle,
  richiamata da un simbolo accanto al nome (`†`, `‡`...), non nella cella.
- **Indirizzi superati: si aggiornano in autonomia** (istruzione durevole dell'utente). Quando un
  servizio è vivo ma gli indirizzi sono la generazione dismessa, si mettono quelli ufficiali
  correnti senza chiedere. La riga si cancella solo per un servizio **cessato**. Tre casi da
  distinguere: servizio chiuso, attivo con indirizzi cambiati, attivo con nome o proprietario
  cambiato (si rinomina la riga e si spiega il passaggio in nota).
- **Verifica delle fonti.** Gli indirizzi si prendono **solo** dalla documentazione ufficiale del
  servizio, mai a memoria.
  - ⚠️ **Dal container il test via UDP 53 non vale**: la rete dirotta le query DNS e risponde 'OK'
    anche per un indirizzo di controllo come `203.0.113.99`, e il DoT su TCP 853 è bloccato.
  - **L'unica verifica attendibile è DoH su HTTPS**, che passa dal proxy: interrogando l'endpoint
    DoH del servizio si accerta che sia vivo e che filtri davvero (un dominio pubblicitario noto
    torna `NXDOMAIN` o `0.0.0.0`, un dominio innocuo risolve).
