# Removed.md: le cose tolte da RoccobotOS, e come si recuperano

> **Cos'è questo file.** L'archivio di quello che è uscito dal sito: per ogni cosa tolta, che cosa
> faceva, quando è stata tolta, e da quale commit si recupera. Si legge su richiesta, quando
> qualcuno vuole riportare indietro una funzione o capire dove viveva.
> ⚠️ **Nei file di regole resta solo la decisione** (che la cosa non c'è più, e perché): ogni
> appunto su come recuperarla vive qui, corto o lungo che sia (regola universale in
> `rules/Roccobot.md` di `Roccobot/tools`, § '🗄️ Le cose tolte vivono in Removed.md').
> Le voci vanno dalla più recente alla più vecchia.

## 🎨 I colori passati degli stili

- **Che cosa sono**: i valori di colore che la regola anti-jitter di `Rules.md` (§ '🎨 La
  styleguide e i valori visivi') citava con la versione dello stile in cui erano entrati. Nella
  regola restano i valori in vigore; qui la cronologia di quelli sostituiti. La cronologia
  completa, versione per versione, è anche in `styles/README.md` e nei commenti dello stile
  predefinito.
- **Sostituiti fra il 2026-10-23 e il 2026-10-24**, dalla `1.55` alla `1.68` dello stile:
  - **`1.55`**: il testo evidenziato diventa testo normale, il pulsante Copia sparisce dai
    blocchi che scorrono in orizzontale, la barra di scorrimento dei blocchi di codice si
    nasconde; i blocchi scuri passano a verde oliva `#3D4639`;
  - **`1.60`**: i blocchi di codice in tema scuro passano dall'oliva `#3D4639` al verde grigio
    `#384541`, che è ancora in vigore;
  - **`1.63`**, solo tema scuro: il codice in riga passa dal salvia `#79A279` con testo `#08171A`
    al verde `#64C486`, e gli H2 (col segno § e il bordo del riquadro ATTENZIONE!) dall'ambra
    `#E8B86A` (9,23:1) alla sabbia `#CEB285`, ancora in vigore;
  - **`1.64`**, solo tema chiaro: il fondo pagina passa da `#F7F8F5` ad avorio `#F8F7F2`, l'indice
    e i blocchi di codice da `#E6F4F0` a salvia `#EAF1E8`, le righe pari delle tabelle da `#F1F4F0`
    a `#F3F2ED`, le colonne strette da `#FAFDFA` a `#FDFCF7`, e il codice in riga da `#C3DDD3` con
    `#06120C` a pesca `#FFE1B8` con `#000000`;
  - **`1.68`**: il codice in riga scuro diventa `#6CBC88`, cioè il `#64C486` della `1.63` con la
    saturazione abbassata del 17%.
- **La misura della regola**: dalla `1.54` alla `1.68` gli stili la rispettavano (la regola lo
  diceva con quei numeri); le `1.51` e `1.53`, che la violavano, restano citate nella regola,
  perché ne sono la ragione.
- **Si recuperano dai genitori dei commit di `main` che li hanno sostituiti** (il repo non ha
  tag); ogni stile vive nel file col suo numero, rinominato a ogni versione:
  - prima della `1.55`: `git show 7f14f17^:Styles/RoccobotOS154.css`;
  - l'oliva scuro della `1.55`-`1.59`: `git show c64b33d^:Styles/RoccobotOS159.css`;
  - il salvia scuro e l'ambra fino alla `1.62`: `git show 0f659dd^:Styles/RoccobotOS162.css`;
  - il tema chiaro fino alla `1.63`: `git show 04e8bd2^:Styles/RoccobotOS163.css`;
  - il `#64C486` della `1.63`-`1.67`: `git show 8b0b0d2^:Styles/RoccobotOS167.css`.

## 📄 Il vecchio `Styleguide.md`

- **Che cosa faceva**: era la styleguide del sito in Markdown, con i colori come tabella di
  codici esadecimali, che non fa vedere un colore. L'ha sostituita `Styleguide.html`, dove ogni
  token è un campione sui due fondi veri del sito.
- **Tolto nella `3.50`** (2026-08-02); il vecchio indirizzo non risponde più, e i rimandi sono
  stati aggiornati in tre file nello stesso commit.
- **Si recupera dal commit `7028aac^`**, cioè il genitore del commit di `main` della `3.50` (il
  repo non ha tag). Dove viveva: `Styleguide.md` alla radice del sito, 291 righe.
- Il comando che lo mostra: `git show 7028aac^:Styleguide.md`.

## ⚓ Le ancore invisibili dell'export

- **Che cosa facevano**: l'export da Markdown metteva in ogni titolo un'ancora invisibile
  (`<a id="..." class="anchor" aria-hidden="true">` con dentro uno `<span class="octicon
  octicon-link">`), vestita da cinque regole CSS. Le sotto-pagine avevano in più gli `id`
  `toc_N`.
- **Tolte nella `3.20`** (2026-08-01): 115 ancore in `index.html` (17,2 KB) con le cinque regole,
  e 38 `id` `toc_N` nelle sotto-pagine. Le ancore fatte a mano sono rimaste, e la regola dice
  perché (`Rules.md` § '🧹 Il CSS: che cosa si pota e che cosa no').
- **Si recuperano dal commit `abb3e4d^`**, cioè il genitore del commit di `main` della `3.20` (il
  repo non ha tag). Dove vivevano: `index.html`, `RoccobotOS.css` (le cinque regole) e le
  sotto-pagine `AdServers.html`, `Characters.html` e `Formats.html`.
- Il comando che mostra la pagina di allora: `git show abb3e4d^:index.html`.

## 🍏 Il logo `RoccobotOS.svg`

- **Che cosa faceva**: era il logo della testata, caricato da `index.html` con un
  `<img src="RoccobotOS.svg">`. Un `<img>` non si ricolora, quindi in tema scuro non seguiva il
  tema: il perché resta in `Rules.md` § '🎨 La styleguide e i valori visivi'.
- **Tolto nella `3.10`** (2026-08-01), quando il logo è diventato SVG inline ricolorabile.
- **Si recupera dal commit `d523f40^`**, cioè il genitore del commit di `main` della `3.10` (il
  repo non ha tag). Dove viveva: `RoccobotOS.svg` alla radice del sito, 23 righe, e l'`<img>` in
  testa a `index.html`.
- Il comando che lo estrae: `git show d523f40^:RoccobotOS.svg > RoccobotOS.svg`.

## 🧮 MathJax

- **Che cosa faceva**: rendeva le formule TeX della pagina, caricato da un CDN. In pagina non
  c'era nessuna formula, e il suo `processEscapes`, acceso di serie, si mangiava una barra
  rovesciata: il perché della decisione resta in `Rules.md` § '🚩 Flag, sotto-pagine e decisioni
  da non rovesciare'.
- **Tolto nella `3.00`** (2026-08-01).
- **Si recupera dal commit `0127581^`**, cioè il genitore del commit di `main` della `3.00` (il
  repo non ha tag). Dove viveva:
  - in `index.html`, in testa, due `<script>` con la configurazione `window.MathJax` e il
    caricamento di `mathjax@3/es5/tex-chtml-full.js` da jsDelivr;
  - ⚠️ **l'avvio di Prism (`Prism.highlightAll`) conviveva con la configurazione di MathJax nella
    stessa riga**: chi rimette MathJax controlla che resti;
  - `BackslashTest.html`, la pagina di prova che ha isolato il difetto, tolta nello stesso commit.
- Il comando che mostra la pagina di allora: `git show 0127581^:index.html`.

## 🔔 L'icona dell'area notifiche

- **Che cosa faceva**: era un'iconcina SVG inline (classe `ic-notify`, `aria-label` 'icona area
  notifiche', sei rettangoli in tre righe) nella voce 'Non disturbare' della sezione Barra dei
  menu, che diceva *clic su [icona]*.
- **Tolta nella `2.41`** (2026-08-01): l'utente ha riscritto la frase in *clic sull'orologio di
  sistema*, che nomina la cosa invece di disegnarla, e l'icona è uscita con lei.
- **Si recupera dal commit `1694655^`**, cioè il genitore del commit di `main` della `2.41` (il
  repo non ha tag). Dove viveva: l'`<svg>` dentro la voce 'Non disturbare' di `index.html`, e la
  sua classe in un commento di `RoccobotOS.css`.
- Il comando che mostra la pagina di allora: `git show 1694655^:index.html`.

## 🖼️ Le icone PNG del testo

- **Che cosa facevano**: `icona1.png`... `icona7.png` erano le iconcine dentro il testo di
  `index.html`, PNG neri, quasi invisibili al buio.
- **Tolte il 2026-07-31**, quando le iconcine sono diventate SVG inline che seguono il colore del
  testo (`Rules.md` § '🖼️ Le iconcine del testo: SVG che seguono il colore').
- **Si recuperano dal commit `34cc56c^`**, cioè il genitore del commit di `main` che le ha tolte
  (il repo non ha tag). Dove vivevano: i sette file alla radice del sito, richiamati dalle `<img>`
  di `index.html`.
- Il comando che ne estrae una: `git show 34cc56c^:icona1.png > icona1.png`.

## 📝 `Da fare.txt`

- **Che cosa faceva**: era una lista di lavori pendenti, in un file di testo accanto al sito.
  Conteneva due voci: rendere le iconcine come SVG che cambiano colore col tema, e il nome delle
  sezioni (cioè l'ultimo segmento dell'indirizzo dopo un clic sull'indice).
- **Eliminato dall'utente il 2026-07-30**: la decisione di non ricrearlo, col perché, resta in
  `Rules.md` § '🚩 Flag, sotto-pagine e decisioni da non rovesciare'.
- **Si recupera dal commit `dff880f^`**, cioè il genitore del commit di `main` che l'ha
  cancellato (il repo non ha tag). Dove viveva: `Da fare.txt` alla radice del sito (allora
  `RoccobotOS/Da fare.txt` nell'hub).
- Il comando che lo mostra: `git show "dff880f^:Da fare.txt"`.
